import { markdownLanguage } from "@codemirror/lang-markdown"
import { newID } from "@/domain/ID"
import {
    ErrMemoNotFound,
    type ListMemosQuery,
    type Memo,
    type MemoID,
    type MemoList,
} from "@/domain/Memo"
import type { Pagination } from "@/domain/Pagination"
import type { TagList } from "@/domain/Tag"
import type { Context } from "@/lib/context"
import type { DBExec } from "@/lib/database"
import { type AsyncResult, Err, fromPromise, Ok, wrapErr } from "@/lib/result"
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

    public async getMemo(ctx: Context<{ db?: DBExec }>, memoID: MemoID): AsyncResult<Memo> {
        let [row, err] = await fromPromise(
            queries.getMemo(ctx.getData("db", this._db), { publicId: memoID }, ctx.signal),
        )

        if (err) {
            return wrapErr`error getting memo ${memoID}: ${err}`
        }

        if (row === null) {
            return wrapErr`${new ErrMemoNotFound()}: ${memoID}`
        }

        return Ok<Memo>({
            ...row,
            id: row.publicId,
            content: decodeText(row.content),
        })
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
            createdAt: filter?.exactDate ? calendarDateTimeToSQLite(filter.exactDate) : undefined,

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
                queries.listMemosWithSearch(db, query as queries.ListMemosWithSearchArgs, signal)
        } else if (filter?.tag) {
            listFn = (db, query, signal) =>
                queries.listMemosForTag(db, query as queries.ListMemosForTagArgs, signal)
        }

        let [rows, err] = await fromPromise(listFn(ctx.getData("db", this._db), query, ctx.signal))

        if (err) {
            return wrapErr`error listing memos: ${err}`
        }

        return Ok({
            items: rows.map((m) => ({
                ...m,
                id: m.publicId,
                content: decodeText(m.content),
            })),
            next: rows.at(-1)?.createdAt,
        })
    }

    public async createMemo(
        ctx: Context<{ db: DBExec }>,
        memo: CreateMemoRequest,
    ): AsyncResult<Memo> {
        let [inserted, err] = await fromPromise(
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
        if (err) {
            return wrapErr`error creating memo: ${err}`
        }

        if (inserted === null) {
            return Err(new Error("error creating Memo"))
        }

        let [createdRow, getMemoErr] = await fromPromise(
            queries.getMemo(ctx.getData("db", this._db), {
                publicId: inserted.publicId,
            }),
        )
        if (getMemoErr) {
            return wrapErr`error creating memo: error retrieving created memo: ${getMemoErr}`
        }

        if (createdRow === null) {
            return Err(new Error("error creating Memo"))
        }

        let created = {
            ...createdRow,
            id: createdRow.publicId,
            content: decodeText(createdRow.content),
        }

        let [_, updateTagsErr] = await this._updateTags(ctx, created)
        if (updateTagsErr) {
            return wrapErr`error creating memo: ${err}`
        }

        return Ok(created)
    }

    public async updateMemoContent(
        ctx: Context<{ db: DBExec }>,
        memo: UpdateMemoContentRequest,
    ): AsyncResult<void> {
        let [updated, err] = await fromPromise(
            queries.updateMemoContent(
                ctx.getData("db", this._db),
                {
                    publicId: memo.id,
                    content: encodeText(memo.content),
                },
                ctx.signal,
            ),
        )
        if (err) {
            return wrapErr`error updating memo content: ${memo.id}: ${err}`
        }

        if (updated === 0) {
            return Err(new Error(`error updating memo content: memo not found: ${memo.id}`))
        }

        await this._updateTags(ctx, memo)

        return Ok(undefined)
    }

    public async updateMemoArchiveStatus(
        ctx: Context<{ db: DBExec }>,
        { id: memoID, isArchived }: { id: MemoID; isArchived: boolean },
    ): AsyncResult<void> {
        let [updated, err] = await fromPromise(
            queries.seteMemoArchiveStatus(
                ctx.getData("db", this._db),
                {
                    publicId: memoID,
                    isArchived,
                },
                ctx.signal,
            ),
        )
        if (err) {
            return wrapErr`error updating memo archive status: ${memoID}: ${err}`
        }

        if (updated === 0) {
            return Err(new Error(`error updating memo archive status: memo not found: ${memoID}`))
        }

        return Ok(undefined)
    }

    public async deleteMemo(ctx: Context<{ db: DBExec }>, memoID: MemoID): AsyncResult<void> {
        let [updated, err] = await fromPromise(
            queries.setMemoDeletionStatus(
                ctx.getData("db", this._db),
                {
                    publicId: memoID,
                    isDeleted: true,
                },
                ctx.signal,
            ),
        )
        if (err) {
            return wrapErr`error marking memo as deleted: ${memoID}: ${err}`
        }

        if (updated === 0) {
            return Err(new Error(`error marking memo as deleted: memo not found: ${memoID}`))
        }

        let [deletedTags, deleteTagsErr] = await fromPromise(
            queries.deleteMemoTagConnections(
                ctx.getData("db", this._db),
                { memoId: memoID },
                ctx.signal,
            ),
        )
        if (deleteTagsErr) {
            return wrapErr`error marking memo as deleted: ${memoID}: error deleting tag connections: ${err}`
        }

        await queries.updateTagCount(
            ctx.getData("db", this._db),
            {
                tags: [...deletedTags.map((r) => r.tag)],
            },
            ctx.signal,
        )

        await queries.cleanupTagsWithNoCount(ctx.getData("db", this._db))

        return Ok(undefined)
    }

    public async undeleteMemo(ctx: Context<{ db: DBExec }>, memoID: MemoID): AsyncResult<void> {
        let [updated, err] = await fromPromise(
            queries.setMemoDeletionStatus(
                ctx.getData("db", this._db),
                {
                    publicId: memoID,
                    isDeleted: false,
                },
                ctx.signal,
            ),
        )
        if (err) {
            return wrapErr`error removing memo being marked as deleted: ${memoID}: ${err}`
        }

        if (updated === 0) {
            return Err(
                new Error(`error removing memo being marked as deleted: memo not found: ${memoID}`),
            )
        }

        let [memo, getMemoErr] = await this.getMemo(ctx, memoID)
        if (getMemoErr) {
            return wrapErr`error removing memo being marked as deleted: ${memoID}: error getting memo: ${getMemoErr}`
        }

        let [_, updateTagsErr] = await this._updateTags(ctx, memo)
        if (updateTagsErr) {
            return wrapErr`error removing memo being marked as deleted: ${memoID}: error getting updating tags: ${updateTagsErr}`
        }

        return Ok(undefined)
    }

    public async listTags(
        ctx: Context<{ db: DBExec }>,
        query: ListTagsQuery,
    ): AsyncResult<TagList> {
        let [tags, err] = await fromPromise(
            queries.listTags(
                ctx.getData("db", this._db),
                {
                    pageSize: query.pageSize,
                    pageAfter: query.pageAfter ?? "",
                },
                ctx.signal,
            ),
        )
        if (err) {
            return wrapErr`error listing tags: ${err}`
        }

        return Ok({
            items: tags,
            next: tags.at(-1)?.tag,
        })
    }

    public async cleanupDeletedMemos(ctx: Context<{ db: DBExec }>): AsyncResult<number> {
        return fromPromise(queries.cleanupDeletedMemos(ctx.getData("db", this._db), ctx.signal))
    }

    private async _updateTags(
        ctx: Context<{ db: DBExec }>,
        memo: Pick<Memo, "content" | "id">,
    ): AsyncResult<void> {
        let tags = extractTags(memo.content)

        let [deletedTags, err] = await fromPromise(
            queries.cleanupeMemoTagConnection(
                ctx.getData("db", this._db),
                {
                    memoId: memo.id,
                    tags: tags,
                },
                ctx.signal,
            ),
        )
        if (err) {
            return wrapErr`updating tags: ${err}`
        }

        for (let tag of tags) {
            let createTagResult = await fromPromise(
                queries.createTag(ctx.getData("db", this._db), { tag }, ctx.signal),
            )
            if (err) {
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
            if (err) {
                return createResult
            }
        }

        let updateResult = await fromPromise(
            queries.updateTagCount(
                ctx.getData("db", this._db),
                {
                    tags: [...deletedTags.map((r) => r.tag), ...tags],
                },
                ctx.signal,
            ),
        )
        if (err) {
            return updateResult
        }

        return fromPromise(queries.cleanupTagsWithNoCount(ctx.getData("db", this._db), ctx.signal))
    }
}

const tagPattern = /(?:^|[ \t])#([\p{L}\p{N}/\-_]+)/gmu

function extractTags(content: string): string[] {
    let tags: string[] = []

    let ast = markdownLanguage.parser.parse(content)

    ast.iterate({
        enter: (node) => {
            if (node.name !== "Paragraph" || node.node.firstChild !== null) {
                return
            }

            let substr = content.substring(node.from, node.to)

            tagPattern.lastIndex = 0
            let found = tagPattern.exec(substr)

            while (found !== null) {
                tags.push(found[1])
                found = tagPattern.exec(substr)
            }
        },
    })

    return tags
}

if (import.meta.vitest) {
    const { test, assert } = import.meta.vitest
    test.each([
        ["Empty String", "", []],
        ["Tag Only", "#tag-a", ["tag-a"]],
        ["Unicode Char", "#täg-ü", ["täg-ü"]],
        ["Mixed Case", "#Tag/Foo", ["Tag/Foo"]],
        ["Tag with Number", "#tag-23281311 #342312", ["tag-23281311", "342312"]],
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
        [
            "Real World Example with lots of code",
            `CSS Hover Effects
#css

https://codepen.io/t_afif/pen/BaQEVqz
\`\`\`css
.fancy-1 {
  background:
    radial-gradient(farthest-side at bottom, black 98%, transparent) bottom/calc(2*var(--d, 7px)) var(--d, 0) no-repeat,
    linear-gradient(black 0 0) bottom /15px 3px no-repeat;
  transition: 0.5s;
}
.fancy-1:hover {
  --d: 150%;
  color: #fff
}
\`\`\`

https://codepen.io/t_afif/pen/QWvzQzY
\`\`\`css


.cloned-1:before,
.cloned-1:after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: #D95B43;
  opacity: 0;
  transition: .2s .2s;
}
.cloned-1:before {
  background: #ECD078;
  transition-delay: 0s;
}
.cloned-1:hover:before,
.cloned-1:hover:after {
  transform: translate(-10px,10px);
  opacity: 1; 
}
.cloned-1:hover:before {
  transform: translate(-20px,20px);
  transition-delay: .4s;
}
\`\`\`

\`\`\`css
.cloned-7 {
  padding: 10px;
  transition: .2s;
}
.cloned-7:hover {
  color: #fff;
  background: #542437;
}

.cloned-7:before,
.cloned-7:after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  background: #D95B43;
  opacity: 0;
}
.cloned-7:before {
  background: #ECD078;
}
.cloned-7:hover:before,
.cloned-7:hover:after {
  inset: -0.1px;
  opacity: 1; 
  transition: inset .5s .2s cubic-bezier(0.2,250,0.8,250),opacity 0s .2s;
}
.cloned-7:hover:before {
  inset: -0.2px;
  transition-delay: .3s,.2s;
}
\`\`\`

\`\`\`css
.cloned-8 {
  padding: 10px;
  transition: .3s .3s;
}
.cloned-8:hover {
  color: #fff;
  transition: .3s;
  background: #542437;
}
.cloned-8:before,
.cloned-8:after {
  content: "";
  position: absolute;
  inset: 0 50% 0 0;
  z-index: -1;
  box-shadow: 
    0 0 #D95B43,
    0 0 #ECD078;
  opacity: 0;
  transition:0.3s 0.3s,box-shadow .3s;
}
.cloned-8:after {
  transform-origin: right;
  transform: rotate(180deg);
}
.cloned-8:hover:before,
.cloned-8:hover:after {
  box-shadow: 
    -10px 10px #D95B43,
    -20px 20px #ECD078;
  opacity: 1;
  transition:0.3s 0.3s,opacity .3s;
}
\`\`\`

https://codepen.io/t_afif/pen/MWmZQxg
\`\`\`css
.colorful-1 {
  padding: 10px;
  color: #0000;
  font-weight: bold;
  background: linear-gradient(90deg,#FF3D7F 50%,#000 0) right/200% 100% no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  transition: .4s linear;
}
.colorful-1:hover {
  background-position: left;
}
.colorful-1:before {
  content:"";
  position: absolute;
  inset:auto 0 0 100%;
  height: 4px;
  background: #FF3D7F;
  transition: inherit;
}
.colorful-1:hover:before {
  inset:auto 0 0 0;
}
\`\`\`

\`\`\`css
.colorful-3 {
  padding: 10px;
  color: #0000;
  font-weight: bold;
  background: linear-gradient(#000 0 0) center/100% 100% no-repeat #3FB8AF;
  -webkit-background-clip: text;
  background-clip: text;
  transition: .4s linear;
}
.colorful-3:hover {
  background-size: 0 100%;
}
.colorful-3:before {
  content:"";
  position: absolute;
  inset:auto 50% 0;
  height: 4px;
  background-color: inherit;
  transition: inherit;
}
.colorful-3:hover:before {
  inset:auto 0 0;
}
\`\`\`
`,
            ["css"],
        ],
    ])("extractTags/%s", (_, input, exp) => {
        let actual = extractTags(input)
        assert.deepEqual(actual, exp)
    })
}
