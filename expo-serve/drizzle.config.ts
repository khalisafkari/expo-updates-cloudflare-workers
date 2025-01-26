import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    out: "./drizzle/migrations",
    schema: "./db/schema.ts",
    dialect: 'sqlite',
})