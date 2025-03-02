export interface Tag {
    tag: string
    count: number
}

export interface TagList {
    items: Tag[]
    next?: string
}
