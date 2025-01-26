import type { Payload, Headers } from './Bidding'

class Client {

    config: {
        url: string;
        headers: Headers;
    } = {
        url: process.env['BACKEND_URL'] ?? 'http://localhost:3000',
        headers: {
            'x-server-key': process.env.BACKEND_KEY,
            'user-agent': 'bun/1.2',
        }
    }

    prepareRequest(method: string, url: URL, headers: Headers = {}, params: Payload = {}) {
        method = method.toUpperCase();
        headers = Object.assign({}, this.config.headers, headers);

        let options: RequestInit = {
            method,
            headers,
            credentials: 'include',
        }

        if (method === 'GET') {
            for (const [key, value] of Object.entries(Client.flatten(params))) {
                url.searchParams.append(key, value);
            }
        } else {
            switch (headers['content-type']) {
                case 'application/json':
                    options.body = JSON.stringify(params);
                    break;

                case 'multipart/form-data':
                    const formData = new FormData();
                    for (const [key, value] of Object.entries(params)) {
                        if (value instanceof File) {
                            formData.append(key, value, value.name);
                        } else if (Array.isArray(value)) {
                            for (const nestedValue of value) {
                                formData.append(`${key}[]`, nestedValue);
                            }
                        } else {
                            formData.append(key, value);
                        }
                    }

                    options.body = formData;
                    delete headers['content-type'];
                    break;
            }
        }

        return {
            uri: url.toString(),
            options,
        }

    }
    
    static flatten(data: Payload, prefix = '') {
        let output: Payload = {}
        for (const [key, value] of Object.entries(data)) {
            let finalKey = prefix ? prefix + `[${key}]` : key;
            if (Array.isArray(value)) {
                output = {...output, ...Client.flatten(value, finalKey)}
            } else {
                output[finalKey] = value;
            }
        }
        return output;
    }

}

export default Client;