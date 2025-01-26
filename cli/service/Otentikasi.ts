import type { Payload, Bidding, Headers } from "./Bidding";
import { DBUtils } from "../utils/dbUtils";

export class Otentikasi {

    bidding: Bidding;

    constructor(Bidding: Bidding) {
        this.bidding = Bidding;
    }

    async getInfoUser() {
        const optional = await DBUtils.getUser();
        const apiPath = '/auth/whoami';
        const payload: Payload = {};
        const uri = this.bidding.getURL(apiPath)
        const apiHeaders: Headers = {
            'content-type': 'application/json',
            'x-user-key': optional?.key,
        }
        return await this.bidding.call('get', uri, apiHeaders, payload);
    }

    async createAuth(email: string, password: string) {
        const apiPath  = '/auth/login';
        const payload: Payload = { email, password };
        const uri = this.bidding.getURL(apiPath)
        const apiHeaders: Headers = {
            'content-type': 'application/json',
        }
        return await this.bidding.call('post', uri, apiHeaders, payload);
    }

    async createAuthUser(username: string, email: string, password: string) {
        const apiPath = '/auth/register';
        const payload: Payload = { username, email, password };
        const uri = this.bidding.getURL(apiPath);
        const apiHeaders: Headers = {
            'content-type': 'application/json',
        }
        return await this.bidding.call('post', uri, apiHeaders, payload)
    }

    async createAuthLogout() {
        const optional = await DBUtils.getUser();
        const apiPath = '/auth/logout';
        const payload: Payload = {};
        const uri = this.bidding.getURL(apiPath)
        const apiHeaders: Headers = {
            'content-type': 'application/json',
            'x-user-key': optional?.key,
        }
        return await this.bidding.call('delete', uri, apiHeaders, payload);
    }
}

