export const generateKeyId = (accountId: string = '') => {
    const bytes = new Uint8Array(21);
    crypto.getRandomValues(bytes);
    const base64String = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "_") // URL-friendly characters
    .replace(/\//g, "-")
    .replace(/^-/, "_"); // no '-' in the beginning
    return base64String.concat(accountId);
}