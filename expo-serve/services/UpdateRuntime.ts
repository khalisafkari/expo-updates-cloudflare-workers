import JSZip from "jszip";
import Runtime from "./Runtime";
import { convertHashToUUID } from "../utils/convertHashToUUID";
import mime from 'mime';

export class NoUpdateAvailableError extends Error {}

type GetAssetMetadataArg =
  | {
      updateBundlePath: string;
      filePath: string;
      ext: null;
      isLaunchAsset: true;
      runtimeVersion: string;
      platform: string;
    }
  | {
      updateBundlePath: string;
      filePath: string;
      ext: string;
      isLaunchAsset: false;
      runtimeVersion: string;
      platform: string;
};

export enum UpdateRuntimeType {
    NORMAL_UPDATE,
    ROLLBACK,
}

class UpdateRuntime {

    runtime: Runtime;

    constructor(runtime: Runtime) { 
        this.runtime = runtime;
    }

    async getLatestUpdateBundlePathForRuntimeVersionAsync(runtimeVersion: string) {
        const getLast = await this.runtime.getLast(); 
        const get = await this.runtime.get(getLast.name);
        const zip = await JSZip.loadAsync(get);
        
        for (const zipEntry of Object.values(zip.files)) {
            if (!zipEntry.dir && zipEntry.name.includes('expoConfig.json')) {
                const buffer = await zipEntry.async('arraybuffer');
                const decode = JSON.parse(new TextDecoder().decode(buffer));
                if (decode.runtimeVersion === runtimeVersion) {
                    return getLast.name;
                }
            }
        }
        throw new Error('Unsupported runtime version');
    }

    async getTypeOfUpdateAsync(updateBundlePath: string) {
        const bundleContents = await this.runtime.get(updateBundlePath)
        const archiver = await this.archiver(bundleContents);

        if (archiver.find((elemenet) => elemenet.name.includes('rollback'))) {
            return UpdateRuntimeType.ROLLBACK
        } else {
            return UpdateRuntimeType.NORMAL_UPDATE;
        }
    }

    async putUpdateInResponseAsync(
        currentUpdateId: string,
        updateBundlePath: string,
        runtimeVersion: string,
        platform: string,
        protocolVersion: number
    ) {

        const { createdAt, id, metadataJson } = await this.getMetadataAsync(
            updateBundlePath,
            runtimeVersion,
        )

        if (currentUpdateId === convertHashToUUID(id) && protocolVersion === 1) {
            throw new NoUpdateAvailableError();
        }

        const expoConfig = await this.getExpoConfigAsync(
            updateBundlePath,
            runtimeVersion,
        )

        const platformSpecificMetadata = metadataJson.fileMetadata[platform];
        const manifest = {
            id: convertHashToUUID(id),
            createdAt,
            runtimeVersion,
            assets: [],
            launchAsset: await this.getAssetMetadataAsync({
                updateBundlePath,
                filePath: platformSpecificMetadata.bundle,
                isLaunchAsset: true,
                runtimeVersion,
                platform,
                ext: null,
            })
        }

        console.log(manifest);
    }

    async getExpoConfigAsync(
        updateBundlePath: string,
        runtimeVersion: string,
    ) {
        try {
            const bundleContents = await this.runtime.get(updateBundlePath);
            const expoConfigPath = await this.archiver(bundleContents);
            const expoConfigBuffer = expoConfigPath.findLast((metadata) => metadata.name.includes('expoConfig.json'))
            const expoConfigJson = JSON.parse(new TextDecoder().decode(await expoConfigBuffer?.async('arraybuffer')))
            return expoConfigJson;
            // const bundleContents = await this.runtime.get(updateBundlePath)
            // const expoConfigPath = await this.runtime.get(updateBundlePath);
            // const metadataPath = await this.archiver(bundleContents);
            // const updateMetada = metadataPath.findLast((metadata) => metadata.name.includes('metadata.json'))

        } catch (error) {
            throw new Error(
                `No expo config json found with runtime version: ${runtimeVersion}. Error: ${error}`
            );
        }
    }

    async getMetadataAsync(
        updateBundlePath: string,
        runtimeVersion: string,
    ) {
        try {
            const bundleContents = await this.runtime.get(updateBundlePath)
            const metadataPath = await this.archiver(bundleContents);
            const updateMetada = metadataPath.findLast((metadata) => metadata.name.includes('metadata.json'))
            const updateMetadaBuffer = await updateMetada?.async('arraybuffer')
            const metadataJson = JSON.parse(new TextDecoder().decode(updateMetadaBuffer))
            return {
                metadataJson,
                createdAt: new Date(updateMetada?.date ?? new Date()).toISOString(),
                id: await this.runtime.createHash(updateBundlePath, 'SHA-256', 'hex')
            }
        } catch (error) {
            throw new Error(`No update found with runtime version: ${runtimeVersion}. Error: ${error}`);
        }
    }

    async getAssetMetadataAsync(arg: GetAssetMetadataArg) {
        const bundleContents = await this.runtime.get(arg.updateBundlePath);
        const assetFilePath = await this.archiver(bundleContents);
        const assets = assetFilePath.findLast((metadata) => metadata.name.includes(arg.filePath));
        const assetHash = this.runtime.getBase64URLEncoding(
            await this.runtime.createHash(await assets?.async('arraybuffer'), 'SHA-256',  'base64'));

        const key = await this.runtime.createHash(await assets?.async('arraybuffer'), 'md5', 'hex');
        const keyExtensionSuffix = arg.isLaunchAsset ? 'bundle' : arg.ext;   
        const contentType = arg.isLaunchAsset ? 'application/javascript' : mime.getType(arg.ext);
        
        const buildAssetPath = `${arg.updateBundlePath}/${assets?.name}`

        return {
            hash: assetHash,
            key,
            fileExtension: `.${keyExtensionSuffix}`,
            contentType,
            url: `${process.env.HOSTNAME}/api/assets?asset=${buildAssetPath}&runtimeVersion=${arg.runtimeVersion}&platform=${arg.platform}`,
        }

    }

    async archiver(buffer: ArrayBuffer) {
        const zip = await JSZip.loadAsync(buffer);
        const putEntry = []
        for (let zipEntry of Object.values(zip.files)) {
            if (!zipEntry.dir) {
                putEntry.push(zipEntry);
            }
        }
        return putEntry;
    }
}

export default UpdateRuntime;