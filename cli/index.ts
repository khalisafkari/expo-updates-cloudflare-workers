#! /usr/bin/env bun

import { config } from "dotenv";
config(); // Membaca file .env
import { Command } from 'commander'
import auth from './command/auth';
import apps from './command/apps';
import generate from './command/generate';


const program = new Command();

program
.name('cli')
.description('cli for utility cloudlfare expo-updates')
.version('1.0.0')

program.addCommand(auth);
program.addCommand(apps);
program.addCommand(generate);
program.parse();

