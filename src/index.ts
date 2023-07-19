import { GatewayIntentBits } from 'discord.js';
import HellaBot from './HellaBot';

const bot = new HellaBot({ intents: [GatewayIntentBits.Guilds] });