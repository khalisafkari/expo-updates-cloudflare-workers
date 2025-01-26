export type Manifest = {
    id: string;
    createdAt: string;
    runtimeVersion: string;
    launchAsset: Asset;
    assets: Asset[];
    metadata: { [key: string]: string };
    extra: { [key: string]: any };
  };
  
export type Asset = {
    hash?: string;
    key: string;
    contentType: string;
    fileExtension?: string;
    url: string;
};