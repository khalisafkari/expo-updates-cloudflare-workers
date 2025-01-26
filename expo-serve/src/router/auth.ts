import { Hono } from 'hono'
import { Env } from '../../utils/env'
import { userTable, userValidTable } from '../../db/schema';
import { and, eq } from 'drizzle-orm';
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod';
import { HashUtils } from '../../utils/hashUtils';
import { ResponseUtils } from '../../utils/ResponseUtils';



const app = new Hono<Env>()

app.get('/', async (c) => {
    return c.text('auth');
});

app.get('/whoami', zValidator('header', z.object({
    'x-server-key': z.string(),
    'x-user-key': z.string(),
})), async (c) => {

    const header = await c.req.valid('header');

    const getUserInfo = await c.var.db.select().from(userValidTable)
    .innerJoin(userTable, eq(userTable.id, userValidTable.userId))
    .where(and(eq(userValidTable.key, header['x-user-key']), eq(userValidTable.status, 'valid')))
    .get();

    if (!getUserInfo) {
        return c.json(ResponseUtils.userIsExpired(), 403);
    }

    if (getUserInfo.user_valid_table.expiredAt && Date.now() > new Date(getUserInfo.user_valid_table.expiredAt).getTime()) {
        await c.var.db.update(userValidTable).set({ status: 'invalid' }).where(eq(userValidTable.id, getUserInfo.user_valid_table.id)).get();
        return c.json(ResponseUtils.userIsExpired(), 403);
    }

    return c.json(ResponseUtils.userIsCreate({
        username: getUserInfo?.user_table.username as string,
        apiKey: getUserInfo?.user_valid_table.key as string,
        expired_at: getUserInfo?.user_valid_table.expiredAt as string,
    }));
})

app.post('/login', zValidator('json', z.object({
    email: z.string(),
    password: z.string(),
})), async (c) => {
    const db = c.var.db;
    const body = await c.req.valid('json');
    const email = body.email;
    const password = body.password;

    const getUserInfo = await db.select()
    .from(userTable)
    .where(eq(userTable.email, email)).limit(1).get();
    
    if (!getUserInfo) {
        return c.json(ResponseUtils.usersIfNotFound(), 404);
    }

    const hash_password = await HashUtils.create256(password);

    if (getUserInfo.password_hash !== hash_password) {
        return c.json(ResponseUtils.usersNotMatchPassword(), 401);
    }

    const createKey = await db.insert(userValidTable).values({
        key: HashUtils.generateKeyId(getUserInfo.username as string),
        userId: getUserInfo.id,
    }).returning().get();

    return c.json(ResponseUtils.userIsCreate({
        apiKey: createKey.key,
        username: getUserInfo.username as string,
        expired_at: createKey.expiredAt,
    }), 200);
});

app.post('/register', zValidator('json', z.object({
    username: z.string(),
    email: z.string(),
    password: z.string(),
})), async (c) => {

    const body = await c.req.valid('json');
    const username = body.username;
    const email = body.email;
    const password = body.password;

    const create = await c.var.db.insert(userTable).values({
        email,
        password_hash: await HashUtils.create256(password),
        username,
    }).returning().get()

    const createKey = await c.var.db.insert(userValidTable).values({
        userId: create.id,
        key: HashUtils.generateKeyId(username),
    }).returning().get()

    return c.json(ResponseUtils.userIsCreate({
        apiKey: createKey.key,
        expired_at: createKey.expiredAt,
        username,
    }), 200)
})

app.delete('/logout', zValidator('header', z.object({
    'x-server-key': z.string(),
    'x-user-key': z.string(),
})), async (c) => {
    const headers = await c.req.valid('header');
    await c.var.db.update(userValidTable).set({ status: 'invalid' }).where(eq(userValidTable.key, headers['x-user-key']));
    return c.json(ResponseUtils.userIfReset(), 200);
})

export default app;