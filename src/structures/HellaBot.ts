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

    public static async create(token: string, clientId: string, disabled: { [key: string]: boolean }, skipRegister: boolean = false) {
        const bot = new HellaBot(token, clientId, disabled);
        bot.client.once(Events.ClientReady, async client => {
            client.user.setActivity('CC#13', { type: ActivityType.Competing });
            await Promise.all([
                bot.registerCommands(skipRegister),
                bot.registerEmojis(skipRegister)
            ]);
            console.log(`Ready! Logged in as ${bot.client.user.tag}`);
        });
        await bot.client.login(token);
        return bot;
    }

    private constructor(token: string, clientId: string, disabled: { [key: string]: boolean }) {
        this.token = token;
        this.clientId = clientId;
        this.disabled = disabled;

        this.client = new Client({ intents: [GatewayIntentBits.Guilds] });

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

    private async registerCommands(skipRegister: boolean) {
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

        if (!skipRegister) {
            try {
                const rest = new REST().setToken(this.token);
                await rest.put(Routes.applicationCommands(this.clientId), { body: commandArr },);
            } catch (err) {
                console.error(err);
            }

            console.log('Registered application commands');
        }
        else {
            console.log('Skipped command registration');
        }
    }

    private async registerEmojis(skipRegister: boolean) {
        const emojis = await this.client.application.emojis.fetch();
        const emojiDict = Object.fromEntries(emojis.map(emoji => [emoji.name, true]));

        if (!skipRegister) {
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

            const items = (await api.searchV2('item', { filter: { 'data.itemType': { 'in': ['MATERIAL', 'CARD_EXP'] } }, include: ['data'] }))
                .filter(item => !item.data.name.includes('Token') && !item.data.itemId.includes('token') && !item.data.iconId.includes('token'))
                .sort((a, b) => a.data.sortId - b.data.sortId);

            for (const item of items) {
                if (!item.data.iconId) continue;
                if (!emojiDict[item.data.iconId]) {
                    try {
                        await this.client.application.emojis.create({ attachment: `${paths.myAssetUrl}/items/${item.data.iconId}.png`, name: item.data.iconId });
                    } catch (err) {
                        console.error(err);
                    }
                }
            }

            const lmd = await api.single('item', { query: '4001' });
            if (!emojiDict[lmd.data.iconId]) {
                try {
                    await this.client.application.emojis.create({ attachment: `${paths.myAssetUrl}/items/${lmd.data.iconId}.png`, name: lmd.data.iconId });
                } catch (err) {
                    console.error(err);
                }
            }

            console.log('Registered application emojis');
        }
        else {
            console.log('Skipped emoji registration');
        }

        const finalEmojis = await this.client.application.emojis.fetch();
        for (const emoji of finalEmojis) {
            globalEmojis[emoji[1].name] = emoji[1];
        }
    }
}