import type { IsSetupInfo, SetupInfo } from "@/domain/SetupInfo"
import type { Context } from "@/lib/context"
import { parseJSON, parseJSONDates } from "@/lib/json"
import { type AsyncResult, Ok } from "@/lib/result"

export class LocalStorageSetupInfoStorage {
    private _key = "belt.setup-info"

    async loadSetupInfo(_: Context): AsyncResult<SetupInfo | undefined> {
        let data = globalThis.localStorage.getItem(this._key)
        if (!data) {
            return Ok(undefined)
        }

        return parseJSON(
            data,
            parseJSONDates<
                IsSetupInfo,
                keyof IsSetupInfo,
                Record<string, unknown>
            >("setupAt"),
        )
    }

    async saveSetupInfo(_: Context, info: SetupInfo): AsyncResult<void> {
        return Ok(
            globalThis.localStorage.setItem(this._key, JSON.stringify(info)),
        )
    }
}
