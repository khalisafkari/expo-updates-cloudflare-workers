import { Hono } from 'hono'
import { Env } from '../../utils/env'
import { createApps, createBuildApps, createHeaders, deleteApps } from '../../middleware/validator';
import { appsBlobTable, appsTable, userValidTable } from '../../db/schema';
import { and, eq, One } from 'drizzle-orm';
import { ResponseUtils } from '../../utils/ResponseUtils';
import { HashUtils } from '../../utils/hashUtils';
import prettyBytes from 'pretty-bytes';
import JSZip from 'jszip';

const app = new Hono<Env>();

app.get('/', createHeaders(), async (c) => {

    const headers = await c.req.valid('header');
    const db = c.var.db;

    const getInfoUser = await db.select().from(userValidTable)
    .where(and(eq(userValidTable.key, headers['x-user-key']), eq(userValidTable.status, 'valid')))
    .limit(1).get();


    if (!getInfoUser) {
        return c.json(ResponseUtils.userIsExpired(), 403)
    }

    const getApps = await db.select().from(appsTable)
    .where(eq(appsTable.userId, getInfoUser.userId as number))

    const apps = getApps.map((app) => ({
        name: app.name,
        package: app.package,
        key: app.key,
        time: app.createAt ?? new Date().toISOString()
    }))

    return c.json(ResponseUtils.appsList(apps), 200);
})


app.post('/create', createHeaders(), createApps(), async (c) => {
    const headers = await c.req.valid('header');
    const body = await c.req.valid('json');
    const db = c.var.db;

    const getInfoUser = await db.select().from(userValidTable)
    .where(and(eq(userValidTable.key, headers['x-user-key']), eq(userValidTable.status, 'valid')))
    .limit(1).get();

    if (!getInfoUser) {
        return c.json(ResponseUtils.userIsExpired(), 403)
    }

    const createApp = await db.insert(appsTable).values({
        name: body.name,
        package: body.package,
        key: HashUtils.generateKeyId(),
        userId: getInfoUser.userId,
    }).returning().get();

    return c.json(ResponseUtils.appIfCreate({ ...createApp, time: createApp.createAt ?? new Date().toISOString() }), 200)

})

app.delete('/delete', createHeaders(), deleteApps(), async (c) => {

    const headers = await c.req.valid('header');
    const query = await c.req.valid('query');
    const db = c.var.db;

    const getInfoUser = await db.select().from(userValidTable).where(and(eq(userValidTable.key, headers['x-user-key']), eq(userValidTable.status, 'valid')))
    .limit(1).get();

    if (!getInfoUser) {
        return c.json(ResponseUtils.userIsExpired(), 403)
    }

    const deleteApp = await db.delete(appsTable).where(eq(appsTable.key, query.apps)).limit(1).returning().get();

    return c.json(ResponseUtils.appIfCreate({
        ...deleteApp as typeof appsTable.$inferInsert,
        time: new Date().toISOString(),
    }), 200);
});

app.post('/build', createHeaders(), createBuildApps(), async (c) => {

    const headers = await c.req.valid('header');
    const form = await c.req.valid('form');
    const db = c.var.db;

    const getInfoUser = await db.select().from(userValidTable).where(and(eq(userValidTable.key, headers['x-user-key']), eq(userValidTable.status, 'valid')))
    .limit(1).get();

    if (!getInfoUser) {
        return c.json(ResponseUtils.userIsExpired(), 403)
    }

    const getInfoApps = await db.select().from(appsTable).where(
        and(
            eq(appsTable.key, form.apps),
            eq(appsTable.userId, getInfoUser.userId as number)
        )
    )
    .limit(1).get();

    if (!getInfoApps) {
        return c.json(ResponseUtils.appsNotFound(), 404);
    }

    const createKeyKV = HashUtils.generateKeyId();

    if (form.bundle && form.bundle instanceof File) {
        await c.env.expo_kv_dev.put(createKeyKV, await form.bundle.arrayBuffer());
    }

    if (form.manifest && form.manifest instanceof File) {
        const parse = JSON.parse(new TextDecoder().decode(await form.manifest.arrayBuffer()));
        for (const platform of Object.keys(parse.assetRequestHeaders)) {
            for (const key of Object.keys(parse.assetRequestHeaders[platform])) {
                parse.assetRequestHeaders[platform][key]['x-kv-id'] = createKeyKV;
            }
        }

        try {
            await db.insert(appsBlobTable).values({
                kvId: createKeyKV,
                manifest: parse,
                appId: getInfoApps.id,
                userId: getInfoUser.userId,
                download: 0,
                type: 'normal',
            });
            return c.json(ResponseUtils.appIfCreate({
                key: 'success',
                name: getInfoApps.name,
                package: getInfoApps.package,
                time: new Date().toISOString()
            }), 201)
        } catch (err) {
            return c.json(ResponseUtils.appsNotFound(), 404);
        }
    }

    return c.json(ResponseUtils.Forbidden(), 403);
});


export default app;