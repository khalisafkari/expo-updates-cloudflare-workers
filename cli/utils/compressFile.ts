import archiver from 'archiver';
import { createWriteStream } from 'fs'
import { join } from 'path'
import { generateKeyId } from './generateKeyId';

export const compressFile = async (source: string, output: string) => {
    return new Promise((resolve, reject) => {
        const pathWithId = join(output, `${generateKeyId('.zip')}`);
        const outputDirectory = createWriteStream(pathWithId);
        const buildZip = archiver('zip', { zlib: { level: 9 } });

        outputDirectory.on('close', () => {
            resolve(pathWithId);
        })

        buildZip.on('error', (err) => reject(err));

        buildZip.pipe(outputDirectory);
        // buildZip.glob("**/*", {
        //     cwd: source,
        //     ignore: ["**/*.zip"]
        // })
        buildZip.directory(source, false)
        buildZip.finalize();
    })
}