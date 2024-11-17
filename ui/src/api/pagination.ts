export interface Pagination<A extends string> {
    pageSize: number
    after?: A
}
