// This is inpsired by or directly inlined from https://github.com/nanostores/router
// so the following content may be MIT licensed.

export type RouteDefinitions = Record<string, string>

export type Page<
    Definitions extends RouteDefinitions = RouteDefinitions,
    PageName extends keyof Definitions = any,
> = PageName extends any
    ? {
          hash: string
          params: ParamsFromConfig<Definitions>[PageName]
          path: string
          route: PageName
          search: Record<string, string>
      }
    : never

// Converting routes to params
type ParamsFromConfig<K extends RouteDefinitions> = {
    [key in keyof K]: K[key] extends string ? ParseUrl<K[key]> : never
}

// biome-ignore lint/complexity/noBannedTypes:
type ParseUrl<Path extends string> = PathToParams<Split<Path, "/">, {}>

type Split<S extends string, D extends string> = string extends S
    ? string[]
    : S extends ""
      ? []
      : S extends `${infer T}${D}${infer U}`
        ? [T, ...Split<U, D>]
        : [S]

// Converting path array to object
type PathToParams<PathArray, Params> = PathArray extends [
    infer First,
    ...infer Rest,
]
    ? First extends `:${infer Param}`
        ? First extends `:${infer Param}?`
            ? PathToParams<Rest, Params & Partial<Record<Param, string>>>
            : PathToParams<Rest, Params & Record<Param, string>>
        : PathToParams<Rest, Params>
    : Params

export type Routes = [string, RegExp, string][]

export function createRoutes(routes: RouteDefinitions): Routes {
    return Object.keys(routes).map((name) => {
        let pattern = routes[name]

        pattern = pattern.replace(/\/$/g, "") || "/"

        let regexp = pattern
            .replace(/[\s!#$()+,.:<=?[\\\]^{|}]/g, "\\$&")
            .replace(/\/\\:(\w+)\\\?/g, "(?:/(?<$1>(?<=/)[^/]+))?")
            .replace(/\/\\:(\w+)/g, "/(?<$1>[^/]+)")

        return [name, RegExp(`^${regexp}$`, "i"), pattern]
    })
}

export type CacheKey = string

export function matchRoute<R extends Routes, D extends RouteDefinitions>(
    routes: R,
    href: string,
    baseURL?: string,
    cacheKey?: CacheKey,
): [Page | undefined, CacheKey] {
    let url = new URL(href.replace(/#$/, ""), "http://a")
    let nextCacheKey = url.pathname + url.search + url.hash
    if (cacheKey === nextCacheKey) {
        return [undefined, cacheKey]
    }

    let path = url.pathname.replace(new RegExp(`^${baseURL}`), "")
    path = path.replace(/\/($|\?)/, "$1") || "/"

    for (let [route, regexp] of routes) {
        let match = path.match(regexp)
        if (match) {
            let groups = match?.groups
            return [
                {
                    hash: url.hash,
                    params: groups
                        ? Object.keys({ ...groups }).reduce(
                              (params, key) => {
                                  params[key as keyof typeof params] = (
                                      groups[key]
                                          ? decodeURIComponent(groups[key])
                                          : ""
                                  ) as ParamsFromConfig<D>[typeof route][keyof ParamsFromConfig<D>[typeof route]]
                                  return params
                              },
                              {} as ParamsFromConfig<D>[typeof route],
                          )
                        : ({} as ParamsFromConfig<D>[typeof route]),
                    path,
                    route,
                    search: Object.fromEntries(url.searchParams),
                } satisfies Page<D, typeof route>,
                nextCacheKey,
            ]
        }
    }

    return [undefined, nextCacheKey]
}
