abstract class Hash {
    static async createHash(buffer: ArrayBuffer, encoding: BufferEncoding = 'hex') {
        const digest = await crypto.subtle.digest('SHA-256', buffer);
        return Buffer.from(digest).toString(encoding)
    }

    static base64URLEncoding(value: string) {
        return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

    static sha256HashToUUID(value: string) {
        return `${value.slice(0, 8)}-${value.slice(8, 12)}-${value.slice(12, 16)}-${value.slice(
            16,
            20
        )}-${value.slice(20, 32)}`;
    }
}

export default Hash;