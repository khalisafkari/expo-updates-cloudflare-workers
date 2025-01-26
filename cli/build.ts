await Bun.build({
    entrypoints: ['./index.ts'],
    outdir: "./build",
    target: 'node',
    env: 'inline'
})