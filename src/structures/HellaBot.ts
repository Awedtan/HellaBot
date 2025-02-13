import { ActivityType, ApplicationEmoji, Client, Collection, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import * as api from '../utils/api';
import Command from './Command';
const { paths } = require('../constants');

export const globalCommands: { [key: string]: Command } = {};
export const globalEmojis: { [key: string]: ApplicationEmoji } = {};

export default class HellaBot {
    token: string;
    clientId: string;
    disabled: { [key: string]: boolean };
    client: Client;
    commands = new Collection<string, Command>();

    public static async create(token: string, clientId: string, disabled: { [key: string]: boolean }) {
        const bot = new HellaBot(token, clientId, disabled);
        await bot.registerCommands();
        await new Promise<void>((resolve) => {
            bot.client.once(Events.ClientReady, client => {
                client.user.setActivity('CC#13', { type: ActivityType.Competing });
                resolve();
            });
        });
        await bot.registerEmojis();
        console.log(`Ready! Logged in as ${bot.client.user.tag}`);
        return bot;
    }

    private constructor(token: string, clientId: string, disabled: { [key: string]: boolean }) {
        this.token = token;
        this.clientId = clientId;
        this.disabled = disabled;

        this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
        this.client.login(this.token);

        this.client.on(Events.InteractionCreate, async interaction => {
            if (interaction.isChatInputCommand()) {
                const command = this.commands.get(interaction.commandName);

                if (!command) return console.error(`No command matching ${interaction.commandName} was found.`);

                try {
                    await command.execute(interaction);
                } catch (err) {
                    console.error(err);
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                    }
                    else {
                        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                    }
                }
            }
            else if (interaction.isAutocomplete()) {
                try {
                    const command = this.commands.get(interaction.commandName);
                    await command.autocomplete(interaction);
                } catch (err) {
                    console.error(err);
                }
            }
            else if (interaction.isButton()) {
                try {
                    const idArr: string[] = interaction.customId.split('ඞ');
                    const command = this.commands.get(idArr[0]);
                    await command.buttonResponse(interaction, idArr);
                } catch (err) {
                    console.error(err);
                }
            }
            else if (interaction.isStringSelectMenu()) {
                try {
                    const idArr: string[] = interaction.customId.split('ඞ');
                    const command = this.commands.get(idArr[0]);
                    await command.selectResponse(interaction, idArr);
                } catch (err) {
                    console.error(err);
                }
            }
        });
    }

    private async registerCommands() {
        const commandArr = [];
        const commandFiles = readdirSync(join(__dirname, '..', 'commands')).filter(file => file.endsWith('.ts'));
        for (const file of commandFiles) {
            const command = new (await import(join(__dirname, '..', 'commands', file))).default();

            if (this.disabled && this.disabled[command.data.name.toLowerCase()]) continue;

            globalCommands[command.data.name] = command; // MUST be loaded first for help command options to work
        }
        for (const file of commandFiles) {
            const command = new (await import(join(__dirname, '..', 'commands', file))).default();

            if (this.disabled && this.disabled[command.data.name.toLowerCase()]) continue;

            this.commands.set(command.data.name, command);
            commandArr.push(command.data.toJSON());
        }

        try {
            const rest = new REST().setToken(this.token);
            await rest.put(Routes.applicationCommands(this.clientId), { body: commandArr },);
        } catch (err) {
            console.error(err);
        }

        console.log('Registered application commands');
    }

    private async registerEmojis() {
        const emojis = await this.client.application.emojis.fetch();
        const emojiDict = Object.fromEntries(emojis.map(emoji => [emoji.name, true]));
        for (const emoji of emojis) {
            globalEmojis[emoji[1].name] = emoji[1];
        }

        const operators = await api.all('operator', { include: ['id', 'data.name'] });
        for (const op of operators) {
            if (op.id === 'char_1037_amiya3') op.id = 'char_1037_amiya3_2';
            if (!emojiDict[op.id]) {
                try {
                    await this.client.application.emojis.create({ attachment: `${paths.myAssetUrl}/operator/avatars/${op.id}.png`, name: op.id });
                } catch (err) {
                    console.error(err);
                }
            }
        }

        console.log('Registered application emojis');
    }
}