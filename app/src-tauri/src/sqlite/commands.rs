// Copyright 2019-2023 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

use indexmap::IndexMap;
use serde_json::Value as JsonValue;
use tauri::{command, AppHandle, Runtime, State};

use crate::sqlite::{DbInstances, DbPool, Error, LastInsertId, SqliteOptions};

use super::DbTransaction;

#[command]
pub(crate) async fn open<R: Runtime>(
    app: AppHandle<R>,
    db_instances: State<'_, DbInstances>,
    db: String,
    options: Option<SqliteOptions>,
) -> Result<String, crate::sqlite::Error> {
    let pool = DbPool::connect(&db, &app, options).await?;

    db_instances.0.write().await.insert(db.clone(), pool);

    Ok(db)
}

/// Allows the database connection(s) to be closed; if no database
/// name is passed in then _all_ database connection pools will be
/// shut down.
#[command]
pub(crate) async fn close(
    db_instances: State<'_, DbInstances>,
    db: Option<String>,
) -> Result<bool, crate::sqlite::Error> {
    let instances = db_instances.0.read().await;

    let pools = if let Some(db) = db {
        vec![db]
    } else {
        instances.keys().cloned().collect()
    };

    for pool in pools {
        let db = instances.get(&pool).ok_or(Error::DatabaseNotLoaded(pool))?;
        db.close().await;
    }

    Ok(true)
}

/// Execute a command against the database
#[command]
pub(crate) async fn exec(
    db_instances: State<'_, DbInstances>,
    db: String,
    sql: String,
    values: Vec<JsonValue>,
) -> Result<(u64, LastInsertId), crate::sqlite::Error> {
    let instances = db_instances.0.read().await;

    let db = instances.get(&db).ok_or(Error::DatabaseNotLoaded(db))?;
    db.exec(sql, values, None).await
}

#[command]
pub(crate) async fn query(
    db_instances: State<'_, DbInstances>,
    db: String,
    sql: String,
    values: Vec<JsonValue>,
) -> Result<Vec<IndexMap<String, JsonValue>>, crate::sqlite::Error> {
    let instances = db_instances.0.read().await;

    let db = instances.get(&db).ok_or(Error::DatabaseNotLoaded(db))?;
    db.query(sql, values, None).await
}

#[tauri::command]
pub async fn tx_begin(
    db_instances: State<'_, DbInstances>,
    db_transaction: State<'_, DbTransaction>,
    db: String,
) -> Result<(), Error> {
    let instances = db_instances.0.read().await;
    let db = instances.get(&db).ok_or(Error::DatabaseNotLoaded(db))?;

    let mut transaction = db_transaction.0.write().await;
    match *transaction {
        Some(_) => Err(Error::TooManyOpenTransactions()),
        None => {
            let tx = db.begin().await?;
            *transaction = Some(tx);
            Ok(())
        }
    }
}

#[tauri::command]
pub async fn tx_exec(
    db_instances: State<'_, DbInstances>,
    db: String,
    db_transaction: State<'_, DbTransaction>,
    sql: String,
    values: Vec<JsonValue>,
) -> Result<(u64, LastInsertId), crate::sqlite::Error> {
    let instances = db_instances.0.read().await;
    let db = instances.get(&db).ok_or(Error::DatabaseNotLoaded(db))?;

    let mut transaction = db_transaction.0.write().await;
    let tx = transaction.as_mut();

    match tx {
        None => Err(Error::NoRunningTransaction()),
        Some(mut tx) => db.exec(sql, values, Some(&mut tx)).await,
    }
}

#[tauri::command]
pub async fn tx_query(
    db_instances: State<'_, DbInstances>,
    db: String,
    db_transaction: State<'_, DbTransaction>,
    sql: String,
    values: Vec<JsonValue>,
) -> Result<Vec<IndexMap<String, JsonValue>>, Error> {
    let instances = db_instances.0.read().await;
    let db = instances.get(&db).ok_or(Error::DatabaseNotLoaded(db))?;

    let mut transaction = db_transaction.0.write().await;
    let tx = transaction.as_mut();

    match tx {
        None => Err(Error::NoRunningTransaction()),
        Some(mut tx) => db.query(sql, values, Some(&mut tx)).await,
    }
}

#[tauri::command]
pub async fn tx_commit(db_transaction: State<'_, DbTransaction>) -> Result<(), Error> {
    let mut transaction = db_transaction.0.write().await;
    let tx = transaction.take();

    match tx {
        None => Err(Error::NoRunningTransaction()),
        Some(tx) => {
            tx.commit().await?;
            *transaction = None;
            Ok(())
        }
    }
}

#[tauri::command]
pub async fn tx_rollback(db_transaction: State<'_, DbTransaction>) -> Result<(), Error> {
    let mut transaction = db_transaction.0.write().await;
    let tx = transaction.take();

    match tx {
        None => Err(Error::NoRunningTransaction()),
        Some(tx) => {
            tx.rollback().await?;
            *transaction = None;
            Ok(())
        }
    }
}
