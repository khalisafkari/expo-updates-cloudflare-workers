import { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { Env } from "../utils/env";
import { drizzle } from "drizzle-orm/d1";

export default (): MiddlewareHandler => {
    return createMiddleware<Env>(async (c, next) => {
        const db = drizzle(c.env.DB);
        c.set('db', db);
        await next();
    })
}