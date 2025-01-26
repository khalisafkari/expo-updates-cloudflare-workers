import { getContext } from "hono/context-storage";
import { Env } from "../utils/env";

interface ValueKey {
    name: string;
    metadata: {
        id: string;
        createAt: string;
        ext: string;
        mime: string;
    }
}

class Runtime {

    private content: ValueKey[] | undefined;
    private cacheBuffer: {[key: string]: ArrayBuffer} = {};

    private get kv() {
        return getContext<Env>().env.expo_kv_dev
    }

    async all() {
        try {
            if (this.content && this.content.length > 1) {
                return this.content
            }
            const keys = await this.kv.list();
            this.content = keys.keys as ValueKey[];
            return this.content;
        } catch (err) {
            throw new Error(`[Runtime]: all() ${err}`);
        }
    }

    async getLast(): Promise<ValueKey> {
        try {
            if (this.content && this.content.length > 1) {
                return this.content.filter(this.truthy).sort(this.toLastSort)[0]
            }
            const all = await this.all()
            return all.filter(this.truthy).sort(this.toLastSort)[0];
        } catch (err) {
            throw new Error('[Runtime]: getLast() ' + err)
        }
    }

    async get(key: string): Promise<ArrayBuffer> {
        try {
            if (this.cacheBuffer[key]) {
                return this.cacheBuffer[key];
            }
            const value = await this.kv.get(key, 'arrayBuffer');
            this.cacheBuffer[key] = value!!
            return value!!
        } catch (err) {
            throw new Error('[Runtime]: get() ' + err)
        }
    }

    private toLastSort(a: ValueKey, b: ValueKey) {
        return new Date(b.metadata.createAt).getTime() - new Date(a.metadata.createAt).getTime()
    }

    private truthy<TValue>(value: TValue | null | undefined): value is TValue {
        return !!value;
    }



    async createHash(data: any, hashingAlgorithm: string = 'SHA-256', encoding: 'base64' | 'hex' = 'hex') {

        const encoder = new TextEncoder();
        const inputData = data instanceof ArrayBuffer ? data : encoder.encode(data);

        const hashBuffer = await crypto.subtle.digest(hashingAlgorithm, inputData)

        if (encoding === 'base64') {
            return btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
        } else if (encoding === 'hex') {
            return Array.from(new Uint8Array(hashBuffer))
            .map(byte => byte.toString(16).padStart(2, '0'))
            .join('');
        } else {
            throw new Error(`Encoding ${encoding} is not supported.`);
        }
    }

    getBase64URLEncoding(base64EncodedString: string) {
        return base64EncodedString
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
    }
}

export default Runtime;