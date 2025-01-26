import dayjs from "dayjs"
import type { BiddingAppError } from "../service/Bidding";

type Users = {
    users: {
        username: string;
        apiKey: string;
        expired_at: string;
    }
}

type Apps = {
    apps: {
        name: string;
        package: string;
        key: string;
        time: string;
    }[];
}

export class Log {
    static LogBox(users: Users) {
        console.table([{
            name: users.users.username,
            key: users.users.apiKey,
            expired: `${dayjs(users.users.expired_at).format('YYYY-MM-DD')}`,
        }])
        return;
    }

    static LogBoxApps(apps: Apps) {
        console.table(apps.apps.map((app) => ({
            name: app.name,
            package: app.package,
            key: app.key,
            time: `${dayjs(app.time)}`
        })));
        return;
    }

    static LogJSONApps(apps: Apps) {
        console.log(apps.apps);
        return;
    }

    static Log(message: string) {
        console.log('[Log]:', message)
    }

    static LogJSON(users: Users) {
        console.log(users.users);
        return;
    }

    static LogError(errors: BiddingAppError) {
        console.error({
            code: errors.code,
            name: errors.name,
            message: errors.message,
            response: errors.response
        });
        return;
    }
}