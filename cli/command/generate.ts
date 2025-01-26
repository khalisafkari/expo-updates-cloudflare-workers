import { Command } from 'commander';
import { Bidding, BiddingAppError } from '../service/Bidding';
import Build from '../service/Build';
import { Log } from '../utils/Log';

const generate = new Command('generate')
.description('')

const BiddingService = new Bidding();
const BuildServices = new Build(BiddingService);

generate.command('build')
.requiredOption('-k , --key <key>', 'choice a apps key')
.option('-d , --dir <dir>', '', process.cwd())
.option('-p , --platform <platform>', 'choice a platform', 'all')
.option('-o , --out-dir <out-dir>', '', process.cwd())
.option('-f , --force', '', true)
.option('-j , --json', '', false)
.action(async (str) => {
    try {
        const build = await BuildServices.generateBuild(str);
        if (str.json) {
            Log.LogJSONApps(build);
        } else {
            Log.LogBoxApps(build);
        }
    } catch (error) {
        if (error instanceof BiddingAppError) {
            Log.LogError(error);
        }
    }
})


export default generate