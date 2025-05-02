import { lazy } from "react"

export { Archive as ArchiveIcon } from "@phosphor-icons/react/Archive"
export { ArrowLeft as ArrowLeftIcon } from "@phosphor-icons/react/ArrowLeft"
export { ArrowUDownLeft as ArrowUDownLeftIcon } from "@phosphor-icons/react/ArrowUDownLeft"
export { ArrowUpRight as ArrowUpRightIcon } from "@phosphor-icons/react/ArrowUpRight"
export { ArrowsCounterClockwise as ArrowsCounterClockwiseIcon } from "@phosphor-icons/react/ArrowsCounterClockwise"
export { CaretDown as CaretDownIcon } from "@phosphor-icons/react/CaretDown"
export { CaretLeft as CaretLeftIcon } from "@phosphor-icons/react/CaretLeft"
export { CaretRight as CaretRightIcon } from "@phosphor-icons/react/CaretRight"
export { Check as CheckIcon } from "@phosphor-icons/react/Check"
export { CloudArrowDown as CloudArrowDownIcon } from "@phosphor-icons/react/CloudArrowDown"
export { CloudArrowUp as CloudArrowUpIcon } from "@phosphor-icons/react/CloudArrowUp"
export { CloudCheck as CloudCheckIcon } from "@phosphor-icons/react/CloudCheck"
export { CloudSlash as CloudSlashIcon } from "@phosphor-icons/react/CloudSlash"
export { Code as CodeIcon } from "@phosphor-icons/react/Code"
export { DotsThreeVertical as DotsThreeVerticalIcon } from "@phosphor-icons/react/DotsThreeVertical"
export { Sliders as SlidersIcon } from "@phosphor-icons/react/Sliders"
export { Globe as GlobeIcon } from "@phosphor-icons/react/Globe"
export { Info as InfoIcon } from "@phosphor-icons/react/Info"
export { Key as KeyIcon } from "@phosphor-icons/react/Key"
export { Link as LinkIcon } from "@phosphor-icons/react/Link"
export { List as ListIcon } from "@phosphor-icons/react/List"
export { MagnifyingGlass as MagnifyingGlassIcon } from "@phosphor-icons/react/MagnifyingGlass"
export { Moon as MoonIcon } from "@phosphor-icons/react/Moon"
export { Palette as PaletteIcon } from "@phosphor-icons/react/Palette"
export { Password as PasswordIcon } from "@phosphor-icons/react/Password"
export { Pencil as PencilIcon } from "@phosphor-icons/react/Pencil"
export { Plus as PlusIcon } from "@phosphor-icons/react/Plus"
export { Sun as SunIcon } from "@phosphor-icons/react/Sun"
export { SunHorizon as SunHorizonIcon } from "@phosphor-icons/react/SunHorizon"
export { Table as TableIcon } from "@phosphor-icons/react/Table"
export { TextBolder as TextBolderIcon } from "@phosphor-icons/react/TextB"
export { TextItalic as TextItalicIcon } from "@phosphor-icons/react/TextItalic"
export { TrashSimple as BinIcon } from "@phosphor-icons/react/TrashSimple"
export { User as UserIcon } from "@phosphor-icons/react/User"
export { Warning as WarningIcon } from "@phosphor-icons/react/Warning"
export { X as XIcon } from "@phosphor-icons/react/X"

export const HashIcon = lazy(() =>
    import("@phosphor-icons/react/Hash").then(({ Hash }) => ({
        default: Hash,
    })),
)

export const KeyboardIcon = lazy(() =>
    import("@phosphor-icons/react/Keyboard").then(({ Keyboard }) => ({
        default: Keyboard,
    })),
)

export const LockIcon = lazy(() =>
    import("./LockIcon").then(({ LockIcon }) => ({
        default: LockIcon,
    })),
)
