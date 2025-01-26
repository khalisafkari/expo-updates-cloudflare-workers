import { drizzle, DrizzleD1Database } from "drizzle-orm/d1";
import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { Env } from "../utils/env";
import { createStorage } from "unstorage";
import cloudflareKVBindingDriver from "unstorage/drivers/cloudflare-kv-binding";

const DBInit = (): MiddlewareHandler => createMiddleware<Env>(async (c, next) => {
    c.set('db', drizzle(c.env.DB));
    c.set('kv', createStorage({
        driver: cloudflareKVBindingDriver({ binding: c.env.expo_kv_dev })
    }))
    await next();
})

export default DBInit;