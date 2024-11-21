import { Input } from "@/components/Input"
import { useDebounce } from "@/hooks/useDebounce"
import { MagnifyingGlass } from "@phosphor-icons/react"
import * as Form from "@radix-ui/react-form"
import React, { useCallback } from "react"

export function SearchBar(props: {
    className?: string
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
        <Form.Root className={props.className} onSubmit={onSubmit}>
            <Input
                name="q"
                type="search"
                icon={<MagnifyingGlass weight="duotone" />}
                onChange={onChangeDebounced}
            />
        </Form.Root>
    )
}
