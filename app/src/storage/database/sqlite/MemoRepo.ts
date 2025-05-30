import type { ListMemosQuery, Memo, MemoID, MemoList } from "@/domain/Memo"
import type { Pagination } from "@/domain/Pagination"
import type { TagList } from "@/domain/Tag"
import type { Context } from "@/lib/context"
import type { DBExec } from "@/lib/database"
import {
    type AsyncResult,
    Err,
    Ok,
    fmtErr,
    fromPromise,
    mapResult,
    match,
} from "@/lib/result"

import { newID } from "@/domain/ID"
import { decodeText, encodeText } from "@/lib/textencoding"

import * as queries from "./gen/memos_sql"
import { calendarDateTimeToSQLite } from "./types/calendardatetime"
import { prepareFTSQueryString } from "./types/ftsquery"

export interface CreateMemoRequest {
    content: string
    createdAt?: Date
    id?: MemoID
}

export interface UpdateMemoContentRequest {
    id: MemoID
    content: string
}

export interface ListTagsQuery {
    pageSize: number
    pageAfter?: string
}

export class MemoRepo {
    private _db: DBExec

    constructor(db: DBExec) {
        this._db = db
    }

    public async getMemo(
        ctx: Context<{ db?: DBExec }>,
        memoID: MemoID,
    ): AsyncResult<Memo> {
        return match(
            fromPromise(
                queries.getMemo(
                    ctx.getData("db", this._db),
                    { publicId: memoID },
                    ctx.signal,
                ),
            ),
            async (row) => {
                if (row === null) {
                    return Err<Memo>(new Error(`memo not found: ${memoID}`))
                }

                return Ok<Memo>({
                    ...row,
                    id: row.publicId,
                    content: decodeText(row.content),
                })
            },
            async (err) =>
                fmtErr<Memo>(`error getting memo ${memoID}: %w`, err),
        )
    }

    public async listMemos(
        ctx: Context<{ db?: DBExec }>,
        {
            pagination,
            filter,
        }: {
            pagination: Pagination<Date>
            filter?: ListMemosQuery
        },
    ): AsyncResult<MemoList> {
        type MemoRow = {
            publicId: string
            content: Uint8Array<ArrayBufferLike>
            isArchived: boolean
            isDeleted: boolean
            createdAt: Date
            updatedAt: Date
        }

        type Query = queries.ListMemosArgs & { search?: string; tag?: string }

        let query: Query = {
            pageAfter: pagination.after,
            pageSize: pagination.pageSize,

            search:
                typeof filter?.query !== "undefined"
                    ? prepareFTSQueryString(filter.query)
                    : undefined,

            tag: filter?.tag,

            withCreatedAt: typeof filter?.exactDate !== "undefined",
            createdAt: filter?.exactDate
                ? calendarDateTimeToSQLite(filter.exactDate)
                : undefined,

            withCreatedAtOrOlder: typeof filter?.startDate !== "undefined",
            createdAtOrOlder: filter?.startDate
                ? calendarDateTimeToSQLite(filter.startDate)
                : undefined,

            withIsArchived: typeof filter?.isArchived !== "undefined",
            isArchived: filter?.isArchived ?? false,

            withIsDeleted: typeof filter?.isDeleted !== "undefined",
            isDeleted: filter?.isDeleted ?? false,
        }

        let listFn: <Q extends Query>(
            db: DBExec,
            query: Q,
            signal?: AbortSignal,
        ) => Promise<MemoRow[]> = queries.listMemos

        if (filter?.query && filter.tag) {
            listFn = (db, query, signal) =>
                queries.listMemosForTagWithSearch(
                    db,
                    query as queries.ListMemosForTagWithSearchArgs,
                    signal,
                )
        } else if (filter?.query && !filter.tag) {
            listFn = (db, query, signal) =>
                queries.listMemosWithSearch(
                    db,
                    query as queries.ListMemosWithSearchArgs,
                    signal,
                )
        } else if (filter?.tag) {
            listFn = (db, query, signal) =>
                queries.listMemosForTag(
                    db,
                    query as queries.ListMemosForTagArgs,
                    signal,
                )
        }

        let rows = await fromPromise(
            listFn(ctx.getData("db", this._db), query, ctx.signal),
        )

        return mapResult(rows, (memos) => ({
            items: memos.map((m) => ({
                ...m,
                id: m.publicId,
                content: decodeText(m.content),
            })),
            next: memos.at(-1)?.createdAt,
        }))
    }

