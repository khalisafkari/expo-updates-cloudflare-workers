import { DBUtils } from "../utils/dbUtils";
import type { Bidding, Headers, Payload } from "./Bidding";

export class Apps {
    bidding: Bidding;

    constructor(bidding: Bidding) {
        this.bidding = bidding;
    }


    async getListApps() {
        const optional = await DBUtils.getUser();
        const apiPath = '/apps';
        const payload: Payload = {};
        const uri = this.bidding.getURL(apiPath);
        const apiHeaders: Headers = {
            'content-type': 'application/json',
            'x-user-key': optional?.key
        }
        return await this.bidding.call('get', uri, apiHeaders, payload);
    }

    async createApps(name: string, packages: string) {
        const optional = await this.getUser();
        const apiPath = '/apps/create';
        const payload: Payload = { name, package: packages };
        const uri = this.bidding.getURL(apiPath);
        const apiHeaders: Headers = {
            'content-type': 'application/json',
            'x-user-key': optional?.key
        }
        return await this.bidding.call('post', uri, apiHeaders, payload)
    }

    private async getUser() {
        return await DBUtils.getUser();
    }


    async deleteApp(key: string) {
        const optional = await this.getUser();
        const apiPath = '/apps/delete';
        const payload: Payload = { };
        const uri = this.bidding.getURL(apiPath + '?apps=' + key);
        const apiHeaders: Headers = {
            'content-type': 'application/json',
            'x-user-key': optional?.key
        }
        return await this.bidding.call('delete', uri, apiHeaders, payload)
    }
}