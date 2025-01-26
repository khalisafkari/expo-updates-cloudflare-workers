import { BiddingAppError, type Bidding, type Headers, type Payload } from "./Bidding";
import fs from 'fs/promises'
import { getConfig } from '@expo/config';
import Hash from "../utils/Hash";
import {fileTypeFromBuffer} from 'file-type';
import { DBUtils } from "../utils/dbUtils";
import { generateKeyId } from "../utils/generateKeyId";
import { compressFile } from "../utils/compressFile";
import { Log } from "../utils/Log";

type buildOfPlatform = {
    dir: string;
    platform: 'ios' | 'android' | 'all'
    outDir: string;
    force: boolean;
    key: string;
}

type putAssetInfo = {
    dir: string;
    asset: string;
    platform: string;
    runtimeVersion: string;
    isLaunchAsset: boolean;
}

class Build {
    bidding: Bidding;

    constructor(bidding: Bidding) {
        this.bidding = bidding;
    }

    async generateBuild(platform: buildOfPlatform) {

        const keyId = generateKeyId();
        const optional = await this.getUser();
        const outDist = platform.dir + '/dist';

        const { exp } = getConfig(platform.dir, {
            skipSDKVersionRequirement: true,
            isPublicConfig: true,
        });

        if ((await fs.exists(outDist))) {
            await fs.rm(outDist, { force: true, recursive: true });
            console.log('delete old build')
        }

        try {
            await Bun.$`bunx expo export ${platform.dir} -p ${platform.platform} --output-dir ./dist`;
        } catch (error: any) {
            throw new BiddingAppError(error.message);
        }

        const metajson = await Bun.file(outDist + '/metadata.json');
        
        if (!(await metajson.exists())) {
            throw new BiddingAppError("not valid", 404, '', JSON.stringify({ errors: { message: 'metajson.json missing' } }));
        }

        const buffer = await metajson.arrayBuffer();
        const metadataJson = await metajson.json();
        const id = Hash.sha256HashToUUID(await Hash.createHash(buffer));
        const createdAt = new Date(metajson.lastModified).toISOString();

        let rawAsset: {[key: string]: any[]} = {}

        for (const key of Object.keys(metadataJson.fileMetadata)) {
            if (!rawAsset[key]) {
                const metaAssets = metadataJson.fileMetadata[key].assets.map( async (asset: any) => {
                    const getAsset = await this.getAsset({ dir: outDist, asset: asset.path, isLaunchAsset: false, platform: key, runtimeVersion: exp.runtimeVersion as string });
                    const headers = { [getAsset.key]: {
                        'x-server-key': process.env.BACKEND_KEY,
                        'x-app-key': platform.key,
                        'x-user-key': optional?.key
                    }}
                    return {
                        ...getAsset,
                        headers,
                    }
                })
                const bundleAsset = await this.getAsset({
                    dir: outDist,
                    asset: metadataJson.fileMetadata[key].bundle,
                    isLaunchAsset: true,
                    platform: key,
                    runtimeVersion: exp.runtimeVersion as string
                });

                const buildBundle = {
                    ...bundleAsset,
                    headers: { [bundleAsset.key]: {
                        'x-server-key': process.env.BACKEND_KEY,
                        'x-app-key': platform.key,
                        'x-user-key': optional?.key
                    }}, 
                }
                
                rawAsset[(key as string)] = [
                    buildBundle,
                    ...(await Promise.all(metaAssets))
                ]
            }
        }


        let assets: {[key: string]: any[]} = {};
        let assetRequestHeaders: {[key: string]: {[key: string]: object}} = {};
        let launchAsset: {[key: string]: object} = {}

        for (const asset of Object.keys(rawAsset)) {
            if (!assets[asset] && !assetRequestHeaders[asset] && !launchAsset[asset]) {
                let headers = {}
                for (let plat of rawAsset[asset]) {
                   headers = {...headers, ...plat.headers}
                   delete plat.headers;
                   if (plat.contentType.includes('application/javascript')) {
                        launchAsset[asset] = plat;
                   } else {
                        if (!assets[asset]) {
                            assets[asset] = [plat];
                        } else {
                            assets[asset].push(plat);
                        }
                   }
                }
                assetRequestHeaders[asset] = headers;
            }
        } 

        const manifest = {
            id,
            createdAt,
            runtimeVersion: exp.runtimeVersion,
            metadata: {},
            extra: { expoConfig: exp },
            assets,
            launchAsset,
            assetRequestHeaders,
        }

        await Bun.write(outDist + '/expoConfig.json', JSON.stringify(exp))
        const manifestOfFile = await Bun.file(`${platform.outDir}/${keyId}.json`);
        manifestOfFile.write(JSON.stringify(manifest));

        let bundlePath;

        try {
            bundlePath = await compressFile(outDist, platform.outDir);
        } catch (err) {
        }

        const apiPath = '/apps/build';
        const payload: Payload = {
           'manifest': manifestOfFile,
           'bundle': Bun.file(bundlePath as string),
           'apps': platform.key,
        };
        const uri = this.bidding.getURL(apiPath);
        const apiHeaders: Headers = {
            'content-type': 'multipart/form-data',
            'x-user-key': optional?.key,
        }

        try {
            return await this.bidding.call('post', uri, apiHeaders, payload)
        } catch (err) {
            if (err instanceof BiddingAppError) {
                Log.LogError(err)
            }
        } finally {
            if (platform.force) {
                if ((await fs.exists(outDist))) {
                    await fs.rm(outDist, { force: true, recursive: true });
                }

                if ((await fs.exists(bundlePath))) {
                    await fs.rm(bundlePath as string, { force: true, recursive: true }); 
                }

                if ((await fs.exists(`${platform.outDir}/${keyId}.json`))) {
                    await fs.rm(`${platform.outDir}/${keyId}.json`, { force: true, recursive: true });
                }
            }
        }

    }

    private async getAsset(arg: putAssetInfo) {
        const file = await Bun.file(arg.dir + '/' + arg.asset);
        const buffer = await file.arrayBuffer();
        const hash = Hash.base64URLEncoding(await Hash.createHash(buffer, 'base64'));
        const key = await Hash.createHash(buffer);

        let contentType;
        let fileExtension;

        if (arg.isLaunchAsset) {
            contentType = 'application/javascript'
            fileExtension = '.bundle';
        } else {
            const fileType = await fileTypeFromBuffer(buffer);
            fileExtension = '.' + fileType?.ext;
            contentType = fileType?.mime;
        }

        const uri = new URL(process.env.BACKEND_URL as string + '/api/assets');
        uri.searchParams.append('asset', arg.asset);
        uri.searchParams.append('runtimeVersion', arg.runtimeVersion);
        uri.searchParams.append('platform', arg.platform)

        return {
            key,
            hash,
            contentType,
            fileExtension,
            url: uri.toString()
        }
    }

    private async getUser() {
        return await DBUtils.getUser();
    }
}

export default Build;