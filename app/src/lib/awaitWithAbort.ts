export function awaitWithAbort<R>(other: Promise<R>, signal?: AbortSignal): Promise<R> {
    if (!signal) {
        return other
    }

    return Promise.race([
        other,
        new Promise<R>((_, reject) => {
            signal.addEventListener("abort", (evt) => reject((evt.target as AbortSignal).reason), {
                once: true,
            })
        }),
    ])
}