    public async createMemo(
        ctx: Context<{ db: DBExec }>,
        memo: CreateMemoRequest,
    ): AsyncResult<Memo> {
        let inserted = await fromPromise(
            queries.createMemo(
                ctx.getData("db", this._db),
                {
                    publicId: memo.id ?? newID(),
                    content: encodeText(memo.content),
                    createdAt: memo.createdAt ?? new Date(),
                },
                ctx.signal,
            ),
        )
        if (!inserted.ok) {
            return inserted
        }

        if (inserted.value === null) {
            return Err(new Error("error creating Memo"))
        }

        let createdRow = await fromPromise(
            queries.getMemo(ctx.getData("db", this._db), {
                publicId: inserted.value.publicId,
            }),
        )
        if (!createdRow.ok) {
            return createdRow
        }

        if (createdRow.value === null) {
            return Err(new Error("error creating Memo"))
        }

        let created = {
            ...createdRow.value,
            id: createdRow.value.publicId,
            content: decodeText(createdRow.value.content),
        }

        let updated = await this._updateTags(ctx, created)
        if (!updated.ok) {
            return updated
        }

        return Ok(created)
    }

    public async updateMemoContent(
        ctx: Context<{ db: DBExec }>,
        memo: UpdateMemoContentRequest,
    ): AsyncResult<void> {
        let updated = await fromPromise(
            queries.updateMemoContent(
                ctx.getData("db", this._db),
                {
                    publicId: memo.id,
                    content: encodeText(memo.content),
                },
                ctx.signal,
            ),
        )

        if (!updated.ok) {
            return updated
        }

        if (updated.value === 0) {
            return Err(
                new Error(`error updating Memo: Memo not found: ${memo.id}`),
            )
        }

        await this._updateTags(ctx, memo)

        return Ok(undefined)
    }

    public async updateMemoArchiveStatus(
        ctx: Context<{ db: DBExec }>,
        { id: memoID, isArchived }: { id: MemoID; isArchived: boolean },
    ): AsyncResult<void> {
        let updated = await fromPromise(
            queries.seteMemoArchiveStatus(
                ctx.getData("db", this._db),
                {
                    publicId: memoID,
                    isArchived,
                },
                ctx.signal,
            ),
        )
        if (!updated.ok) {
            return updated
        }

        if (updated.value === 0) {
            return Err(
                new Error(
                    `error updating Memo archive status: Memo not found: ${memoID}`,
                ),
            )
        }

        return Ok(undefined)
    }

    public async deleteMemo(
        ctx: Context<{ db: DBExec }>,
        memoID: MemoID,
    ): AsyncResult<void> {
        let updated = await fromPromise(
            queries.setMemoDeletionStatus(
                ctx.getData("db", this._db),
                {
                    publicId: memoID,
                    isDeleted: true,
                },
                ctx.signal,
            ),
        )
        if (!updated.ok) {
            return updated
        }

        if (updated.value === 0) {
            return Err(
                new Error(
                    `error marking Memo as deleted: Memo not found: ${memoID}`,
                ),
            )
        }

        let deletedTags = await fromPromise(
            queries.deleteMemoTagConnections(
                ctx.getData("db", this._db),
                { memoId: memoID },
                ctx.signal,
            ),
        )
        if (!deletedTags.ok) {
            return deletedTags
        }

        await queries.updateTagCount(
            ctx.getData("db", this._db),
            {
                tags: [...deletedTags.value.map((r) => r.tag)],
            },
            ctx.signal,
        )

        await queries.cleanupTagsWithNoCount(ctx.getData("db", this._db))

        return Ok(undefined)
    }

    public async undeleteMemo(
        ctx: Context<{ db: DBExec }>,
        memoID: MemoID,
    ): AsyncResult<void> {
        let updated = await fromPromise(
            queries.setMemoDeletionStatus(
                ctx.getData("db", this._db),
                {
                    publicId: memoID,
                    isDeleted: false,
                },
                ctx.signal,
            ),
        )
        if (!updated.ok) {
            return updated
        }

        if (updated.value === 0) {
            return Err(
                new Error(
                    `error removing Memo being marked as deleted: Memo not found: ${memoID}`,
                ),
            )
        }

        let memo = await this.getMemo(ctx, memoID)
        if (!memo.ok) {
            return memo
        }

        let updateTagsResult = await this._updateTags(ctx, memo.value)
        if (!updateTagsResult.ok) {
            return updateTagsResult
        }

        return Ok(undefined)
    }

    public async listTags(
        ctx: Context<{ db: DBExec }>,
        query: ListTagsQuery,
    ): AsyncResult<TagList> {
        let result = await fromPromise(
            queries.listTags(
                ctx.getData("db", this._db),
                {
                    pageSize: query.pageSize,
                    pageAfter: query.pageAfter ?? "",
                },
                ctx.signal,
            ),
        )

        return mapResult(result, (tags) => ({
            items: tags,
            next: tags.at(-1)?.tag,
        }))
    }

