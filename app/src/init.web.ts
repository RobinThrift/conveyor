import type { PlatformDependencies, PlatformInitArgs } from "./init.platform"

import { setEnv } from "@/env"
import { OPFS } from "@/external/browser/opfs"
import { SQLite } from "@/external/browser/sqlite"

export async function init({
    fs,
    db,
}: PlatformInitArgs): Promise<PlatformDependencies> {
    let sqlite = new SQLite(db)

    setEnv({
        platform: "web",
        lang: navigator.languages ? navigator.languages : [navigator.language],
    })

    window.addEventListener("unload", async () => {
        await sqlite.close()
    })

    return {
        db: sqlite,
        fs: new OPFS(fs.baseDir, fs),
    }
}
