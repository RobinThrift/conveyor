import { TraceMap, originalPositionFor, sourceContentFor } from "@jridgewell/trace-mapping"
import clsx from "clsx"
import React, { useMemo } from "react"

import { Code } from "@/ui/components/Markdown/Code"
import { usePromise } from "@/ui/hooks/usePromise"

import "./DevTools.css"

export const StackTrace = React.memo(function StackTrace({
    className,
    stack,
    filterFrames,
}: { className?: string; stack?: string; filterFrames?: (frame: StackFrame) => boolean }) {
    let stackFrames = usePromise(async () => {
        if (!stack) {
            return null
        }

        let frames = await getStackFrames(stack)

        if (filterFrames) {
            return frames?.filter(filterFrames)
        }

        return frames
    }, [stack, filterFrames])

    if (stackFrames.resolved && stackFrames.error) {
        console.error(stackFrames.error)
    }

    // biome-ignore lint/correctness/useExhaustiveDependencies: this is intentional
    let frameComps = useMemo(() => {
        if (stackFrames.resolved && stackFrames.result) {
            return stackFrames.result.map((frame, i) => {
                //  biome-ignore lint/suspicious/noArrayIndexKey: this is fine
                return <StackFrameComp key={`frame-${i}`} frame={frame} />
            })
        }
    }, [stackFrames.resolved])

    return <ul className={clsx("devtools-stack-trace", className)}>{frameComps}</ul>
})

// Most of this was extracted from the Redux DevTools Stack Trace Monitor
// here: https://github.com/reduxjs/redux-devtools/tree/main/packages/redux-devtools-inspector-monitor-trace-tab

export const StackFrameComp = React.memo(function StackFrameComp({ frame }: { frame: StackFrame }) {
    let url = formatFileURL(frame)

    let hightlightedLines = useMemo(() => {
        let ls: number[] = []
        frame.scriptCode?.forEach((l, i) => {
            if (l.highlight) {
                ls.push(i)
            }
        })

        return ls
    }, [frame.scriptCode])

    let code = useMemo(
        () => frame.scriptCode?.map((l) => l.content).join("\n") ?? "",
        [frame.scriptCode],
    )

    return (
        <li className="devtools-stack-frame">
            <div className="devtools-stack-trace-location">
                <span className="devtools-stack-trace-location-function-name">
                    {frame.getFunctionName()}
                </span>
                <span className="devtools-stack-trace-location-file">{url}</span>
            </div>
            <Code
                className="dark rosepine rounded p-2 my-2 text-wrap text-xs"
                lang="javascript"
                hightlightedLines={hightlightedLines}
            >
                {code}
            </Code>
        </li>
    )
})

type ScriptLine = {
    lineNumber: number
    content: string
    highlight: boolean
}

class StackFrame {
    public functionName: string | null
    public fileName: string
    public lineNumber: number | null
    public columnNumber: number | null
    public scriptCode: ScriptLine[] | null

    constructor(
        functionName: string | null,
        fileName: string,
        lineNumber: number | null = null,
        columnNumber: number | null = null,
        scriptCode: ScriptLine[] | null = null,
    ) {
        this.functionName = functionName
        if (functionName && functionName.indexOf("Object.") === 0) {
            this.functionName = functionName.slice("Object.".length)
        }

        if (
            // Chrome has a bug with inferring function.name:
            // https://github.com/facebook/create-react-app/issues/2097
            // Let's ignore a meaningless name we get for top-level modules.
            functionName === "friendlySyntaxErrorLabel" ||
            functionName === "exports.__esModule" ||
            functionName === "<anonymous>" ||
            !functionName
        ) {
            this.functionName = null
        }

        this.fileName = fileName
        this.lineNumber = lineNumber
        this.columnNumber = columnNumber
        this.scriptCode = scriptCode
    }
    getFunctionName(): string {
        return this.functionName || "(anonymous function)"
    }
}

async function getStackFrames(stack: string, contextSize = 3): Promise<StackFrame[] | null> {
    const parsedFrames = parse(stack.split("\n"))
    let enhancedFrames = await map(parsedFrames, contextSize)
    return enhancedFrames
}

