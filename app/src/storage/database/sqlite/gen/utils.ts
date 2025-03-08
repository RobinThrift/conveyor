// Code generated by sqlc. DO NOT EDIT.

import type { SqlValue } from "@sqlite.org/sqlite-wasm"

export function columnNameToFieldName(column: string) {
    return column
        .toLowerCase()
        .replace(/([_][a-z])/g, (group) => group.toUpperCase().replace("_", ""))
}

export function mapRowToObj<T extends object>(
    row: Record<string, SqlValue | boolean>,
    overrides: Partial<Record<keyof T, (v: any) => any>> = {},
): T {
    let obj = {} as T
    for (let key in row) {
        let field = columnNameToFieldName(key) as keyof T
        let value = row[key] as T[typeof field]
        if (overrides[field]) {
            value = overrides[field](value)
        }
        ;(obj[field] as T[typeof field]) = value
    }
    return obj
}

export function numberToBool(value: number) {
    return value === 1
}
