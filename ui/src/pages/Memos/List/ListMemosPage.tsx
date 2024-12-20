import { DateTime } from "@/components/DateTime"
import { Editor } from "@/components/Editor"
import { EndOfListMarker } from "@/components/EndOfListMarker"
import { Filters } from "@/components/Filters"
import { Loader } from "@/components/Loader"
import { Memo, type PartialMemoUpdate } from "@/components/Memo"
import { Select } from "@/components/Select"
import type { Tag } from "@/domain/Tag"
import { useIsMobile } from "@/hooks/useIsMobile"
import { useT } from "@/i18n"
import { useAccountDisplayName } from "@/state/account"
import { useSetting } from "@/state/settings"
import { List, MagnifyingGlass, Minus, Table } from "@phosphor-icons/react"
import { animated, config, useSpring } from "@react-spring/web"
import { useDrag } from "@use-gesture/react"
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    type CreateMemoRequest,
    type Filter,
    useListMemosPageState,
} from "./state"

export interface ListMemosPageProps {
    filter: Filter
    showEditor?: boolean
    onChangeFilters?: (filter: Filter) => void
}

export function ListMemosPage(props: ListMemosPageProps) {
    let t = useT("pages/ListMemos")
    let [listLayout, setListLayout] = useSetting("theme.listLayout")
    let [doubleClickToEdit] = useSetting("controls.doubleClickToEdit")
    let showEditor = props.showEditor ?? true
    let {
        state: { memos, isLoading, filter, tags, isLoadingTags },
        actions,
    } = useListMemosPageState()

    useEffect(() => {
        if (Object.keys(props.filter).length) {
            actions.setFilter(props.filter)
        } else {
            actions.loadPage()
        }
        actions.loadTags()
    }, [actions.setFilter, actions.loadPage, actions.loadTags, props.filter])

    let onClickTag = useCallback(
        (tag: string) => {
            actions.setFilter({
                ...filter,
                tag: tag,
            })
        },
        [filter, actions.setFilter],
    )

    let onEOLReached = useCallback(() => {
        if (!isLoading) {
            actions.loadNextPage()
        }
    }, [isLoading, actions.loadNextPage])

    let updateMemoContentCallback = useCallback(
        (update: PartialMemoUpdate) => {
            actions.updateMemo(update, !("content" in update))
        },
        [actions.updateMemo],
    )

    let onChangeFilters = useCallback(
        (filter: Filter) => {
            if (props.onChangeFilters) {
                props.onChangeFilters(filter)
                return
            }

            actions.setFilter(filter)
        },
        [props.onChangeFilters, actions.setFilter],
    )

    let memoComponents = useMemo(
        () =>
            Object.entries(memos).map(([day, { memos, date, diffToToday }]) => (
                <div key={day} className="memos-list">
                    <DayHeader date={date} diffToToday={diffToToday} />
                    <hr className="memos-list-day-divider" />
                    {memos.map((memo) => (
                        <Memo
                            key={memo.id}
                            memo={memo}
                            tags={tags}
                            actions={{
                                edit: !filter.isArchived && !filter.isDeleted,
                            }}
                            onClickTag={onClickTag}
                            updateMemo={updateMemoContentCallback}
                            doubleClickToEdit={doubleClickToEdit}
                            className="animate-in slide-in-from-bottom fade-in"
                            viewTransitionName={`memo-${memo.id}`}
                        />
                    ))}
                </div>
            )),
        [
            memos,
            filter,
            tags,
            onClickTag,
            updateMemoContentCallback,
            doubleClickToEdit,
        ],
    )

    return (
        <div className={`memos-list-page list-layout-${listLayout}`}>
            <div className="grouped-memos-list">
                <Greeting />

                {showEditor && (
                    <NewMemoEditor
                        tags={tags}
                        createMemo={actions.createMemo}
                        inProgress={isLoading}
                    />
                )}

                <div className="list-layout-select">
                    <Select
                        name="select-layout"
                        ariaLabel={t.LayoutSelectLabel}
                        value={listLayout}
                        onChange={setListLayout}
                    >
                        <Select.Option value="masonry">
                            <div className="flex gap-1 items-center">
                                <List />
                                <span className="option-label">
                                    {t.LayoutMasonry}
                                </span>
                            </div>
                        </Select.Option>
                        <Select.Option value="single">
                            <div className="flex gap-1 items-center">
                                <Table />
                                <span className="option-label">
                                    {t.LayoutSingle}
                                </span>
                            </div>
                        </Select.Option>
                    </Select>
                </div>

                <div className="flex flex-col gap-4 py-4">
                    {memoComponents}
                    {!isLoading && <EndOfListMarker onReached={onEOLReached} />}

                    {isLoading && (
                        <div className="flex justify-center items-center min-h-[200px]">
                            <Loader />
                        </div>
                    )}
                </div>
            </div>

            <FiltersSidebar>
                <Filters
                    filters={filter}
                    tags={{
                        tags,
                        isLoading: isLoadingTags,
                        nextPage: actions.loadNextTagsPage,
                    }}
                    onChangeFilter={onChangeFilters}
                    className="filters-sidebar"
                />
            </FiltersSidebar>
        </div>
    )
}