async function getSourceMap(fileUri: string, fileContents: string): Promise<TraceMap> {
    let sm = await extractSourceMapUrl(fileUri, fileContents)
    if (sm.indexOf("data:") === 0) {
        let base64 = /^data:application\/json;([\w=:"-]+;)*base64,/
        let match2 = base64.exec(sm)
        if (!match2) {
            throw new Error("Sorry, non-base64 inline source-map encoding is not supported.")
        }
        sm = sm.substring(match2[0].length)
        sm = window.atob(sm)
        sm = JSON.parse(sm)
        return new TraceMap(sm)
    }

    let index = fileUri.lastIndexOf("/")
    let url = fileUri.substring(0, index + 1) + sm
    let obj = await fetch(url).then((res) => res.json())
    return new TraceMap(obj)
}

function extractSourceMapUrl(fileUri: string, fileContents: string): Promise<string> {
    let regex = /\/\/[#@] ?sourceMappingURL=([^\s'"]+)\s*$/gm
    let match = null
    for (;;) {
        const next = regex.exec(fileContents)
        if (next == null) {
            break
        }
        match = next
    }
    if (!match?.[1]) {
        return Promise.reject(new Error(`Cannot find a source map directive for ${fileUri}.`))
    }

    return Promise.resolve(match[1].toString())
}

function getLinesAround(line: number, count: number, lines: string[]): ScriptLine[] {
    let result: ScriptLine[] = []
    for (
        let index = Math.max(0, line - 1 - count);
        index <= Math.min(lines.length - 1, line - 1 + count);
        ++index
    ) {
        result.push({
            lineNumber: index + 1,
            content: lines[index],
            highlight: index === line - 1,
        } satisfies ScriptLine)
    }
    return result
}

async function map(frames: StackFrame[], contextLines = 3): Promise<StackFrame[]> {
    let cache: Record<string, { fileSource: string; map: TraceMap }> = {}
    let files: string[] = []

    frames.forEach((frame) => {
        let { fileName } = frame
        if (fileName == null) {
            return
        }
        if (files.includes(fileName)) {
            return
        }
        files.push(fileName)
    })

    await Promise.allSettled(
        files.map(async (fileName) => {
            let fileSource = await fetch(fileName).then((r) => r.text())
            let map = await getSourceMap(fileName, fileSource)
            cache[fileName] = { fileSource, map }
        }),
    )

    return frames.map((frame) => {
        let { functionName, fileName, lineNumber, columnNumber, scriptCode } = frame
        let { map } = cache[fileName] || {}
        if (map == null || lineNumber == null) {
            return frame
        }

        let { source, line, column } = originalPositionFor(map, {
            line: lineNumber,
            column: columnNumber ?? 0,
        })

        let originalSource: string[] = []
        if (source) {
            let mapped = sourceContentFor(map, source)
            if (mapped) {
                originalSource = mapped.split("\n")
            }

            let lastSlashIndex = fileName.lastIndexOf("/")

            let srcDirIndex = fileName.indexOf("/assets/src")
            if (srcDirIndex !== -1) {
                source = `src/${fileName.substring(srcDirIndex + 12, lastSlashIndex)}/${source}`
            }

            let nodeModulesIndex = fileName.indexOf("/node_modules/")
            if (nodeModulesIndex !== -1) {
                source = source.replace(/^(\.\.\/)+/, "node_modules/")
            }
        }

        return new StackFrame(
            functionName,
            source ?? fileName,
            line,
            column,
            line ? getLinesAround(line, contextLines, originalSource) : scriptCode,
        )
    })
}

const validFramePattern = /^\s*(at|in)\s.+(:\d+)/

function parse(stack: string[]): StackFrame[] {
    return stack
        .filter((s) => validFramePattern.test(s))
        .map((s) => {
            let frame = s
            if (frame.includes("(eval ")) {
                frame = frame.replace(/(\(eval at [^()]*)|(\),.*$)/g, "")
            }

            if (frame.includes("(at ")) {
                frame = frame.replace(/\(at /, "(")
            }

            let data = frame.trim().split(/\s+/g).slice(1)
            let last = data.pop()

            return new StackFrame(data.join(" ") || null, ...extractLocation(last ?? ""))
        })
}

const locationPattern = /\(?(.+?)(?::(\d+))?(?::(\d+))?\)?$/

function extractLocation(token: string): [string, number, number] {
    return locationPattern
        .exec(token)
        ?.slice(1)
        .map((v) => {
            const p = Number(v)
            if (!Number.isNaN(p)) {
                return p
            }
            return v
        }) as [string, number, number]
}

function formatFileURL(frame: StackFrame): string {
    let { fileName, lineNumber, columnNumber } = frame
    if (fileName && typeof lineNumber === "number") {
        return `${fileName}:${lineNumber}:${columnNumber}`
    }

    return "unknown"
}
