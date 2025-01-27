import { createSelector } from "@reduxjs/toolkit"

import { slice as apiTokens } from "./entities/apitokens"
import { slice as memos } from "./entities/memos"
import { slice as tags } from "./entities/tags"
import { slice as pageMemoEdit } from "./pages/Memos/Edit/state"
import { slice as pageMemoList } from "./pages/Memos/List/state"
import { slice as pageMemoNew } from "./pages/Memos/New/state"
import { slice as pageMemoSingle } from "./pages/Memos/Single/state"

export const selectors = {
    entities: {
        Tags: {
            tags: createSelector(tags.selectors.tags, (tags) =>
                Object.values(tags),
            ),
        },
        Memos: {
            allMemos: memos.selectors.allMemos,
        },
        APITokens: {
            allAPITokens: apiTokens.selectors.allAPITokens,
        },
    },
    pages: {
        Memos: {
            List: {
                memosInList: pageMemoList.selectors.memosInList,
                filter: pageMemoList.selectors.filter,
                isLoadingMemos: pageMemoList.selectors.isLoadingMemos,
                error: pageMemoList.selectors.error,
                hasNextPage: pageMemoList.selectors.hasNextPage,
                isCreatingMemo: pageMemoList.selectors.isCreatingMemo,
            },
            Single: {
                memo: createSelector(
                    [memos.selectors.allMemos, pageMemoSingle.selectors.memoID],
                    (memos, memoID) => memos[memoID],
                ),

                isLoading: createSelector(
                    [
                        memos.selectors.allLoadingStates,
                        pageMemoSingle.selectors.memoID,
                    ],
                    (isLoading, memoID) => isLoading[memoID],
                ),

                error: createSelector(
                    [
                        memos.selectors.allErrors,
                        pageMemoSingle.selectors.memoID,
                    ],
                    (errors, memoID) => errors[memoID],
                ),
            },
            Edit: {
                memo: createSelector(
                    [memos.selectors.allMemos, pageMemoEdit.selectors.memoID],
                    (memos, memoID) => memos[memoID],
                ),

                isLoading: createSelector(
                    [
                        memos.selectors.allLoadingStates,
                        pageMemoEdit.selectors.memoID,
                    ],
                    (isLoading, memoID) => isLoading[memoID],
                ),

                error: createSelector(
                    [memos.selectors.allErrors, pageMemoEdit.selectors.memoID],
                    (errors, memoID) => errors[memoID],
                ),
            },

            New: {
                isLoading: pageMemoNew.selectors.isLoading,
                error: pageMemoNew.selectors.error,
            },
        },
        Settings: {
            SystemSettingsTab: {
                apiTokens: createSelector(
                    [
                        apiTokens.selectors.allAPITokens,
                        apiTokens.selectors.isLoading,
                        apiTokens.selectors.error,
                        apiTokens.selectors.hasPrevPage,
                        apiTokens.selectors.hasNextPage,
                        apiTokens.selectors.lastCreatedValue,
                    ],
                    (
                        apiTokens,
                        isLoading,
                        error,
                        hasPrevPage,
                        hasNextPage,
                        lastCreatedValue,
                    ) => ({
                        apiTokens,
                        isLoading,
                        error,
                        hasPrevPage,
                        hasNextPage,
                        lastCreatedValue,
                    }),
                ),
            },
        },
    },
}
