import type { Context } from "@/lib/context"
import type { DBExec, Transactioner } from "@/lib/database"
import { fromAsyncFn } from "@/lib/result"

const migrations = import.meta.glob<boolean, string, string>(
    "./migrations/*.sql",
    {
        query: "?raw",
        import: "default",
    },
)

export async function migrate(ctx: Context, db: DBExec & Transactioner) {
    performance.mark("migrate:start")
    console.log("running migrations")

    let tx: typeof db = ctx.getData("db") ?? db

    await createMigrationTable(tx)

    performance.mark("migrate:get-last-applied-migration:start")
    let lastAppliedMigration = await tx.queryOne<{ version: string }>(
        "SELECT version FROM migrations ORDER BY id DESC LIMIT 1",
    )
    performance.mark("migrate:get-last-applied-migration:end", {
        detail: { lastAppliedMigration },
    })

    if (lastAppliedMigration?.version) {
        console.log(`newest migration is ${lastAppliedMigration?.version}`)
    }

    let versions = Object.keys(migrations)
    versions.sort()

    if (lastAppliedMigration?.version) {
        let lastAppliedIndex = versions.findIndex((v) =>
            v.includes(lastAppliedMigration?.version),
        )
        if (lastAppliedIndex !== -1) {
            versions = versions.slice(lastAppliedIndex + 1)
        }

        if (versions.length === 0) {
            console.log("no new migrations to apply")
            performance.mark("migrate:end", {
                detail: { info: "no new migrations to apply" },
            })
            return
        }
    }

    console.log(`${versions.length} migration(s) to apply`)

    for (let versionFile of versions) {
        let version = versionFile
            .replace("./migrations/", "")
            .replace(".sql", "")
        console.log(`applying migration ${version}`)
        performance.mark("migrate:migrate-apply:start", {
            detail: `version: ${version}`,
        })

        try {
            let sql = await migrations[versionFile]()

            await db.inTransaction(ctx, async (ctx) => {
                let tx = ctx.getData("db")
                return fromAsyncFn(async () => {
                    await tx.exec(sql)
                    await tx.exec(
                        "INSERT INTO migrations (version) VALUES(?1)",
                        [version],
                    )
                })
            })
            performance.mark("migrate:migrate-apply:end")
        } catch (e) {
            performance.mark("migrate:migrate-apply:end")
            performance.mark("migrate:end")
            throw new Error(`error applying migration ${version}: ${e}`)
        }
    }

    performance.mark("migrate:end")
    console.log("database fully migrated")
}

async function createMigrationTable(db: DBExec) {
    await db.exec(`CREATE TABLE IF NOT EXISTS migrations (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    version    TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%SZ', CURRENT_TIMESTAMP))
);`)
}
