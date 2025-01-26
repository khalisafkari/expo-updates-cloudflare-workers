import { Log } from "./Log";
import { BiddingAppError } from "../service/Bidding";
import os from 'os';

type UserInfo = {
    username: string;
    apiKey: string;
    expired_at: string;
}

type Users = {
    users: UserInfo
}

export class DBUtils {
    static async addUser(users: Users, email: string) {
        return await Bun.write(`${os.homedir()}/.cli`, JSON.stringify({
            email,
            expiredAt: users.users.expired_at,
            key: users.users.apiKey,
            username: users.users.username,
        }))
    }

    static async getUser() {
        const cli = Bun.file(`${os.homedir()}/.cli`);
        if (await cli.exists()) {
            return await cli.json() as {
                email: string;
                expiredAt: string;
                key: string;
                username: string;
            };
        } else {
            Log.LogError(new BiddingAppError('NotFound cli.json', 404))
        }
    }

    static async deleteUser() {
        const cli = Bun.file(`${os.homedir()}/.cli`);
        if (await cli.exists()) {
            await cli.delete();
        }
        return;
    }
}