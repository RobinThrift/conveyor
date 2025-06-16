import React, { useCallback } from "react"
import {
    GridList as AriaGridList,
    GridListItem as AriaGridListItem,
} from "react-aria-components"

import type { APIToken } from "@/domain/APIToken"
import { Alert } from "@/ui/components/Alert"
import { Button } from "@/ui/components/Button"
import { DateTime } from "@/ui/components/DateTime"
import { Form } from "@/ui/components/Form"
import { CaretLeftIcon, CaretRightIcon } from "@/ui/components/Icons"
import { Input } from "@/ui/components/Input"
import { Loader } from "@/ui/components/Loader"
import { Select } from "@/ui/components/Select"
import { Tooltip } from "@/ui/components/Tooltip"
import { useStateGetter } from "@/ui/hooks/useStateGetter"
import { useT } from "@/ui/i18n"

import { currentDateTime } from "@/lib/i18n"
import { useAPITokensTabState } from "./useAPITokensTabState"

export function APITokensTab() {
    let t = useT("screens/Settings/APITokens")
    let {
        apiTokens,
        hasNextPage,
        hasPreviousPage,
        loadPrevPage,
        loadNextPage,
        isLoading,
        error,
        lastCreatedValue,
        createAPIToken,
        deleteAPIToken,
    } = useAPITokensTabState()

    return (
        <>
            <header>
                <h2>{t.Title}</h2>
                <small className="settings-tab-description">
                    {t.Description}
                </small>
            </header>

            <div className="settings-section relative mt-4">
                {error && <Alert variant="danger">{error.message}</Alert>}

                {lastCreatedValue && (
                    <LastCreatedAPIToken value={lastCreatedValue} />
                )}

                <CreateNewAPIToken
                    onSubmit={createAPIToken}
                    isLoading={isLoading}
                />
            </div>

            <div className="settings-section relative mt-4">
                <APITokensList
                    tokens={apiTokens}
                    hasPreviousPage={hasPreviousPage}
                    hasNextPage={hasNextPage}
                    prevPage={loadPrevPage}
                    nextPage={loadNextPage}
                    onDelete={deleteAPIToken}
                />
            </div>

            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-surface-level-1/80 z-10">
                    <Loader />
                </div>
            )}
        </>
    )
}

function CreateNewAPIToken({
    isLoading,
    onSubmit: create,
}: {
    isLoading: boolean
    onSubmit: (token: { name: string; expiresAt: Date }) => void
}) {
    let t = useT("screens/Settings/APITokens/New")

    let [name, setName] = useStateGetter("")
    let [expiresIn, setExpiresIn] = useStateGetter<
        "1d" | "7d" | "30d" | "6m" | "12m"
    >("1d")

    let onChangeExpiresIn = useCallback(
        (e?: ReturnType<typeof expiresIn>) => {
            setExpiresIn(e ?? "1d")
        },
        [setExpiresIn],
    )

    let onChangeName = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setName(e.target.value)
        },
        [setName],
    )

    let onSubmit = useCallback(
        (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            e.stopPropagation()

            let expiresAt = currentDateTime()
            switch (expiresIn()) {
                case "1d":
                    expiresAt = expiresAt.add({ days: 1 })
                    break
                case "7d":
                    expiresAt = expiresAt.add({ days: 7 })
                    break
                case "30d":
                    expiresAt = expiresAt.add({ days: 30 })
                    break
                case "6m":
                    expiresAt = expiresAt.add({ months: 6 })
                    break
                case "12m":
                    expiresAt = expiresAt.add({ months: 12 })
                    break
            }

            create({
                name: name(),
                expiresAt: expiresAt.toDate("utc"),
            })
        },
        [create, name, expiresIn],
    )

    return (
        <Form onSubmit={onSubmit}>
            <h4>{t.Title}</h4>
            <div className="space-y-2">
                <Input
                    name="api_token_name"
                    label={t.FieldNameLabel}
                    required
                    value={name()}
                    onChange={onChangeName}
                    className="sm:mb-0 md:grid grid-cols-6 space-y-1"
                    labelClassName="font-semibold! text-sm! items-center mb-0! col-span-2"
                    inputWrapperClassName="col-span-4"
                    disabled={isLoading}
                />

                <div className="sm:mb-0 md:grid grid-cols-6 space-y-1">
                    <label
                        htmlFor="api_token_expires_in"
                        className="flex items-center mt-4 sm:mt-0 font-semibold text-sm col-span-2"
                    >
                        {t.FieldExpiresInLabel}
                    </label>
                    <Select
                        name="api_token_expires_in"
                        fieldClassName="col-span-4 py-2!"
                        wrapperClassName="w-full"
                        value={expiresIn()}
                        onChange={onChangeExpiresIn}
                        isDisabled={isLoading}
                    >
                        <Select.Option value="1d">
                            {t.FieldExpiresInValueDays(1)}
                        </Select.Option>
                        <Select.Option value="7d">
                            {t.FieldExpiresInValueDays(7)}
                        </Select.Option>
                        <Select.Option value="30d">
                            {t.FieldExpiresInValueDays(30)}
                        </Select.Option>
                        <Select.Option value="6m">
                            {t.FieldExpiresInValueMonths(6)}
                        </Select.Option>
                        <Select.Option value="12m">
                            {t.FieldExpiresInValueMonths(12)}
                        </Select.Option>
                    </Select>
                </div>

                <Button type="submit" variant="primary" isDisabled={isLoading}>
                    {t.ButtonLabel}
                </Button>
            </div>
        </Form>
    )
}

