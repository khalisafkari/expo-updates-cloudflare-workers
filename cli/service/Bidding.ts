import Client from "./Client";

export type Headers = {
    [key: string]: any;
}

export type Payload = {
    [key: string]: any;
}

export class BiddingAppError extends Error {
    code: number;
    response: string;
    type: string;

    /**
     * Initializes a Bidding Exception.
     *
     * @param {string} message - The error message.
     * @param {number} code - The error code. Default is 0.
     * @param {string} type - The error type. Default is an empty string.
     * @param {string} response - The response string. Default is an empty string.
     */
    constructor(message: string, code: number = 0, type: string = '', response: string = '') {
        super(message);
        this.name = 'BiddingAppException';
        this.message = message;
        this.code = code;
        this.type = type;
        this.response = response;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, BiddingAppError);
        }
    }
}

export class Bidding extends Client {
    
    addHeader(key: string, value: string) {
        this.config.headers[key] = value;  
    }
    
    async call(method: string = 'GET', url: URL, headers: Headers = {}, params: Payload = {},  responseType = 'json') {
        const { uri, options } = this.prepareRequest(method, url, headers, params);
        
        let data: any;

        const response = await fetch(uri, options);
        const warnings = response.headers.get('app-x-warning');
        if (warnings) {
            warnings.split(';').forEach((warning: string) => console.warn('Warning:', warning))
        }
        if (response.headers.get('content-type')?.includes('application/json')) {
            data = await response.json();
        } else if (responseType === 'arrayBuffer') {
            data = await response.arrayBuffer();
        } else {
            data = {
                message: await response.text()
            }
        }

        if (400 <= response.status) {
            throw new BiddingAppError(data.errors.message, response.status, response.statusText, `${JSON.stringify(data)}`)
        }

        const cookieFallback = response.headers.get('X-Fallback-Cookies');

        if (typeof window !== 'undefined' && window.localStorage && cookieFallback) {
            window.console.warn('Appwrite is using localStorage for session management. Increase your security by adding a custom domain as your API endpoint.');
            window.localStorage.setItem('cookieFallback', cookieFallback);
        }

        return data;
    }

    getURL(path: string) {
        return new URL(this.config.url + path);
    }
}
