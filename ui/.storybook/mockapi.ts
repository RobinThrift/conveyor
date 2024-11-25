import { http, type HttpHandler, HttpResponse, delay } from "msw"
import type { Memo, MemoList } from "../src/domain/Memo"
import type { Attachment } from "../src/domain/Attachment"
import type { Tag, TagList } from "../src/domain/Tag"
import type { CreateMemoRequest, UpdateMemoRequest } from "../src/api/memos"
import {
    sub,
    isSameDay,
    roundToNearestMinutes,
    parseJSON,
    isEqual,
} from "date-fns"
import { faker } from "@faker-js/faker"

interface MockData {
    memos: Memo[]
    tags: Tag[]
    attachments: (Attachment & { data: Blob })[]
}

const mockData: MockData = (() => {
    let now = roundToNearestMinutes(new Date())

    let tags: Tag[] = []

    for (let i = 0; i < 100; i++) {
        tags.push({
            tag: `#${faker.word.noun()}/${faker.word.noun()}`,
            count: faker.number.int({ min: 1, max: 100 }),
        })
    }

    tags.sort()

    let memos: Memo[] = []

    for (let i = 0; i < 100; i++) {
        memos.push({
            id: `10-${i}`,
            content: `# Memo ${i}

${faker.lorem.lines({ min: 1, max: 10 })}

${faker.helpers.arrayElement(tags).tag}`,
            isArchived: i > 90,
            createdAt: sub(now, { hours: i * 2 }),
            updatedAt: sub(now, { hours: i }),
        })
    }

    return {
        memos,
        tags,
        attachments: [],
    }
})()

