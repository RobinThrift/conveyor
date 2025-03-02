export interface Options {
    overrides?: Override[]
}

export interface Override {
    column: string
    type?: string
    from_sql?: {
        fn: string
        import: string
    }
    to_sql?: {
        fn: string
        import: string
    }
}