function LastCreatedAPIToken({ value }: { value: string }) {
    let t = useT("screens/Settings/APITokens/LastCreated")

    let onFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.select()
    }, [])

    return (
        <div className="bg-success border-success-dark p-4 rounded-sm my-8 shadow-md">
            <h4 className="text-success-contrast text-lg">{t.Title}</h4>
            <p className="text-success-contrast my-2 font-semibold">
                {t.Notice}
            </p>
            <input
                className="input rounded-lg px-2 py-1.5 bg-success-light text-success-contrast border-success-light focus:border-success-dark focus:outline-hidden focus:ring-0"
                readOnly
                value={value}
                onFocus={onFocus}
            />
        </div>
    )
}

function APITokensList({
    tokens,
    hasPreviousPage,
    hasNextPage,
    nextPage,
    prevPage,
    onDelete,
}: {
    tokens: APIToken[]
    hasPreviousPage: boolean
    hasNextPage: boolean
    nextPage: () => void
    prevPage: () => void
    onDelete: (name: string) => void
}) {
    let t = useT("screens/Settings/APITokens/List")

    return (
        <div className="api-tokens-section">
            <AriaGridList className="api-tokens-list" aria-label={t.Title}>
                {tokens.map((token) => (
                    <AriaGridListItem
                        key={token.name}
                        className="api-token"
                        textValue={token.name}
                    >
                        <div className="api-token-info">
                            <span
                                className="api-token-name"
                                id={`api-token-label-${token.name}`}
                                aria-label={t.LabelName}
                            >
                                {token.name}
                            </span>
                            <span className="api-token-expires-at">
                                <span id={`${token.name}-expires-at`}>
                                    {t.LabelExpires}:
                                </span>
                                <DateTime
                                    aria-labelledby={`${token.name}-expires-at`}
                                    date={token.expiresAt}
                                />
                            </span>
                            <span className="api-token-created-at">
                                <span id={`${token.name}-created-at`}>
                                    {t.LabelCreated}:
                                </span>
                                <DateTime
                                    aria-labelledby={`${token.name}-created-at`}
                                    date={token.createdAt}
                                    relative={true}
                                />
                            </span>
                        </div>

                        <Button
                            variant="danger"
                            size="sm"
                            onPress={() => onDelete(token.name)}
                        >
                            {t.DeleteButton}
                        </Button>
                    </AriaGridListItem>
                ))}
            </AriaGridList>

            <div className="flex gap-2 mt-2 justify-end">
                <Tooltip content={t.PrevPage}>
                    <Button
                        iconLeft={<CaretLeftIcon />}
                        onPress={prevPage}
                        size="sm"
                        isDisabled={!hasPreviousPage}
                    />
                </Tooltip>
                <Tooltip content={t.NextPage}>
                    <Button
                        iconLeft={<CaretRightIcon />}
                        onPress={nextPage}
                        size="sm"
                        isDisabled={!hasNextPage}
                    />
                </Tooltip>
            </div>
        </div>
    )
}
