import { Form } from "@radix-ui/react-form"
import { useStore } from "@tanstack/react-store"
import clsx from "clsx"
import React, { useCallback } from "react"

import { MagnifyingGlassIcon } from "@/ui/components/Icons"
import { Input } from "@/ui/components/Input"
import { useDebounce } from "@/ui/hooks/useDebounce"
import { useT } from "@/ui/i18n"
import { actions, selectors, stores } from "@/ui/stores"

export function SearchBar(props: { className?: string }) {
    let t = useT("components/MemoListFilter/Search")
    let queryFilter = useStore(stores.memos.list.filter, selectors.memos.list.filter("query"))
    let onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.trim()
        if (value && !value.endsWith("*")) {
            value += " *"
        }
        actions.memos.list.setFilter({ query: value })
    }, [])

    let [onChangeDebounced] = useDebounce(onChange)

    let onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    return (
        <Form onSubmit={onSubmit} className={clsx("memo-list-filter-search", props.className)}>
            <Input
                name="q"
                type="search"
                label={t.Label}
                labelClassName="sr-only"
                icon={<MagnifyingGlassIcon aria-hidden />}
                onChange={onChangeDebounced}
                defaultValue={queryFilter}
            />
        </Form>
    )
}
