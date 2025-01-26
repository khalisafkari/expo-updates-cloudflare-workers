export class HashUtils {
    static async create256(value: string) {
        const text = new TextEncoder()
        const hash = await crypto.subtle.digest({
            name: 'SHA-256',
        }, text.encode(value));
        return Buffer.from(hash).toString('hex');
    }

    static generateKeyId(accountId: string = ''){
        const bytes = new Uint8Array(21);
        crypto.getRandomValues(bytes);
        const base64String = btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, "_") // URL-friendly characters
        .replace(/\//g, "-")
        .replace(/^-/, "_"); // no '-' in the beginning
        return base64String.concat(accountId);
    }
}