import { type AsyncResult, fromAsyncFn } from "./result"

type OpenGraphData = {
    title: string
    description?: string
    imageURL?: string
}

export async function fetchOpenGraphData(uri: URL): AsyncResult<OpenGraphData | undefined> {
    return fromAsyncFn(async () => {
        let res = await fetch(uri, { credentials: "omit", mode: "cors" })

        let html = await res.text()
        let parser = new DOMParser()
        let doc = parser.parseFromString(html, "text/html")

        let titleEl = doc.querySelector(`meta[property="og:title"]`) ?? doc.querySelector("title")
        let descriptionEl = doc.querySelector(`meta[property="og:description"]`)
        let imageEl = doc.querySelector(`meta[property="og:image"]`)

        if (!titleEl) {
            return
        }

        let imgURL = (imageEl as HTMLMetaElement)?.content
        let imgDataURL: string | undefined
        if (imgURL) {
            try {
                let res = await fetch(imgURL, {
                    credentials: "omit",
                    mode: "cors",
                })
                let imgData = await res.blob()
                imgDataURL = URL.createObjectURL(imgData)
            } catch (err) {
                console.error(err)
            }
        }

        return {
            title: (titleEl as HTMLMetaElement).content ?? titleEl.textContent,
            description: (descriptionEl as HTMLMetaElement)?.content,
            imageURL: imgDataURL,
        }
    })
}
