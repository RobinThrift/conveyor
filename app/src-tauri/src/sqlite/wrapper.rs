// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

use indexmap::IndexMap;
use serde_json::Value as JsonValue;
use sqlx::query::Query;
use sqlx::sqlite::{SqliteArguments, SqliteConnectOptions, SqliteJournalMode};
use sqlx::{Acquire, Column, Executor, Pool, Row, Sqlite, Transaction};
use std::collections::HashMap;
use std::fs::create_dir_all;
use std::str::FromStr;
use std::time::Duration;
use tauri::Manager;
use tauri::{AppHandle, Runtime};

use crate::sqlite::LastInsertId;

pub type SqliteTransaction = Transaction<'static, Sqlite>;

pub struct DbPool {
    pool: Pool<Sqlite>,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct SqliteOptions {
    pub pragmas: HashMap<String, String>,
    pub jounal_mode: Option<String>,
    pub foreign_keys: Option<bool>,
    pub busy_timeout: Option<u64>,
}

impl DbPool {
    pub(crate) async fn connect<R: Runtime>(
        filename: &str,
        app: &AppHandle<R>,
        options: Option<SqliteOptions>,
    ) -> Result<Self, crate::sqlite::Error> {
        let app_path = app
            .path()
            .app_config_dir()
            .expect("No App config path was found!");

        create_dir_all(&app_path).expect("Couldn't create app config dir");

        let filepath = &path_mapper(app_path, filename);

        let mut sqlite_options = SqliteConnectOptions::new()
            .filename(filepath)
            .create_if_missing(true);

        if let Some(conn_opts) = options {
            if let Some(jounal_mode) = conn_opts.jounal_mode {
                sqlite_options =
                    sqlite_options.journal_mode(SqliteJournalMode::from_str(jounal_mode.as_str())?);
            }

            if let Some(foreign_keys) = conn_opts.foreign_keys {
                sqlite_options = sqlite_options.foreign_keys(foreign_keys);
            }

            if let Some(busy_timeout) = conn_opts.busy_timeout {
                sqlite_options = sqlite_options.busy_timeout(Duration::from_millis(busy_timeout));
            }

            for (pragma_name, pragma_value) in conn_opts.pragmas {
                sqlite_options = sqlite_options.pragma(pragma_name, pragma_value);
            }
        }

        Ok(DbPool {
            pool: Pool::connect_with(sqlite_options).await?,
        })
    }

    pub(crate) async fn close(&self) {
        self.pool.close().await
    }

    pub(crate) async fn exec(
        &self,
        sql: String,
        values: Vec<JsonValue>,
        tx: Option<&mut SqliteTransaction>,
    ) -> Result<(u64, LastInsertId), crate::sqlite::Error> {
        let query = bind_args(&sql, values);

        let result = match tx {
            Some(tx) => {
                let conn = tx.acquire().await?;
                query.execute(conn).await?
            }
            None => self.pool.execute(query).await?,
        };

        Ok((
            result.rows_affected(),
            LastInsertId::Sqlite(result.last_insert_rowid()),
        ))
    }

    pub(crate) async fn query(
        &self,
        sql: String,
        values: Vec<JsonValue>,
        tx: Option<&mut SqliteTransaction>,
    ) -> Result<Vec<IndexMap<String, JsonValue>>, crate::sqlite::Error> {
        let query = bind_args(&sql, values);

        let rows = match tx {
            Some(tx) => {
                let conn = tx.acquire().await?;
                query.fetch_all(conn).await?
            }
            None => self.pool.fetch_all(query).await?,
        };

        let mut values = Vec::new();
        for row in rows {
            let mut value = IndexMap::default();
            for (i, column) in row.columns().iter().enumerate() {
                let v = row.try_get_raw(i)?;

                let v = crate::sqlite::decode::to_json(v)?;

                value.insert(column.name().to_string(), v);
            }

            values.push(value);
        }
        Ok(values)
    }

    pub(crate) async fn begin(&self) -> Result<Transaction<'static, Sqlite>, sqlx::Error> {
        self.pool.begin().await
    }
}

fn bind_args(sql: &str, values: Vec<JsonValue>) -> Query<'_, Sqlite, SqliteArguments<'_>> {
    let mut query = sqlx::query(sql);
    for value in values {
        if value.is_null() {
            query = query.bind(None::<JsonValue>);
        } else if value.is_boolean() {
            query = query.bind(value.as_bool().unwrap())
        } else if value.is_string() {
            query = query.bind(value.as_str().unwrap().to_owned())
        } else if let Some(number) = value.as_number() {
            query = query.bind(number.as_f64().unwrap_or_default())
        } else if let Some(arr) = value.as_array() {
            query = query.bind(
                arr.into_iter()
                    .map(|v| v.as_u64().unwrap_or_default() as u8)
                    .collect::<Vec<_>>(),
            )
        } else {
            query = query.bind(value);
        }
    }

    query
}

/// Maps the user supplied DB connection string to a connection string
/// with a fully qualified file path to the App's designed "app_path"
fn path_mapper(mut app_path: std::path::PathBuf, filepath: &str) -> String {
    app_path.push(filepath);

    app_path
        .to_str()
        .expect("Problem creating fully qualified path to Database file!")
        .to_owned()
}
