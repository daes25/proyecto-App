import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('app.db');

export const initDB = () => {
    db.transaction(tx => {
        tx.executeSql(
            'CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, username TEXT NOT NULL, password TEXT NOT NULL);'
        );
    });
};

export default db;
