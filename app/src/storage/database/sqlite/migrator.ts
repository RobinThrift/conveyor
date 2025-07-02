import { privateKeyToDBKey } from "@/external/browser/sqlite/privateKeyToDBKey"
import type { Context } from "@/lib/context"
import type { DBExec, Database, Transactioner } from "@/lib/database"
import { type AsyncResult, fromAsyncFn } from "@/lib/result"

const migrations = import.meta.glob<boolean, string, string>("./migrations/*.sql", {
    query: "?raw",
    import: "default",
})

export async function migrate(ctx: Context, db: DBExec & Transactioner) {
    performance.mark("sql:migrate:start")
    console.log("running migrations")

    let tx: typeof db = ctx.getData("db") ?? db

    await createMigrationTable(tx)

    performance.mark("sql:migrate:get-last-applied-migration:start")

    let lastAppliedMigration = await tx.queryOne<{ version: string }>(
        "SELECT version FROM migrations ORDER BY id DESC LIMIT 1",
    )
    performance.mark("sql:migrate:get-last-applied-migration:end", {
        detail: { lastAppliedMigration },
    })

    if (lastAppliedMigration?.version) {
        console.log(`newest migration is ${lastAppliedMigration?.version}`)
    }

    let versions = Object.keys(migrations)
    versions.sort()

    if (lastAppliedMigration?.version) {
        let lastAppliedIndex = versions.findIndex((v) => v.includes(lastAppliedMigration?.version))
        if (lastAppliedIndex !== -1) {
            versions = versions.slice(lastAppliedIndex + 1)
        }

        if (versions.length === 0) {
            console.log("no new migrations to apply")
            performance.mark("sql:migrate:end", {
                detail: { info: "no new migrations to apply" },
            })
            return
        }
    }

    console.log(`${versions.length} migration(s) to apply`)

    for (let versionFile of versions) {
        let version = versionFile.replace("./migrations/", "").replace(".sql", "")
        console.log(`applying migration ${version}`)
        performance.mark("sql:migrate:migrate-apply:start", {
            detail: `version: ${version}`,
        })

        try {
            let sql = await migrations[versionFile]()

            await db.inTransaction(ctx, async (ctx) => {
                let tx = ctx.getData("db")
                return fromAsyncFn(async () => {
                    await tx.exec(sql)
                    await tx.exec("INSERT INTO migrations (version) VALUES(?1)", [version])
                })
            })
            performance.mark("sql:migrate:migrate-apply:end")
        } catch (e) {
            performance.mark("sql:migrate:migrate-apply:end")
            performance.mark("sql:migrate:end")
            throw new Error(`error applying migration ${version}: ${e}`)
        }
    }

    await tx.exec("PRAGMA user_version = 1;")

    performance.mark("sql:migrate:end")
    console.log("database fully migrated")
}

async function createMigrationTable(db: DBExec) {
    await db.exec(`CREATE TABLE IF NOT EXISTS migrations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    version    TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP))
);`)
}

export async function migrateDBEncryption(
    ctx: Context,
    { db, enckey }: { db: Database; enckey: string },
): AsyncResult<any> {
    return fromAsyncFn(async () => {
        let userVersion = await db.queryOne<{ user_version: number }>("PRAGMA user_version")
        if (userVersion?.user_version === 1) {
            return
        }

        return migrateDBEncryptionToV1(ctx, { db, enckey })
    })
}

async function migrateDBEncryptionToV1(
    ctx: Context,
    { db, enckey }: { db: Database; enckey: string },
): AsyncResult<any> {
    let originalFile = "conveyor.db"
    let targetFileName = "conveyor_migrate_db_enc.db"
    return fromAsyncFn(async () => {
        let rootDir = await navigator.storage.getDirectory()

        try {
            await Promise.all([
                rootDir.removeEntry(targetFileName),
                rootDir.removeEntry(`${originalFile}.bk`),
            ])
        } catch {
            // ignore
        }

        await db.exec(
            `ATTACH DATABASE '${targetFileName}' AS target KEY "x'${privateKeyToDBKey(enckey)}'"`,
        )

        await db.exec("SELECT sqlcipher_export('target')")

        await db.exec("PRAGMA target.user_version = 1;")

        await db.exec(`DETACH DATABASE 'target'`)

        await db.close()

        let dbFile = await rootDir.getFileHandle(originalFile)
        let dbFileBackup = await rootDir.getFileHandle(`${originalFile}.bk`, {
            create: true,
        })
        let targetFile = await rootDir.getFileHandle(targetFileName)

        let dbFileHandle: FileSystemSyncAccessHandle | undefined
        let targetFileHandle: FileSystemSyncAccessHandle | undefined
        let dbFileBackupHandle: FileSystemSyncAccessHandle | undefined
        try {
            dbFileHandle = await dbFile.createSyncAccessHandle()
            dbFileBackupHandle = await dbFileBackup.createSyncAccessHandle()
            targetFileHandle = await targetFile.createSyncAccessHandle()

            let bkdata = new Uint8Array(dbFileHandle.getSize())
            dbFileHandle.read(bkdata)

            dbFileBackupHandle.write(bkdata)

            dbFileBackupHandle.flush()

            dbFileHandle.truncate(0)

            let newData = new Uint8Array(targetFileHandle.getSize())
            targetFileHandle.read(newData)

            dbFileHandle.write(newData)
        } finally {
            dbFileHandle?.close()
            dbFileBackupHandle?.close()
            targetFileHandle?.close()
        }

        await db.open(ctx, { file: originalFile, enckey, enableTracing: false })
    })
}
