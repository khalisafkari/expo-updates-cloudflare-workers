import { DrizzleD1Database } from "drizzle-orm/d1";
import {
    type Storage,
    type StorageValue,
} from 'unstorage'

export interface Bindings {
    DB: D1Database
    expo_kv_dev: KVNamespace;
}

export interface Variables {
    db: DrizzleD1Database;
    kv: Storage<StorageValue>
}

export interface Env {
    Bindings: Bindings
    Variables: Variables;
}