    public async cleanupDeletedMemos(
        ctx: Context<{ db: DBExec }>,
    ): AsyncResult<number> {
        return fromPromise(
            queries.cleanupDeletedMemos(
                ctx.getData("db", this._db),
                ctx.signal,
            ),
        )
    }

    private async _updateTags(
        ctx: Context<{ db: DBExec }>,
        memo: Pick<Memo, "content" | "id">,
    ): AsyncResult<void> {
        let tags = extractTags(memo.content)

        let deletedTags = await fromPromise(
            queries.cleanupeMemoTagConnection(
                ctx.getData("db", this._db),
                {
                    memoId: memo.id,
                    tags: tags,
                },
                ctx.signal,
            ),
        )
        if (!deletedTags.ok) {
            return deletedTags
        }

        for (let tag of tags) {
            let createTagResult = await fromPromise(
                queries.createTag(
                    ctx.getData("db", this._db),
                    { tag },
                    ctx.signal,
                ),
            )
            if (!createTagResult.ok) {
                return createTagResult
            }

            let createResult = await fromPromise(
                queries.createMemoTagConnection(
                    ctx.getData("db", this._db),
                    {
                        memoId: memo.id,
                        tag,
                    },
                    ctx.signal,
                ),
            )
            if (!createResult.ok) {
                return createResult
            }
        }

        let updateResult = await fromPromise(
            queries.updateTagCount(
                ctx.getData("db", this._db),
                {
                    tags: [...deletedTags.value.map((r) => r.tag), ...tags],
                },
                ctx.signal,
            ),
        )
        if (!updateResult.ok) {
            return updateResult
        }

        return fromPromise(
            queries.cleanupTagsWithNoCount(
                ctx.getData("db", this._db),
                ctx.signal,
            ),
        )
    }
}

const tagPattern = /(?:^|[ \t])#([\p{L}\p{N}/\-_]+)/gmu

function extractTags(content: string): string[] {
    let tags = []

    let stripped = splitByCodeBlocks(content).join("\n")

    tagPattern.lastIndex = 0
    let found = tagPattern.exec(stripped)

    while (found !== null) {
        tags.push(found[1])
        found = tagPattern.exec(stripped)
    }

    return tags
}

const codeBlockPattern = /```[\w]*/g
function splitByCodeBlocks(content: string): string[] {
    codeBlockPattern.lastIndex = 0

    let codeBlockPos = codeBlockPattern.exec(content)
    if (!codeBlockPos) {
        return [content]
    }

    let blocks: string[] = []

    let start = 0
    let i = 0

    while (codeBlockPos !== null) {
        let pos = codeBlockPos.index

        if (i % 2 === 0) {
            blocks.push(content.substring(start, codeBlockPos.index))
            start = codeBlockPos.index + codeBlockPos[0].length
        }

        codeBlockPos = codeBlockPattern.exec(content)
        i++

        if (codeBlockPos === null && pos < content.length) {
            blocks.push(content.substring(pos))
        }
    }

    return blocks
}

if (import.meta.vitest) {
    const { test, assert } = import.meta.vitest
    test.each([
        ["Empty String", "", []],
        ["Tag Only", "#tag-a", ["tag-a"]],
        ["Unicode Char", "#täg-ü", ["täg-ü"]],
        ["Mixed Case", "#Tag/Foo", ["Tag/Foo"]],
        [
            "Tag with Number",
            "#tag-23281311 #342312",
            ["tag-23281311", "342312"],
        ],
        [
            "Text with Inline Tags",
            "Testing inline #tag-b within a text #tag-c. This should be#ignored",
            ["tag-b", "tag-c"],
        ],
        [
            "Tags on new Line",
            `# Heading
        First line content
        #tag-d #tag-e

        Some more content
        	#tag-f
        `,
            ["tag-d", "tag-e", "tag-f"],
        ],
        [
            "Ingnore Markdown Headings",
            `# Heading 1
        Content line 1

        ## Heading 2
        Content line 2

        ### Heading 3
        Content line 3
        `,
            [],
        ],
        [
            "Ignore # in URL",
            `https://www.w3.org/TR/wot-thing-description/#sec-core-vocabulary-definition
                     https://www.w3.org/TR/json-ld11/#expanded-document-form`,
            [],
        ],
        [
            "Ignore # in Code Blocks",
            `# Code Block Test
\`\`\`bash
#!/bin/bash

# comment
echo "# testing"

#this-should be ignored, #and-this-too
\`\`\`

#this-should-be-included
`,
            ["this-should-be-included"],
        ],
    ])("extractTags/%s", (_, input, exp) => {
        let actual = extractTags(input)
        assert.deepEqual(actual, exp)
    })
}
