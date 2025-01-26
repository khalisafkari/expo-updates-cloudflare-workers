import { sql } from 'drizzle-orm';
import { blob, int, sqliteTable, text } from 'drizzle-orm/sqlite-core';


export const userTable = sqliteTable('user_table', {
    id: int().primaryKey({ autoIncrement: true }),
    username: text(),
    email: text().unique().notNull(),
    password_hash: text().notNull(),
    createAt: text('create_at').default(sql`(current_timestamp)`),
    updateAt: text('update_at').default(sql`(current_timestamp)`).$onUpdateFn(() => sql`(current_timestamp)`)
});

export const userValidTable = sqliteTable('user_valid_table', {
    id: int().primaryKey({ autoIncrement: true }),
    key: text().unique().notNull(),
    userId: int('user_id').references(() => userTable.id),
    status: text({ enum: ['valid', 'invalid'] }).default('valid'),
    expiredAt: text('expired_at').default(sql`(datetime(current_timestamp, '+30 days', 'localtime'))`),
    createdAt: text().default(sql`(current_timestamp)`),
});

export const appsTable = sqliteTable('apps_table', {
    id: int().primaryKey({ autoIncrement: true }),
    name: text().notNull(),
    package: text().notNull(),
    userId: int().references(() => userTable.id),
    key: text().notNull(),
    createAt: text().default(sql`(current_timestamp)`),
    updateAt: text().default(sql`(current_timestamp)`).$onUpdateFn(() => sql`(current_timestamp)`)
});

export const appsBlobTable = sqliteTable('apps_blob_table', {
    id: int().primaryKey({ autoIncrement: true }),
    userId: int().references(() => userTable.id),
    appId: int().references(() => appsTable.id),
    manifest: text({ mode: 'json' }),
    kvId: text(),
    download: int().default(0),
    type: text({ enum: ['normal', 'rollback'] }).default('normal'),
    createAt: text().default(sql`(current_timestamp)`),
    updateAt: text().default(sql`(current_timestamp)`).$onUpdateFn(() => sql`(current_timestamp)`)
});
