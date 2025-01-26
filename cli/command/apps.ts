import { Command } from "commander";
import { Bidding, BiddingAppError } from "../service/Bidding";
import { Apps } from "../service/Apps";
import { Log } from "../utils/Log";

const apps = new Command('apps')
.description('');

const BiddingService = new Bidding()
const AppServices = new Apps(BiddingService);

apps.command('list')
.description('')
.option('-j , --json', '', false)
.action(async ({ json }) => {
    try {
        const apps = await  AppServices.getListApps();

        if (json) {
            Log.LogJSONApps(apps);
        } else {
            Log.LogBoxApps(apps);
        }

    } catch (error) {
        if (error instanceof BiddingAppError) {
            Log.LogError(error);
        }
    }
})

apps.command('create')
.description('')
.requiredOption('-n , --name <name>', 'insert apps name')
.requiredOption('-p , --package <package>', 'insert apps package')
.option('-j , --json', '', false)
.action(async(str) => {
    try {
        const app = await AppServices.createApps(str.name, str.package);
        if (str.json) {
            Log.LogJSONApps(app);
        } else {
            Log.LogBoxApps(app);
        }
    } catch (error) {
        if (error instanceof BiddingAppError) {
            Log.LogError(error);
        }
    }
})

apps.command('delete')
.description('')
.requiredOption('-k , --key <key>', '')
.option('-j , --json', '', false)
.action(async ({ key, json }) => {
    try {
        const apps = await AppServices.deleteApp(key)
        if (json) {
            Log.LogJSONApps(apps);
        } else {
            Log.LogBoxApps(apps);
        }
    } catch (error) {
        if (error instanceof BiddingAppError) {
            Log.LogError(error);
        }
    } 
})

export default apps;