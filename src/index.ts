import { GatewayIntentBits } from 'discord.js';
import HellaBot from './structures/HellaBot';
const { clientId, token, disabled } = require('../config.json');

const bot = new HellaBot(token, clientId, disabled, { intents: [GatewayIntentBits.Guilds] });

process.on('unhandledRejection', async (reason, promise) => console.log('Unhandled rejection: ', promise, reason));
process.on('uncaughtException', async (reason, promise) => console.log('Uncaught exception: ', promise, reason));
process.on('uncaughtExceptionMonitor', async (reason, promise) => console.log('Uncaught exception monitor: ', promise, reason));