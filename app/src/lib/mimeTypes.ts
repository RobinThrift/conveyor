export const mimeTypesByExtension: { [key: string]: string } = Object.freeze({
    "7z": "application/x-7z-compressed",
    aac: "audio/aac",
    abw: "application/x-abiword",
    arc: "application/x-freearc",
    azw: "application/vnd.amazon.ebook",
    bin: "application/octet-stream",
    bmp: "image/bmp",
    bz: "application/x-bzip",
    bz2: "application/x-bzip2",
    cda: "application/x-cdf",
    csh: "application/x-csh",
    css: "text/css",
    csv: "text/csv",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    epub: "application/epub+zip",
    gif: "image/gif",
    glb: "model/gltf-binary",
    gltf: "model/gltf",
    gz: "application/gzip",
    htm: "text/html",
    html: "text/html",
    ico: "image/vnd.microsoft.icon",
    ics: "text/calendar",
    jar: "application/java-archive",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    js: "text/javascript",
    json: "application/json",
    jsonld: "application/ld+json",
    mid: "audio/midi audio/x-midi",
    midi: "audio/midi audio/x-midi",
    mjs: "text/javascript",
    mp3: "audio/mpeg",
    mp4: "video/mp4",
    mpeg: "video/mpeg",
    obj: "model/obj",
    odp: "application/vnd.oasis.opendocument.presentation",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
    odt: "application/vnd.oasis.opendocument.text",
    oga: "audio/ogg",
    ogv: "video/ogg",
    ogx: "application/ogg",
    opus: "audio/opus",
    pdf: "application/pdf",
    php: "application/x-httpd-php",
    png: "image/png",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    rar: "application/vnd.rar",
    rtf: "application/rtf",
    sh: "application/x-sh",
    stl: "model/stl",
    svg: "image/svg+xml",
    tar: "application/x-tar",
    tif: "image/tiff",
    tiff: "image/tiff",
    ts: "video/mp2t",
    txt: "text/plain",
    vsd: "application/vnd.visio",
    wav: "audio/wav",
    weba: "audio/webm",
    webm: "video/webm",
    webp: "image/webp",
    xhtml: "application/xhtml+xml",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xml: "application/xml",
    xul: "application/vnd.mozilla.xul+xml",
    zip: "application/zip",
})

export function mimeTypeForFilename(filename: string): string {
    let dotindex = filename.lastIndexOf(".")
    if (dotindex === -1) {
        return mimeTypesByExtension[filename as any] || "application/octet-stream"
    }
    return mimeTypesByExtension[filename.substring(dotindex + 1)] || "application/octet-stream"
}

export function extensionForMimeType(mime: string): string {
    for (let [ext, candidate] of Object.entries(mimeTypesByExtension)) {
        if (candidate === mime) {
            return ext
        }
    }
    return ".bin"
}
