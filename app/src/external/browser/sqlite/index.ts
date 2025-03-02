export * from "./sqlite"

// import type { Database } from "../../database"
// import { migrate } from "../migrator"
// import { SQLiteWorker } from "./sqlite"
//
// let _worker: Promise<SQLiteWorker> | undefined = undefined
//
// let worker: SQLiteWorker
//
// export async function startWorker(params: {
//     file: string
//     enckey: string
//     enableTracing?: boolean
// }) {
//     if (_worker) {
//         await _worker
//         return
//     }
//
//     _worker = (async function initWorker() {
//         let worker = new SQLiteWorker()
//
//         await worker.open(params)
//
//         await migrate(worker)
//
//         return worker
//     })()
//
//     worker = await _worker
// }
//
// export function getDB(): Database {
//     return worker
// }
