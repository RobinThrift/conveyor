import { CustomErrCode, type ErrorCode } from "@/lib/errors"

export class APIError extends Error {
    public code: number
    public type: string
    public title: string
    public detail?: string

    constructor({
        code,
        type,
        title,
        detail,
    }: {
        code: number
        type: string
        title: string
        detail?: string
    }) {
        let msg = `${code} ${title} (${type})`
        if (detail) {
            msg += `\n${detail}}`
        }

        super(msg)
        this.name = "APIError"
        this.code = code
        this.title = title
        this.type = type
        this.detail = detail
    }

    withPrefix(prefix: string): APIError {
        this.message = `${prefix}: ${this.message}`
        return this
    }

    static async fromHTTPResponse(res: Response): Promise<APIError> {
        try {
            let body = await res.json()
            return new APIError(body)
        } catch (e) {
            return new APIError({
                code: res.status,
                type: `${res.status} ${res.statusText}`,
                title: "error parsing request JSON",
                detail: `${(e as Error).name}: ${(e as Error).message}`,
            })
        }
    }
}

export class UnauthorizedError extends Error {
    public static [CustomErrCode] = "Unauthorized" as ErrorCode

    constructor(options?: ErrorOptions) {
        super("Unauthorized", options)
        this.name = "Unauthorized"
    }
}
