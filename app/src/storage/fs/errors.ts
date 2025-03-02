export class FSErrNotFound extends Error {
    constructor(filepath: string) {
        super(`not found: ${filepath}`)
    }
}
