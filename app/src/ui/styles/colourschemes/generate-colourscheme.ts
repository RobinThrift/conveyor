import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { converter, formatCss, type Hsl } from "culori"

const variants = ["DEFAULT", "light", "extra-light", "dark", "extra-dark", "contrast"]

const requireVariants = ["primary", "success", "danger", "subtle"]

type RequireVariants = (typeof requireVariants)[number]

type Variants = (typeof variants)[number]

type BaseColours = {
    "body-bg": string
    "body-bg-contrast": string
    "surface-level-1": string
    "surface-level-2": string
    "surface-border": string
    text: string
    "modal-overlay-bg": string
}

type ColourScheme = {
    light: BaseColours & Record<RequireVariants, string>
    dark: BaseColours & Record<RequireVariants, string>
}

type Output = BaseColours & Record<RequireVariants, Record<Variants, string>>

const toOKLCH = converter("oklch")
const toHSL = converter("hsl")

async function main(file: string) {
    let scheme: ColourScheme = JSON.parse(
        await readFile(join(import.meta.dirname, `${file}.json`), "utf-8"),
    )

    for (let mode in scheme) {
        let colours = scheme[mode as keyof ColourScheme]
        let output: Output = {
            // biome-ignore lint/style/noNonNullAssertion: will never be undefined
            "body-bg": formatCss(toOKLCH(colours["body-bg"]))!,
            // biome-ignore lint/style/noNonNullAssertion: will never be undefined
            "body-bg-contrast": formatCss(toOKLCH(colours["body-bg-contrast"]))!,
            // biome-ignore lint/style/noNonNullAssertion: will never be undefined
            "surface-level-1": formatCss(toOKLCH(colours["surface-level-1"]))!,
            // biome-ignore lint/style/noNonNullAssertion: will never be undefined
            "surface-level-2": formatCss(toOKLCH(colours["surface-level-2"]))!,
            // biome-ignore lint/style/noNonNullAssertion: will never be undefined
            "surface-border": formatCss(toOKLCH(colours["surface-border"]))!,
            // biome-ignore lint/style/noNonNullAssertion: will never be undefined
            text: formatCss(toOKLCH(colours.text))!,
            // biome-ignore lint/style/noNonNullAssertion: will never be undefined
            "modal-overlay-bg": formatCss(toOKLCH(colours["modal-overlay-bg"]))!,
        } as Output

        for (let name of requireVariants) {
            // biome-ignore lint/style/noNonNullAssertion: will never be undefined
            let colour = toHSL(colours[name])!
            let palette = generatePalette(colour)
            output[name] = palette
        }

        console.log(`/* ${mode.toUpperCase()} */`)
        console.log(outputToCSS(output))
        console.log("\n")
    }
}

type Palette = Record<Variants, string>

export const DEFAULT_STOPS = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000]

function generatePalette(value: Hsl): Palette {
    let valueStop = 500

    let h = 0
    let s = 0
    let lMin = 0
    let lMax = 100

    let hueScale = createHueScale(h, valueStop)
    let saturationScale = createSaturationScale(s, valueStop)

    let { h: valueH = 0, s: valueS, l: lightnessValue } = value
    valueS = +(valueS * 100).toFixed(1)
    lightnessValue = +(lightnessValue * 100).toFixed(1)

    let distributionScale = createDistributionValues(lMin, lMax, lightnessValue, valueStop)

    let swatches = hueScale.map(({ stop }, stopIndex) => {
        let newH = unsignedModulo(valueH + hueScale[stopIndex].tweak, 360)
        let newS = clamp(valueS + saturationScale[stopIndex].tweak, 0, 100)
        let newL = distributionScale[stopIndex].tweak
        newL = clamp(newL, 0, 100)

        let name: keyof Palette
        switch (stop) {
            case 50:
                name = "contrast"
                break
            case 100:
                name = "extra-light"
                break
            case 400:
                name = "light"
                break
            case 500:
                name = "DEFAULT"
                break
            case 600:
                name = "dark"
                break
            case 800:
                name = "extra-dark"
                break
            default:
                return null
        }

        return [
            name,
            formatCss(
                toOKLCH({
                    ...value,
                    h: newH,
                    s: newS / 100,
                    l: newL / 100,
                }),
            ),
        ]
    })

    return Object.fromEntries(swatches.filter((s) => s !== null))
}

function createHueScale(tweak: number, stop: number) {
    let stops = DEFAULT_STOPS
    let index = stops.indexOf(stop)

    if (index === -1) {
        throw new Error(`Invalid parameter value: ${stop}`)
    }

    return stops.map((stop) => {
        let diff = Math.abs(stops.indexOf(stop) - index)
        let tweakValue = tweak ? diff * tweak : 0

        return { stop, tweak: tweakValue }
    })
}

function createSaturationScale(tweak: number, stop: number) {
    let stops = DEFAULT_STOPS
    let index = stops.indexOf(stop)

    if (index === -1) {
        throw new Error(`Invalid key value: ${stop}`)
    }

    return stops.map((stop) => {
        let diff = Math.abs(stops.indexOf(stop) - index)
        let tweakValue = tweak ? Math.round((diff + 1) * tweak * (1 + diff / 10)) : 0

        if (tweakValue > 100) {
            return { stop, tweak: 100 }
        }

        return { stop, tweak: tweakValue }
    })
}

function createDistributionValues(min: number, max: number, lightness: number, stop: number) {
    let stops = DEFAULT_STOPS

    let newValues = [
        { stop: 0, tweak: max },
        { stop, tweak: lightness },
        { stop: 1000, tweak: min },
    ]

    for (let i = 0; i < stops.length; i++) {
        let stopValue = stops[i]

        if (stopValue === 0 || stopValue === 1000 || stopValue === stop) {
            continue
        }

        let diff = Math.abs((stopValue - stop) / 100)
        let totalDiff =
            stopValue < stop
                ? Math.abs(stops.indexOf(stop) - stops.indexOf(DEFAULT_STOPS[0])) - 1
                : Math.abs(
                      stops.indexOf(stop) - stops.indexOf(DEFAULT_STOPS[DEFAULT_STOPS.length - 1]),
                  ) - 1
        let increment = stopValue < stop ? max - lightness : lightness - min

        let tweak =
            stopValue < stop
                ? (increment / totalDiff) * diff + lightness
                : lightness - (increment / totalDiff) * diff

        newValues.push({ stop: stopValue, tweak: Math.round(tweak) })
    }

    newValues.sort((a, b) => a.stop - b.stop)

    return newValues
}

function unsignedModulo(x: number, n: number) {
    return ((x % n) + n) % n
}

function clamp(x: number, min: number, max: number) {
    return Math.min(Math.max(x, min), max)
}

function outputToCSS(output: Output): string {
    let css = ""

    for (let name in output) {
        let colour = output[name]
        if (typeof colour === "string") {
            css += `--color-${name}: ${colour};\n`
            continue
        }

        css += "\n"
        for (let variant in colour) {
            if (variant === "DEFAULT") {
                css += `--color-${name}: ${colour[variant]};\n`
            } else {
                css += `--color-${name}-${variant}: ${colour[variant]};\n`
            }
        }
    }

    return css.trim()
}

await main(process.argv[2]).catch(console.error)
