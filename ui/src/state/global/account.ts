import type { Account } from "@/domain/Account"
import { type PayloadAction, createSlice } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"

export type AccountState = Account

let initialState: AccountState = {
    username: "",
    displayName: "Username",
}

export const slice = createSlice({
    name: "account",
    reducerPath: "global.account",

    initialState,
    reducers: {
        init: (_, { payload }: PayloadAction<Account>) => ({
            username: payload.username,
            displayName: payload.displayName,
        }),
    },
    selectors: {
        displayName: (state) => state.displayName,
    },
})

export function useAccountDisplayName() {
    return useSelector(slice.selectors.displayName)
}
