import { Command } from "commander";
import { Otentikasi } from "../service/Otentikasi";
import { Bidding, BiddingAppError } from "../service/Bidding";
import dayjs from 'dayjs';
import { Log } from "../utils/Log";
import { DBUtils } from "../utils/dbUtils";

const auth = new Command('auth')
.description('managemenet otentikasi');

const BiddingService = new Bidding();
const AuthService = new Otentikasi(BiddingService); 

auth.command('whoami')
.description('view authentication information')
.option('-j , --json', '', false)
.action(async({ json }) => {
    try {
        const data = await AuthService.getInfoUser();
        if (json) {
            Log.LogJSON(data);
            return;
        } else {
            Log.LogBox(data);
            return;
        }
    } catch (err) {
        if (err instanceof BiddingAppError) {
            if (err.message === 'Your account has expired.') {
                await DBUtils.deleteUser();
            }
            Log.LogError(err);
        }
    }
    
})

auth.command('login')
.description('')
.requiredOption('-e, --email <email>', '')
.requiredOption('-p, --password <password>', '')
.option('-j , --json', '', false)
.action(async ({ email, password, json }) => {
    const data = await AuthService.createAuth(email, password);
    try {
        if (json) {
            Log.LogJSON(data);
        } else {
            Log.LogBox(data);
        }
        await DBUtils.addUser(data, email);
        return;
    } catch (err) {
        if (err instanceof BiddingAppError) {
            Log.LogError(err);
        }
    }
});

auth.command('register')
.description('')
.requiredOption('-u , --username <username>')
.requiredOption('-e , --email <email>')
.requiredOption('-p , --password <password>')
.option('-j , --json')
.action(async ({ username, email, password, json }) => {
    const data = await AuthService.createAuthUser(username, email, password);
    if (json) {
        console.log(data);
        return;
    } else {
        const time = dayjs(data.users.expired_at ?? new Date());
        console.log(data.users.apiKey, `(${time})`)
        return;
    }
})

auth.command('logout')
.description('')
.action(async () => {
    try {
        const data = await await AuthService.createAuthLogout();
        if (data.users.message === 'reset') {
            Log.Log(data.users.message);
        }
    } catch (err) {
        if (err instanceof BiddingAppError) {
            Log.LogError(err);
        }
    }
})

export default auth;