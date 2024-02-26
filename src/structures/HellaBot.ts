import { ActivityType, Client, Collection, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { Command } from './Command';

export const globalCommands: { [key: string]: Command } = {};

export default class HellaBot {
    client: Client;
    commands = new Collection<string, Command>();

    public constructor(token: string, clientId: string, intents: { intents: GatewayIntentBits[] }) {
        this.client = new Client(intents);
        this.client.login(token);
        this.loadCommands(token, clientId);
        this.handleInteractions();

        this.client.once(Events.ClientReady, client => {
            console.log(`Ready! Logged in as ${client.user.tag}`);
            client.user.setActivity('CC#13', { type: ActivityType.Competing });
        });
    }

    async loadCommands(token: string, clientId: string) {
        const commandArr = [];
        const commandFiles = readdirSync(join(__dirname, '..', 'commands')).filter(file => file.endsWith('.ts'));
        for (const file of commandFiles) {
            const command = new (await import(join(__dirname, '..', 'commands', file))).default();
            globalCommands[command.data.name] = command; // MUST be loaded first for help command options to work
        }
        for (const file of commandFiles) {
            const command = new (await import(join(__dirname, '..', 'commands', file))).default();
            this.commands.set(command.data.name, command);
            commandArr.push(command.data.toJSON());
        }
        const rest = new REST().setToken(token);
        await rest.put(Routes.applicationCommands(clientId), { body: commandArr },);
    }

    async handleInteractions() {
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
                    await interaction.deferUpdate();
                    const idArr: string[] = interaction.customId.split('ඞ');
                    const command = this.commands.get(idArr[0]);
                    await command.buttonResponse(interaction, idArr);
                } catch (err) {
                    console.error(err);
                }
            }
            else if (interaction.isStringSelectMenu()) {
                try {
                    await interaction.deferUpdate();
                    const idArr: string[] = interaction.customId.split('ඞ');
                    const command = this.commands.get(idArr[0]);
                    await command.selectResponse(interaction, idArr);
                } catch (err) {
                    console.error(err);
                }
            }
        });
    }
}