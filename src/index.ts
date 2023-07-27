import { GatewayIntentBits } from 'discord.js';
import HellaBot from './structures/HellaBot';
const { channelId, clientId, token } = require('../config.json');

const bot = new HellaBot(token, clientId, channelId, { intents: [GatewayIntentBits.Guilds] });