function NewMemoEditor(props: {
    tags: Tag[]
    createMemo: (memo: CreateMemoRequest) => void
    inProgress: boolean
}) {
    let createMemo = useCallback(
        (memo: CreateMemoRequest) => {
            memo.content = memo.content.trim()
            if (memo.content === "") {
                return
            }

            props.createMemo(memo)
        },
        [props.createMemo],
    )

    let [newMemo, setNewMemo] = useState({
        id: Date.now().toString(),
        name: "",
        content: "",
        isArchived: false,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    })

    useEffect(() => {
        if (!props.inProgress) {
            setNewMemo({
                id: Date.now().toString(),
                name: "",
                content: "",
                isArchived: false,
                isDeleted: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            })
        }
    }, [props.inProgress])

    return (
        <Editor
            memo={newMemo}
            tags={props.tags}
            onSave={createMemo}
            placeholder="Belt out a memo..."
            autoFocus={true}
            className="new-memo-editor"
            buttonPosition="bottom"
        />
    )
}

function FiltersSidebar(props: React.PropsWithChildren) {
    let isMobile = useIsMobile()

    if (isMobile) {
        return <FiltersHeader>{props.children}</FiltersHeader>
    }

    return props.children
}

function FiltersHeader(props: React.PropsWithChildren) {
    let height = globalThis.innerHeight * 1.1
    let [{ y }, api] = useSpring(() => ({ y: 0, config: { clamp: true } }))

    let open = ({ canceled = false }: { canceled?: boolean } = {}) => {
        api.start({
            y: height,
            immediate: false,
            config: canceled ? config.wobbly : config.stiff,
        })
    }

    let close = (velocity = 0) => {
        api.start({
            y: 0,
            immediate: false,
            config: { ...config.stiff, velocity },
        })
    }

    let ref = useRef<HTMLDivElement | null>(null)

    useDrag(
        ({
            last,
            velocity: [, vy],
            direction: [, dy],
            offset: [, offsetY],
            cancel,
            canceled,
        }) => {
            if (offsetY < -70 || offsetY > height) {
                cancel()
            }

            if (last) {
                if (offsetY < height * 0.1 || (vy > 0.5 && dy < 0)) {
                    close(Math.min(vy, 2)) // limit speed top prevent stutter
                } else {
                    open({ canceled })
                }

                return
            }

            api.start({ y: offsetY, immediate: true })
        },
        {
            from: () => [0, y.get()],
            filterTaps: true,
            axis: "y",
            pointer: { touch: true },
            target: ref,
            bounds: { top: 0, bottom: height },
            rubberband: false,
        },
    )

    let style = {
        transform: y.to(
            [0, height],
            ["translateY(-100dvh)", "translateY(0dvh)"],
        ),
    }

    let touchAction = y.to((py) => (py >= height ? "auto" : "none"))

    return (
        <animated.div className="filters-header" style={style}>
            <animated.div
                className="filters-header-content"
                style={{ touchAction }}
            >
                {props.children}
            </animated.div>

            <div ref={ref} className="drag-handle">
                <button
                    className="opened-handle"
                    type="button"
                    onClick={() => close()}
                >
                    <Minus weight="bold" size={48} />
                </button>

                <div className="closed-handle">
                    <button type="button" onClick={() => open()}>
                        <MagnifyingGlass weight="bold" />
                    </button>
                </div>
            </div>
        </animated.div>
    )
}

function DayHeader({ date, diffToToday }: { date: Date; diffToToday: number }) {
    let t = useT("pages/ListMemos")
    let prefix = ""
    if (diffToToday < 1) {
        prefix = t.DayToday
    } else if (diffToToday <= 2) {
        prefix = t.DayYesterday
    }

    if (prefix) {
        return (
            <h2 className="memos-list-day">
                {prefix}
                <span className="named-day-date">
                    (
                    <DateTime date={date} opts={{ dateStyle: "medium" }} />)
                </span>
            </h2>
        )
    }

    return (
        <h2 className="memos-list-day">
            {prefix} <DateTime date={date} opts={{ dateStyle: "medium" }} />
        </h2>
    )
}

function Greeting() {
    let t = useT("components/Greeting")
    let displayName = useAccountDisplayName()
    let greeting = useMemo(() => {
        let now = new Date()
        if (now.getHours() < 12) {
            return t.Morning
        }

        if (now.getHours() < 18) {
            return t.Afternoon
        }

        return t.Evening
    }, [t.Morning, t.Evening, t.Afternoon])

    return (
        <div className="greeting">
            {greeting}
            <span>{displayName}</span>
        </div>
    )
}
