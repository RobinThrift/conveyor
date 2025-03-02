import * as Form from "@radix-ui/react-form"
import React, { useCallback } from "react"

import { MagnifyingGlassIcon } from "@/ui/components/Icons"
import { Input } from "@/ui/components/Input"
import { useDebounce } from "@/ui/hooks/useDebounce"

export function SearchBar(props: {
    onChange: (v: string) => void
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
        <Form.Root className="search" onSubmit={onSubmit}>
            <Input
                name="q"
                type="search"
                icon={<MagnifyingGlassIcon weight="duotone" />}
                onChange={onChangeDebounced}
            />
        </Form.Root>
    )
}
