import { locale as loadLocale, platform } from "@tauri-apps/plugin-os"
import { appConfigDir } from "@tauri-apps/api/path"

import { setEnv } from "@/env"
import { TauriFS } from "@/external/tauri/TauriFS"
import { TauriSQLite } from "@/external/tauri/TauriSQLite"

import type { PlatformDependencies, PlatformInitArgs } from "./init.platform"

export async function init({
    fs,
}: PlatformInitArgs): Promise<PlatformDependencies> {
    let locale = await loadLocale()

    setEnv({
        platform: platform() === "macos" ? "macos" : "tauri-generic",
        lang: locale ? [locale] : [],
    })

    // biome-ignore lint/nursery/noProcessEnv: only used for development
    if (process.env.NODE_ENV === "development") {
        console.log("Tauri AppConfigDir: ", await appConfigDir())
    }

    return {
        db: new TauriSQLite(),
        fs: new TauriFS(fs.baseDir),
    }
}
