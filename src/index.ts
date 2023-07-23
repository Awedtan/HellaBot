import { GatewayIntentBits } from 'discord.js';
import HellaBot from './structures/HellaBot';

const bot = new HellaBot({ intents: [GatewayIntentBits.Guilds] });