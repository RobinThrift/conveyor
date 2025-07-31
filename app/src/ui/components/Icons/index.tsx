import { CaretRightIcon as CaretRightIconBase } from "@phosphor-icons/react/CaretRight"
import { HashIcon as HashIconBase } from "@phosphor-icons/react/Hash"
import React from "react"

export { ArchiveIcon } from "@phosphor-icons/react/Archive"
export { ArrowLeftIcon } from "@phosphor-icons/react/ArrowLeft"
export { ArrowsClockwiseIcon } from "@phosphor-icons/react/ArrowsClockwise"
export { ArrowUDownLeftIcon } from "@phosphor-icons/react/ArrowUDownLeft"
export { ArrowUpRightIcon } from "@phosphor-icons/react/ArrowUpRight"
export { AsteriskIcon } from "@phosphor-icons/react/Asterisk"
export { CaretDownIcon } from "@phosphor-icons/react/CaretDown"
export { CaretLeftIcon } from "@phosphor-icons/react/CaretLeft"
export const CaretRightIcon = React.memo(CaretRightIconBase)
export { CheckIcon } from "@phosphor-icons/react/Check"
export { ClipboardIcon } from "@phosphor-icons/react/Clipboard"
export { CloudArrowDownIcon } from "@phosphor-icons/react/CloudArrowDown"
export { CloudArrowUpIcon } from "@phosphor-icons/react/CloudArrowUp"
export { CloudCheckIcon } from "@phosphor-icons/react/CloudCheck"
export { CloudSlashIcon } from "@phosphor-icons/react/CloudSlash"
export { CodeIcon } from "@phosphor-icons/react/Code"
export { CopyIcon } from "@phosphor-icons/react/Copy"
export { DatabaseIcon } from "@phosphor-icons/react/Database"
export { DotsThreeVerticalIcon } from "@phosphor-icons/react/DotsThreeVertical"
export { FlaskIcon } from "@phosphor-icons/react/Flask"
export { GlobeIcon } from "@phosphor-icons/react/Globe"
export const HashIcon = React.memo(HashIconBase)
export { InfoIcon } from "@phosphor-icons/react/Info"
export { KeyIcon } from "@phosphor-icons/react/Key"
export { KeyboardIcon } from "@phosphor-icons/react/Keyboard"
export { LinkIcon } from "@phosphor-icons/react/Link"
export { ListIcon } from "@phosphor-icons/react/List"
export { MagnifyingGlassIcon } from "@phosphor-icons/react/MagnifyingGlass"
export { MoonIcon } from "@phosphor-icons/react/Moon"
export { PaletteIcon } from "@phosphor-icons/react/Palette"
export { PasswordIcon } from "@phosphor-icons/react/Password"
export { PencilIcon } from "@phosphor-icons/react/Pencil"
export { PlusIcon } from "@phosphor-icons/react/Plus"
export { SlidersIcon } from "@phosphor-icons/react/Sliders"
export { SunIcon } from "@phosphor-icons/react/Sun"
export { SunHorizonIcon } from "@phosphor-icons/react/SunHorizon"
export { TableIcon } from "@phosphor-icons/react/Table"
export { TextBolderIcon } from "@phosphor-icons/react/TextB"
export { TextItalicIcon } from "@phosphor-icons/react/TextItalic"
export { TrashSimpleIcon as BinIcon } from "@phosphor-icons/react/TrashSimple"
export { UserIcon } from "@phosphor-icons/react/User"
export { WarningIcon } from "@phosphor-icons/react/Warning"
export { XIcon } from "@phosphor-icons/react/X"
export { LockIcon } from "./LockIcon"

// Inlined from https://phosphoricons.com
// License MIT
export function PlusCircleIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true">
            <circle
                cx="128"
                cy="128"
                r="96"
                stroke="currentColor"
                stroke-miterlimit="10"
                stroke-width="16"
            />
            <line
                x1="88"
                y1="128"
                x2="168"
                y2="128"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="16"
            />
            <line
                x1="128"
                y1="88"
                x2="128"
                y2="168"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="16"
            />
        </svg>
    )
}
