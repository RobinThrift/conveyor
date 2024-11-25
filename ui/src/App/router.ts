import { createRouter } from "@nanostores/router"

let baseURL =
    globalThis.document
        ?.querySelector("meta[name=base-url]")
        ?.getAttribute("content")
        ?.replace(/\/$/, "") ?? ""

export const $router = createRouter(
    {
        login: `${baseURL}/login`,
        "login.change_password": `${baseURL}/auth/change_password`,
        root: `${baseURL}/`,
        "memos.list": `${baseURL}/memos`,
        "memos.single": `${baseURL}/memos/:id`,
    },
    { links: false },
)
