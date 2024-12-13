import { Alert } from "@/components/Alert"
import { Button } from "@/components/Button"
import { DateTime } from "@/components/DateTime"
import * as Form from "@/components/Form"
import { Input } from "@/components/Input"
import { Loader } from "@/components/Loader"
import { Select } from "@/components/Select"
import { Tooltip } from "@/components/Tooltip"
import type { APIToken } from "@/domain/APIToken"
import { useStateGetter } from "@/hooks/useStateGetter"
import { useT } from "@/i18n"
import { CaretLeft, CaretRight } from "@phosphor-icons/react"
import { add } from "date-fns"
import React, { useCallback, useEffect } from "react"
import { useSystemSettingsTabState } from "./state"

export const SystemSettingsTab = React.forwardRef<HTMLDivElement>(
    function SystemSettingsTab(_, forwardedRef) {
        let t = useT("pages/Settings/SystemSettingsTab")
        let { state, actions } = useSystemSettingsTabState()

        return (
            <div ref={forwardedRef} className="settings-tab">
                <div className="settings-tab-section">
                    <h2>{t.Title}</h2>
                </div>

                <APITokensSections
                    isLoading={state.isLoading}
                    apiTokens={state.apiTokens}
                    hasPreviousPage={state.hasPrevPage}
                    hasNextPage={state.hasNextPage}
                    lastCreatedValue={state.lastCreatedValue}
                    error={state.error}
                    loadPage={actions.loadPage}
                    loadPrevPage={actions.loadPrevPage}
                    loadNextPage={actions.loadNextPage}
                    createAPIToken={actions.create}
                    deleteAPIToken={actions.del}
                />
            </div>
        )
    },
)

function APITokensSections(props: {
    isLoading: boolean
    apiTokens: APIToken[]
    hasPreviousPage: boolean
    hasNextPage: boolean
    lastCreatedValue?: string
    error?: Error
    loadPage: () => void
    loadNextPage: () => void
    loadPrevPage: () => void
    createAPIToken: (token: { name: string; expiresAt: Date }) => void
    deleteAPIToken: (name: string) => void
}) {
    let t = useT("pages/Settings/SystemSettingsTab")

    useEffect(() => {
        props.loadPage()
    }, [props.loadPage])

    return (
        <div className="settings-tab-section">
            <h2>{t.SectionAPITokensTitle}</h2>
            <small>{t.SectionAPITokensDescription}</small>

            {props.error && (
                <Alert variant="danger">{props.error.message}</Alert>
            )}

            <div className="relative">
                {props.isLoading && (
                    <div className="absolute inset-0 flex justify-center items-center top-4 bg-surface/50 rounded-lg">
                        <Loader />
                    </div>
                )}

                {props.lastCreatedValue && (
                    <LastCreatedAPIToken value={props.lastCreatedValue} />
                )}

                <CreateNewAPIToken onSubmit={props.createAPIToken} />

                <APITokensList
                    tokens={props.apiTokens}
                    hasPreviousPage={props.hasPreviousPage}
                    hasNextPage={props.hasNextPage}
                    prevPage={props.loadPrevPage}
                    nextPage={props.loadNextPage}
                    onDelete={props.deleteAPIToken}
                />
            </div>
        </div>
    )
}

function CreateNewAPIToken({
    onSubmit: create,
}: { onSubmit: (token: { name: string; expiresAt: Date }) => void }) {
    let t = useT("pages/Settings/SystemSettingsTab/New")

    let [name, setName] = useStateGetter("")
    let [expiresIn, setExpiresIn] = useStateGetter<
        "1d" | "7d" | "30d" | "6m" | "12m"
    >("1d")

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

            let expiresAt = new Date()
            switch (expiresIn()) {
                case "1d":
                    expiresAt = add(expiresAt, { days: 1 })
                    break
                case "7d":
                    expiresAt = add(expiresAt, { days: 7 })
                    break
                case "30d":
                    expiresAt = add(expiresAt, { days: 30 })
                    break
                case "6m":
                    expiresAt = add(expiresAt, { months: 6 })
                    break
                case "12m":
                    expiresAt = add(expiresAt, { months: 12 })
                    break
            }

            create({
                name: name(),
                expiresAt,
            })
        },
        [create, name, expiresIn],
    )

    return (
        <Form.Root className="p-4 mb-4" onSubmit={onSubmit}>
            <h3>{t.Title}</h3>
            <div className="space-y-2">
                <Input
                    name="api_token_name"
                    label={t.FieldNameLabel}
                    required
                    value={name()}
                    onChange={onChangeName}
                    className="sm:mb-0 md:grid grid-cols-6 space-y-1"
                    labelClassName="!font-semibold !text-sm items-center !mb-0 col-span-2"
                    inputWrapperClassName="col-span-4"
                />

                <div className="sm:mb-0 md:grid grid-cols-6 space-y-1">
                    <label
                        htmlFor="mode"
                        className="flex items-center mt-4 sm:mt-0 font-semibold text-sm col-span-2"
                    >
                        {t.FieldExpiresInLabel}
                    </label>
                    <Select
                        name="api_token_expires_in"
                        ariaLabel={t.FieldExpiresInLabel}
                        className="col-span-4 !py-2"
                        value={expiresIn()}
                        onChange={setExpiresIn}
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

                <Button type="submit">{t.ButtonLabel}</Button>
            </div>
        </Form.Root>
    )
}

function LastCreatedAPIToken({ value }: { value: string }) {
    let t = useT("pages/Settings/SystemSettingsTab/LastCreated")

    let onFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
        e.currentTarget.select()
    }, [])

    return (
        <div className="bg-success border-success-dark p-4 rounded">
            <h4 className="text-success-contrast">{t.Title}</h4>
            <p className="text-success-contrast my-2">{t.Notice}</p>
            <input
                className="input px-2 py-1 bg-success-light border-success-light focus:border-success-dark focus:outline-none focus:ring-0"
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
    let t = useT("pages/Settings/SystemSettingsTab/List")

    return (
        <div className="p-4 api-tokens-list">
            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>{t.ColumName}</th>
                            <th>{t.ColumExpires}</th>
                            <th>{t.ColumnCreated}</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody>
                        {tokens.map((token) => (
                            <tr key={token.name}>
                                <td>{token.name}</td>
                                <td>
                                    <DateTime date={token.expiresAt} />
                                </td>
                                <td>
                                    <DateTime
                                        date={token.createdAt}
                                        relative={true}
                                    />
                                </td>
                                <td>
                                    <div className="flex justify-end">
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => onDelete(token.name)}
                                        >
                                            {t.DeleteButton}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex gap-2 mt-2 justify-end">
                <Tooltip content={t.PrevPage}>
                    <Button
                        iconLeft={<CaretLeft />}
                        onClick={prevPage}
                        size="sm"
                        disabled={!hasPreviousPage}
                    />
                </Tooltip>
                <Tooltip content={t.NextPage}>
                    <Button
                        iconLeft={<CaretRight />}
                        onClick={nextPage}
                        size="sm"
                        disabled={!hasNextPage}
                    />
                </Tooltip>
            </div>
        </div>
    )
}
