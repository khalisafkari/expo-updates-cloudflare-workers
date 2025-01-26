// import { Hono } from 'hono'
// import * as JSZip from 'jszip';
// import { Env } from '../utils/env';
// import DBInit from '../middleware/DBInit';
// import { blobTable } from '../db/schema';
// import {fileTypeFromBuffer, fileTypeFromStream} from 'file-type';
// import { generateKeyId } from '../utils/generateKey';
// import { convertHashToUUID } from '../utils/convertHashToUUID';
// import demoHeaders from '../utils/demoHeaders';
// import UpdateRuntime, { UpdateRuntimeType } from '../services/UpdateRuntime';
// import Runtime from '../services/Runtime';
// import { contextStorage } from 'hono/context-storage';

// const app = new Hono<Env>();

// app.use(async (c, next) => {  
//   await next();
// })

// app.use(DBInit())
// app.use(contextStorage())

// const runtime = new Runtime();


// app.get('/', async (c) => {

//     const keys = (await c.env.expo_kv_dev.list()).keys;
//     const lastUpdate = keys.filter((value) => !!value).sort((a: any, b: any) => {
//         return new Date(b.metadata.createAt).getTime() - new Date(a.metadata.createAt).getTime()
//     })

//     const body = await c.env.expo_kv_dev.get(lastUpdate[0].name, 'arrayBuffer');

//     if (body) {
//         const zip = await JSZip.loadAsync(body);
//         const zipEntryPoint = [];
//         for (const zipEntry of Object.values(zip.files)) {
//             if (!zipEntry.dir && zipEntry.name.endsWith('.json')) {
//                 zipEntryPoint.push({ name: zipEntry.name, content: JSON.parse(new TextDecoder().decode(await zipEntry.async('arraybuffer'))) })
//             }
//         }

//         return c.json(zipEntryPoint)

//     }
//     return c.text('404');
// })

// app.get('/manifest', async (c) => {

//     const updateRuntime = new UpdateRuntime(new Runtime());

//     const protocolVersionMaybeArray = c.req.header('expo-protocol-version') ?? demoHeaders['expo-protocol-version'];
//     const protocolVersion = parseInt(protocolVersionMaybeArray ?? '0', 10);

//     const platform = (c.req.header('expo-platform') ?? c.req.query('platform')) ?? demoHeaders['expo-platform'];
//     const runtimeVersion = (c.req.header('expo-runtime-version') ?? c.req.query('runtime-version')) ?? demoHeaders['expo-runtime-version'];

//     const currentUpdateId = c.req.header('expo-current-update-id') ?? demoHeaders['expo-current-update-id']

//     let updateBundlePath;

//     try {
//         updateBundlePath = await updateRuntime.getLatestUpdateBundlePathForRuntimeVersionAsync(runtimeVersion);
//     } catch (err: any) {
//         return c.json({ error: err.message }, 400);    
//     }

//     if (!updateBundlePath) {
//         return c.json({ error: "Bundle not availabel" }, 400);
//     }

//     const updateType = await updateRuntime.getTypeOfUpdateAsync(updateBundlePath);

//     try {
//         if (updateType === UpdateRuntimeType.NORMAL_UPDATE) {
//             const response = await updateRuntime.putUpdateInResponseAsync(
//                 currentUpdateId,
//                 updateBundlePath,
//                 runtimeVersion,
//                 platform,
//                 protocolVersion,
//             )
//         }
//     } catch (err) {

//     }

//     //const runtimeVersion = req.headers['expo-runtime-version'] ?? req.query['runtime-version'];
//     //const platform = req.headers['expo-platform'] ?? req.query['platform'];

//     return c.text('done');
// })

// app.post('/upload', async (c) => {
//     const keys = (await c.env.expo_kv_dev.list()).keys;

//     const body = await c.req.arrayBuffer();
//     // const text = new TextDecoder().decode(body);

//     // const zipEntryPoint = [];

//     // for (const zipEntry of Object.values(zip.files)) {
//     //     if (!zipEntry.dir) {
//     //         const blob = await zipEntry.async('uint8array');
//     //         zipEntryPoint.push({
//     //             path: zipEntry.name,
//     //             date: zipEntry.date,
//     //             blob,
//     //         });
//     //     }
//     // }

//     // const keyId = generateKeyId();
//     // await c.env.expo_kv_dev.put(keyId, body, {
//     //     metadata: {
//     //         id: keyId,
//     //         createAt: new Date().toISOString(),
//     //         ...(await fileTypeFromBuffer(body))
//     //     }
//     // })

//     return c.text('success', 200);
// })

// // app.get('/', async (c) => {
// //     // const data = await fetch('http://localhost:3000/api/manifest', {
// //     //     headers: c.req.header()
// //     // });

// //     console.log(c.req.url);
    
// //     const data = await fetch('http://localhost:3000/api/manifest', {
// //         headers: c.req.header()
// //     });

// //     return c.body(await data.arrayBuffer())
// // })

// // app.get('/', async (c) => {

// //     const protocol = c.req.header('expo-protocol-version');
// //     if (protocol && Array.isArray(protocol)) {
// //         return c.json({ error: 'Unsupported protocol version. Expected either 0 or 1.', }, 400);
// //     }

// //     const protocolVersion = parseInt(protocol ?? '0', 10);

// //     const platform = c.req.header('expo-platform') ?? c.req.query('platform');
// //     if (platform !== 'ios' && platform !== 'android') {
// //         return c.json({ error: 'Unsupported platform. Expected either ios or android.', }, 400);
// //     }

// //     const runtimeVersion = c.req.header('expo-runtime-version') ?? c.req.query('runtime-version');
// //     if (!runtimeVersion || typeof runtimeVersion !== 'string') {
// //         return c.json({ error: 'No runtimeVersion provided.', }, 400);
// //     }

// //     let updateBundlePath: string;

    

// //     return c.json({ error: 'GET' })
// // })

// // app.get('/', (c) => {
// //   return c.text('Hello Hono!')
// // });

// export default app


import { Hono } from 'hono';
import { Env } from '../utils/env';
import Database from '../middleware/Database';
import { cors } from 'hono/cors';

import auth from './router/auth';
import apps from './router/apps'

const app = new Hono<Env>();
app.use(Database());
app.use(cors());

app.get('/api/manifest', async (c) => {
    const getApps = await fetch('http://localhost:3001/api/manifest', {
        headers: c.req.header()
    })
    console.log(new TextDecoder().decode(await getApps.arrayBuffer()));
    return c.text('done');
})

app.route('/auth', auth);
app.route('/apps', apps);


export default app;