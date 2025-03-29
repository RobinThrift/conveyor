// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

//! Interface with SQL databases through [sqlx](https://github.com/launchbadge/sqlx). Modified to only supporting  `sqlite`

mod commands;
mod decode;
mod error;
mod wrapper;

pub use error::Error;
pub use wrapper::{DbPool, SqliteOptions, SqliteTransaction};

use serde::Serialize;
use std::collections::HashMap;
use tauri::{
    plugin::{Builder as PluginBuilder, TauriPlugin},
    Manager, RunEvent, Runtime,
};
use tokio::sync::RwLock;

#[derive(Default)]
pub struct DbInstances(pub RwLock<HashMap<String, DbPool>>);

#[derive(Default)]
pub struct DbTransaction(pub RwLock<Option<SqliteTransaction>>);

#[derive(Serialize)]
#[serde(untagged)]
pub(crate) enum LastInsertId {
    Sqlite(i64),
}

/// Allows blocking on async code without creating a nested runtime.
fn run_async_command<F: std::future::Future>(cmd: F) -> F::Output {
    if tokio::runtime::Handle::try_current().is_ok() {
        tokio::task::block_in_place(|| tokio::runtime::Handle::current().block_on(cmd))
    } else {
        tauri::async_runtime::block_on(cmd)
    }
}

/// Tauri SQL plugin builder.
#[derive(Default)]
pub struct Builder {}

impl Builder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn build<R: Runtime>(self) -> TauriPlugin<R> {
        PluginBuilder::<R>::new("sqlite")
            .invoke_handler(tauri::generate_handler![
                commands::open,
                commands::exec,
                commands::query,
                commands::close,
                commands::tx_begin,
                commands::tx_commit,
                commands::tx_rollback,
                commands::tx_exec,
                commands::tx_query,
            ])
            .setup(|app, _| {
                run_async_command(async move {
                    let instances = DbInstances::default();
                    app.manage(instances);

                    let transactions = DbTransaction::default();
                    app.manage(transactions);
                    Ok(())
                })
            })
            .on_event(|app, event| {
                if let RunEvent::Exit = event {
                    run_async_command(async move {
                        let transaction = &*app.state::<DbTransaction>();
                        let mut ttx = transaction.0.write().await;
                        let tx = ttx.take();

                        match tx {
                            None => (),
                            Some(tx) => {
                                let _ = tx.rollback().await;
                            }
                        }

                        let instances = &*app.state::<DbInstances>();
                        let instances = instances.0.read().await;
                        for value in instances.values() {
                            value.close().await;
                        }
                    });
                }
            })
            .build()
    }
}
