import { Form } from "@radix-ui/react-form"
import React, { useCallback } from "react"

import { MagnifyingGlassIcon } from "@/ui/components/Icons"
import { Input } from "@/ui/components/Input"
import { useDebounce } from "@/ui/hooks/useDebounce"
import clsx from "clsx"

export function SearchBar(props: {
    onChange: (v: string) => void
    query?: string
    className?: string
}) {
    let onChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            let value = e.target.value.trim()
            if (value && !value.endsWith("*")) {
                value += " *"
            }
            props.onChange(value)
        },
        [props.onChange],
    )

    let [onChangeDebounced] = useDebounce(onChange)

    let onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }, [])

    return (
        <Form
            onSubmit={onSubmit}
            className={clsx("memo-list-filter-search", props.className)}
        >
            <Input
                name="q"
                type="search"
                icon={<MagnifyingGlassIcon />}
                onChange={onChangeDebounced}
                defaultValue={props.query}
            />
        </Form>
    )
}
