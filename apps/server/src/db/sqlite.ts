// ─────────────────────────────────────────────
// apps/server/src/db/sqlite.ts — better-sqlite3 本地存储
//
// TODO(phase-2): 创建表：pet_configs, work_sessions, mobile_signals, health_snapshots。
// TODO(phase-2): 实现基础 CRUD helper（insertSignalBatch、getLatestSnapshot 等）。
// TODO(phase-2): 配置保留策略（默认 30 天，超期自动清除）。
// TODO(phase-2): 数据库文件路径从环境变量 DB_PATH 读取，默认 ~/.health-buddy/data.db。
// ─────────────────────────────────────────────

// TODO(phase-2): import Database from 'better-sqlite3';

export type DbInstance = unknown; // TODO(phase-2): 替换为 Database.Database

let _db: DbInstance | null = null;

/** 初始化或返回已有 SQLite 连接。 */
export function getDb(): DbInstance {
  if (_db) return _db;
  // TODO(phase-2): 实现连接初始化与建表
  throw new Error('TODO(phase-2): DB not initialized. Call initDb() first.');
}

/** 在服务启动时调用一次，完成建表与迁移。 */
export function initDb(_dbPath?: string): void {
  // TODO(phase-2): new Database(dbPath ?? defaultPath) + CREATE TABLE IF NOT EXISTS ...
}
