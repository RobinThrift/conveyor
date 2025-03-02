import { type PayloadAction, createSlice } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"

import type { BuildInfo } from "@/domain/BuildInfo"

export type BuildInfoState = BuildInfo

let initialState: BuildInfoState = {
    version: "dev",
    commitHash: "",
    commitDate: "",
    projectLink: "https://github.com/RobinThrift/belt",
}

export const slice = createSlice({
    name: "buildInfo",
    reducerPath: "global.buildInfo",
    initialState,
    reducers: {
        init: (_, { payload }: PayloadAction<BuildInfo>) => ({
            version: payload.version,
            commitHash: payload.commitHash,
            commitDate: payload.commitDate,
            projectLink: payload.projectLink,
        }),
    },
    selectors: {
        all: (state) => state,
    },
})

export function useBuildInfo() {
    return useSelector(slice.selectors.all)
}
