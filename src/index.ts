import { GatewayIntentBits } from 'discord.js';
import { initializeData } from './data';
import HellaBot from './structures/HellaBot';

const bot = new HellaBot({ intents: [GatewayIntentBits.Guilds] });
initializeData();