import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import config from "../config.js";

import BetterSqlite3 from "better-sqlite3";
import { initializeDatabase } from "./schema.js";

const dir = path.dirname(config.dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db: BetterSqlite3.Database = new Database(config.dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

initializeDatabase(db);

export default db;