export const mockAPI: HttpHandler[] = [
    http.get("/api/v1/memos", async ({ request }) => {
        await delay(500)

        let url = new URL(request.url)

        let pageSize = Number.parseInt(
            url.searchParams.get("page[size]") ?? "25",
            10,
        )
        let pageAfterParam = url.searchParams.get("page[after]")
        let pageAfter = pageAfterParam ? new Date(pageAfterParam) : null
        let filters = {
            content: url.searchParams.get("filter[content]"),
            tag: url.searchParams.get("filter[tag]"),
            createdAt: url.searchParams.get("filter[created_at]"),
            createdAtOperation: url.searchParams.get("op[created_at]") ?? "=",
            isArchived: JSON.parse(
                url.searchParams.get("filter[is_archived]") ?? "false",
            ) as boolean,
        }

        let memos: Memo[] = []
        let take = pageAfter === null
        let next: Date | undefined = undefined

        for (let memo of mockData.memos) {
            if (!take) {
                take =
                    take ||
                    (pageAfter ? isEqual(memo.createdAt, pageAfter) : false)
                continue
            }

            if (memo.isArchived !== filters.isArchived) {
                continue
            }

            if (
                filters.tag &&
                !new RegExp(`#${filters.tag}$`).test(memo.content)
            ) {
                continue
            }

            if (
                filters.createdAt &&
                !isSameDay(memo.createdAt, parseJSON(filters.createdAt))
            ) {
                continue
            }

            if (filters.content && !memo.content.includes(filters.content)) {
                continue
            }

            if (memos.length >= pageSize) {
                break
            }

            memos.push(memo)
        }

        if (memos.length !== 0) {
            next = memos[memos.length - 1].createdAt
        }

        return HttpResponse.json(
            {
                items: memos,
                next,
            } satisfies MemoList,
            { headers: { "content-type": "application/json; charset=utf-8" } },
        )
    }),

    http.post<never, CreateMemoRequest>(
        "/api/v1/memos",
        async ({ request }) => {
            await delay(500)

            let body = await request.json()

            let now = new Date()
            let memo: Memo = {
                id: mockData.memos.length.toString(),
                content: body.content,
                isArchived: false,
                createdAt: now,
                updatedAt: now,
            }

            mockData.memos = [memo, ...mockData.memos]

            return HttpResponse.json(memo, {
                status: 201,
                headers: { "content-type": "application/json; charset=utf-8" },
            })
        },
    ),

    http.patch<{ memoID: string }, UpdateMemoRequest>(
        "/api/v1/memos/:memoID",
        async ({ request, params }) => {
            await delay(500)

            let body = await request.json()

            let memoIndex = mockData.memos.findIndex(
                (m) => m.id === params.memoID,
            )
            if (memoIndex === -1) {
                return HttpResponse.json(
                    {
                        code: 404,
                        type: "belt/api/v1/NotFound",
                        title: "Not Found",
                        detail: `Memo ${params.memoID} not Found`,
                    },
                    {
                        status: 404,
                        statusText: "Not Found",
                        headers: {
                            "content-type": "application/json; charset=utf-8",
                        },
                    },
                )
            }

            let now = new Date()
            let updated: Memo = {
                ...mockData.memos[memoIndex],
                updatedAt: now,
            }

            if (body.content) {
                updated.content = body.content
            }

            if (typeof body.isArchived === "boolean") {
                updated.isArchived = body.isArchived
            }

            mockData.memos[memoIndex] = updated

            return new HttpResponse(null, { status: 204 })
        },
    ),

    http.get("/api/v1/tags", async ({ request }) => {
        await delay(500)

        let url = new URL(request.url)

        let pageSize = Number.parseInt(
            url.searchParams.get("page[size]") ?? "100",
            10,
        )
        let after = url.searchParams.get("page[after]")

        let tags: Tag[] = []
        let take = after === null
        let next = ""

        for (let tag of mockData.tags) {
            take = take || tag.tag === after
            if (!take) {
                continue
            }

            if (tags.length >= pageSize) {
                next = tag.tag
                break
            }

            tags.push(tag)
        }

        return HttpResponse.json(
            {
                items: tags,
                next,
            } satisfies TagList,
            { headers: { "content-type": "application/json; charset=utf-8" } },
        )
    }),

    http.post("/api/v1/attachments", async ({ request }) => {
        await delay(5000)

        let filename = request.headers.get("x-filename")
        if (!filename) {
            return HttpResponse.json(
                {
                    code: 400,
                    type: "belt/api/v1/BadRequest",
                    title: "Bad Request",
                    detail: "missing X-FileName header",
                },
                {
                    status: 400,
                    statusText: "Bad Request",
                    headers: {
                        "content-type": "application/json; charset=utf-8",
                    },
                },
            )
        }

        let { readable, writable } = new TransformStream()
        request.body
            ?.pipeThrough(new DecompressionStream("gzip"))
            .pipeTo(writable)

        let body = await streamToBlob(readable.getReader())

        let attachment = {
            url: `/attachments/${filename}`,
            filename,
            contentType: "",
            sizeBytes: body.size,
            sha256: "",
            createdBy: "0",
            createdAt: new Date(),
        } satisfies Attachment

        mockData.attachments.push({
            ...attachment,
            data: body,
        })

        return HttpResponse.json(attachment, {
            status: 201,
            headers: { "content-type": "application/json; charset=utf-8" },
        })
    }),

    http.get<{ filename: string }>(
        "/attachments/:filename",
        async ({ params }) => {
            await delay(500)

            let attachment = mockData.attachments.find(
                (a) => a.filename === params.filename,
            )
            if (!attachment) {
                return new HttpResponse(null, { status: 404 })
            }

            return new HttpResponse(attachment.data, {
                headers: { "content-type": attachment.contentType },
            })
        },
    ),
]

async function streamToBlob(
    reader: ReadableStreamDefaultReader,
): Promise<Blob> {
    let chunks: BlobPart[] = []

    return reader.read().then(async function read({
        done,
        value,
    }: ReadableStreamReadResult<Uint8Array>): Promise<Blob> {
        if (done) {
            return new Blob(chunks)
        }

        chunks.push(value)

        return reader.read().then(read)
    })
}
