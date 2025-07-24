export type WorkerRequestMessage<Actions = `${string}/${string}`> = {
    type: "request"
    id: string
    action: Actions
    params: any[]
    stack?: string
}

export type WorkerResponseMessage<T = any> = {
    type: "response"
    id: string
    action: `${string}/${string}`
    data: T
    error?: Error
    stack?: string
}

export type WorkerNotificationMessage<A = string, T = any> = {
    type: "notification"
    id: string
    action: A
    data: T
}

export type Events<T extends object> = {
    [K in keyof T]?: Array<(data: T[K]) => void>
}
