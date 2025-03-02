import React from "react"

// import type { APIToken } from "@/domain/APIToken"
// import { add } from "@/lib/i18n"
// import { Alert } from "@/ui/components/Alert"
// import { Button } from "@/ui/components/Button"
// import { DateTime } from "@/ui/components/DateTime"
// import * as Form from "@/ui/components/Form"
// import { CaretLeftIcon, CaretRightIcon } from "@/ui/components/Icons"
// import { Input } from "@/ui/components/Input"
// import { Loader } from "@/ui/components/Loader"
// import { Select } from "@/ui/components/Select"
// import { Tooltip } from "@/ui/components/Tooltip"
// import { useStateGetter } from "@/ui/hooks/useStateGetter"
// import { useT } from "@/ui/i18n"

// import { useSystemSettingsTabState } from "./useSystemSettingsTabState"

export const SystemSettingsTab = React.forwardRef<HTMLDivElement>(
    function SystemSettingsTab(_, forwardedRef) {
        return <div ref={forwardedRef} />
        // let {
        //     apiTokens,
        //     isLoading,
        //     error,
        //     hasNextPage,
        //     hasPrevPage,
        //     lastCreatedValue,
        //     loadPrevPage,
        //     loadNextPage,
        //     createAPIToken,
        //     deleteAPIToken,
        // } = useSystemSettingsTabState()
        //
        // return (
        //     <div
        //         ref={forwardedRef}
        //         className="settings-system-tab settings-section-content"
        //     >
        //         <APITokensSections
        //             isLoading={isLoading}
        //             apiTokens={apiTokens}
        //             hasPreviousPage={hasPrevPage}
        //             hasNextPage={hasNextPage}
        //             lastCreatedValue={lastCreatedValue}
        //             error={error}
        //             loadPrevPage={loadPrevPage}
        //             loadNextPage={loadNextPage}
        //             createAPIToken={createAPIToken}
        //             deleteAPIToken={deleteAPIToken}
        //         />
        //     </div>
        // )
    },
)

