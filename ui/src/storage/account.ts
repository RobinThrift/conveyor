import type { Account } from "@/domain/Account"
import { useStore } from "@nanostores/react"
import { map } from "nanostores"

export const accountStore = map<Account>({
    username: "",
    displayName: "",
})

export function useAccount() {
    return useStore(accountStore)
}
