import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('records', { id:text('id').primaryKey(), owner:text('owner').notNull(), kind:text('kind').notNull(), data:text('data').notNull(), created:integer('created').notNull() });
export const events = sqliteTable('events', { id:text('id').primaryKey(), owner:text('owner').notNull(), record:text('record').notNull(), action:text('action').notNull(), created:integer('created').notNull() });