// function APITokensSections(props: {
//     isLoading: boolean
//     apiTokens: APIToken[]
//     hasPreviousPage: boolean
//     hasNextPage: boolean
//     lastCreatedValue?: string
//     error?: Error
//     loadNextPage: () => void
//     loadPrevPage: () => void
//     createAPIToken: (token: { name: string; expiresAt: Date }) => void
//     deleteAPIToken: (name: string) => void
// }) {
//     let t = useT("screens/Settings/SystemSettings")
//
//     return (
//         <div className="settings-sub-section">
//             <h3>{t.SectionAPITokensTitle}</h3>
//             <small>{t.SectionAPITokensDescription}</small>
//
//             <div className="settings-sub-section relative mt-4">
//                 {props.error && (
//                     <Alert variant="danger">{props.error.message}</Alert>
//                 )}
//
//                 {props.lastCreatedValue && (
//                     <LastCreatedAPIToken value={props.lastCreatedValue} />
//                 )}
//
//                 <CreateNewAPIToken onSubmit={props.createAPIToken} />
//
//                 {props.isLoading && (
//                     <div className="absolute inset-0 flex justify-center items-centerbg-body-contrast/80 rounded-lg z-20">
//                         <Loader />
//                     </div>
//                 )}
//             </div>
//
//             <div className="settings-sub-section relative mt-4">
//                 {props.isLoading && (
//                     <div className="absolute inset-0 flex justify-center items-center bg-body-contrast/80 rounded-lg">
//                         <Loader />
//                     </div>
//                 )}
//
//                 <APITokensList
//                     tokens={props.apiTokens}
//                     hasPreviousPage={props.hasPreviousPage}
//                     hasNextPage={props.hasNextPage}
//                     prevPage={props.loadPrevPage}
//                     nextPage={props.loadNextPage}
//                     onDelete={props.deleteAPIToken}
//                 />
//             </div>
//         </div>
//     )
// }
//
// function CreateNewAPIToken({
//     onSubmit: create,
// }: { onSubmit: (token: { name: string; expiresAt: Date }) => void }) {
//     let t = useT("screens/Settings/SystemSettings/New")
//
//     let [name, setName] = useStateGetter("")
//     let [expiresIn, setExpiresIn] = useStateGetter<
//         "1d" | "7d" | "30d" | "6m" | "12m"
//     >("1d")
//
//     let onChangeName = useCallback(
//         (e: React.ChangeEvent<HTMLInputElement>) => {
//             setName(e.target.value)
//         },
//         [setName],
//     )
//
//     let onSubmit = useCallback(
//         (e: React.FormEvent<HTMLFormElement>) => {
//             e.preventDefault()
//             e.stopPropagation()
//
//             let expiresAt = new Date()
//             switch (expiresIn()) {
//                 case "1d":
//                     expiresAt = add(expiresAt, { days: 1 })
//                     break
//                 case "7d":
//                     expiresAt = add(expiresAt, { days: 7 })
//                     break
//                 case "30d":
//                     expiresAt = add(expiresAt, { days: 30 })
//                     break
//                 case "6m":
//                     expiresAt = add(expiresAt, { months: 6 })
//                     break
//                 case "12m":
//                     expiresAt = add(expiresAt, { months: 12 })
//                     break
//             }
//
//             create({
//                 name: name(),
//                 expiresAt,
//             })
//         },
//         [create, name, expiresIn],
//     )
//
//     return (
//         <Form.Root onSubmit={onSubmit}>
//             <h4>{t.Title}</h4>
//             <div className="space-y-2">
//                 <Input
//                     name="api_token_name"
//                     label={t.FieldNameLabel}
//                     required
//                     value={name()}
//                     onChange={onChangeName}
//                     className="sm:mb-0 md:grid grid-cols-6 space-y-1"
//                     labelClassName="!font-semibold !text-sm items-center !mb-0 col-span-2"
//                     inputWrapperClassName="col-span-4"
//                 />
//
//                 <div className="sm:mb-0 md:grid grid-cols-6 space-y-1">
//                     <label
//                         htmlFor="mode"
//                         className="flex items-center mt-4 sm:mt-0 font-semibold text-sm col-span-2"
//                     >
//                         {t.FieldExpiresInLabel}
//                     </label>
//                     <Select
//                         name="api_token_expires_in"
//                         ariaLabel={t.FieldExpiresInLabel}
//                         className="col-span-4 !py-2"
//                         value={expiresIn()}
//                         onChange={setExpiresIn}
//                     >
//                         <Select.Option value="1d">
//                             {t.FieldExpiresInValueDays(1)}
//                         </Select.Option>
//                         <Select.Option value="7d">
//                             {t.FieldExpiresInValueDays(7)}
//                         </Select.Option>
//                         <Select.Option value="30d">
//                             {t.FieldExpiresInValueDays(30)}
//                         </Select.Option>
//                         <Select.Option value="6m">
//                             {t.FieldExpiresInValueMonths(6)}
//                         </Select.Option>
//                         <Select.Option value="12m">
//                             {t.FieldExpiresInValueMonths(12)}
//                         </Select.Option>
//                     </Select>
//                 </div>
//
//                 <Button type="submit">{t.ButtonLabel}</Button>
//             </div>
//         </Form.Root>
//     )
// }
//
// function LastCreatedAPIToken({ value }: { value: string }) {
//     let t = useT("screens/Settings/SystemSettings/LastCreated")
//
//     let onFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
//         e.currentTarget.select()
//     }, [])
//
//     return (
//         <div className="bg-success border-success-dark p-4 rounded">
//             <h4 className="text-success-contrast">{t.Title}</h4>
//             <p className="text-success-contrast my-2">{t.Notice}</p>
//             <input
//                 className="input px-2 py-1 bg-success-light border-success-light focus:border-success-dark focus:outline-none focus:ring-0"
//                 readOnly
//                 value={value}
//                 onFocus={onFocus}
//             />
//         </div>
//     )
// }
//
// function APITokensList({
//     tokens,
//     hasPreviousPage,
//     hasNextPage,
//     nextPage,
//     prevPage,
//     onDelete,
// }: {
//     tokens: APIToken[]
//     hasPreviousPage: boolean
//     hasNextPage: boolean
//     nextPage: () => void
//     prevPage: () => void
//     onDelete: (name: string) => void
// }) {
//     let t = useT("screens/Settings/SystemSettings/List")
//
//     return (
//         <div className="api-tokens-section">
//             <ul className="api-tokens-list">
//                 {tokens.map((token) => (
//                     <li key={token.name} className="api-token">
//                         <dl>
//                             <dt className="sr-only">{t.LabelName}</dt>
//                             <dd className="api-token-name">{token.name}</dd>
//
//                             <div className="api-token-expires-at">
//                                 <dt>{t.LabelExpires}</dt>
//                                 <dd>
//                                     <DateTime date={token.expiresAt} />
//                                 </dd>
//                             </div>
//
//                             <div className="api-token-created-at">
//                                 <dt>{t.LabelCreated}</dt>
//                                 <dd>
//                                     <DateTime
//                                         date={token.createdAt}
//                                         relative={true}
//                                     />
//                                 </dd>
//                             </div>
//                         </dl>
//
//                         <div className="flex tablet:justify-end mt-2 tablet:-mt-8">
//                             <Button
//                                 variant="danger"
//                                 size="sm"
//                                 onClick={() => onDelete(token.name)}
//                             >
//                                 {t.DeleteButton}
//                             </Button>
//                         </div>
//                     </li>
//                 ))}
//             </ul>
//
//             <div className="flex gap-2 mt-2 justify-end">
//                 <Tooltip content={t.PrevPage}>
//                     <Button
//                         iconLeft={<CaretLeftIcon />}
//                         onClick={prevPage}
//                         size="sm"
//                         disabled={!hasPreviousPage}
//                     />
//                 </Tooltip>
//                 <Tooltip content={t.NextPage}>
//                     <Button
//                         iconLeft={<CaretRightIcon />}
//                         onClick={nextPage}
//                         size="sm"
//                         disabled={!hasNextPage}
//                     />
//                 </Tooltip>
//             </div>
//         </div>
//     )
// }
