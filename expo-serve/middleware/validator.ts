import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

export const createHeaders = () => zValidator('header', z.object({
    'x-server-key': z.string(),
    'x-user-key': z.string(),
}))

export const createApps = () => zValidator('json', z.object({
    name: z.string(),
    package: z.string(),
}))

export const deleteApps = () => zValidator('query', z.object({
    apps: z.string()
}))

export const createBuildApps = () => zValidator('form', z.object({
    apps: z.string(),
    manifest: z.any(),
    bundle: z.any()
}))