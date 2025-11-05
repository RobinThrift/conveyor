export interface Options {
    overrides?: Override[]
}

export interface Override {
    column: string
    type?:
        | string
        | {
              name: string
              import: string
              optional?: boolean
          }
    from_sql?: {
        fn: string
        import: string
    }
    to_sql?: {
        fn: string
        import: string
    }
}
