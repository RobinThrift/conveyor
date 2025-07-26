export interface Pagination<T> {
    pageSize: number
    after?: T
}

export type Pages<T> = (T | undefined)[]

export function goBackOnePage<T>(pages: Pages<T>): [T | undefined, Pages<T>] {
    let copy = [...pages]
    let prevPage: T | undefined

    if (copy.length <= 1) {
        copy = []
    } else {
        prevPage = copy.pop()
    }

    return [prevPage, copy]
}
