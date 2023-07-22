import { ActivityType, Client, Collection, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { getCcStage, getEnemy, getOperator, getParadox, getRogueTheme, getStageArr, getToughStageArr } from '../api';
import * as build from '../utils/build';
import { Command } from './Command';
const { clientId, token } = require('../../config.json');

export default class HellaBot {
    client: Client;
    commands = new Collection<string, Command>();

    public constructor(intents: { intents: GatewayIntentBits[] }) {
        this.client = new Client(intents);
        this.client.login(token);
        this.loadCommands();

        this.client.once(Events.ClientReady, client => {
            console.log(`Ready! Logged in as ${client.user.tag}`);
            client.user.setActivity('CC#13', { type: ActivityType.Competing });
        });

        this.handleInteractions();
    }

    async loadCommands() {
        const commandArr = [];
        const commandFiles = readdirSync(join(__dirname, '..', 'commands')).filter(file => file.endsWith('.ts'));
        for (const file of commandFiles) {
            const command = new (await import(join(__dirname, '..', 'commands', file))).default();
            this.commands.set(command.data.name, command);
            commandArr.push(command.data.toJSON());
        }
        const rest = new REST().setToken(token);
        await rest.put(Routes.applicationCommands(clientId), { body: commandArr },);
    }

    async handleInteractions() {
        // Initial slash command interaction handling
        this.client.on(Events.InteractionCreate, async interaction => {
            if (!interaction.isChatInputCommand()) return;
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
        });

        // Autocomplete interaction handling
        // thanks to this guy for revealing autocomplete is a thing that exists => https://www.youtube.com/watch?v=znTvzGChzVE
        this.client.on(Events.InteractionCreate, async interaction => {
            if (!interaction.isAutocomplete()) return;

            try {
                const command = this.commands.get(interaction.commandName);
                await command.autocomplete(interaction);
            } catch (err) {
                console.log(err);
            }
        });

        // Button interaction handling
        this.client.on(Events.InteractionCreate, async interaction => {
            if (!interaction.isButton()) return;

            try {
                const idArr: string[] = interaction.customId.split('ඞ');

                await interaction.deferUpdate();

                switch (idArr[0]) {
                    case 'cc': {
                        const stage = await getCcStage(idArr[1])
                        const page = parseInt(idArr[2]);

                        const ccEmbed = await build.buildCcMessage(stage, page);
                        await interaction.editReply(ccEmbed);

                        break;
                    }
                    case 'cost': {
                        const op = await getOperator(idArr[1]);
                        const page = parseInt(idArr[2]);

                        const costEmbed = await build.buildCostMessage(op, page);
                        await interaction.editReply(costEmbed);

                        break;
                    }
                    case 'enemy': {
                        const enemy = await getEnemy(idArr[1]);
                        const level = parseInt(idArr[2]);

                        const enemyEmbed = await build.buildEnemyMessage(enemy, level);
                        await interaction.editReply(enemyEmbed);

                        break;
                    }
                    case 'events': {
                        const index = parseInt(idArr[1]);

                        const eventListEmbed = await build.buildEventListMessage(index);
                        await interaction.editReply(eventListEmbed);

                        break;
                    }
                    case 'info': {
                        const op = await getOperator(idArr[1]);
                        const type = parseInt(idArr[2]);
                        const page = parseInt(idArr[3]);
                        const level = parseInt(idArr[4]);

                        const infoEmbed = await build.buildInfoMessage(op, type, page, level);
                        await interaction.editReply(infoEmbed);

                        break;
                    }
                    case 'module': {
                        const op = await getOperator(idArr[1]);
                        const page = parseInt(idArr[2]);
                        const level = parseInt(idArr[3]);

                        const moduleEmbed = await build.buildModuleMessage(op, page, level);
                        await interaction.editReply(moduleEmbed);

                        break;
                    }
                    case 'paradox': {
                        const op = await getOperator(idArr[1]);
                        const paradox = await getParadox(op.id);
                        const page = parseInt(idArr[2]);

                        const paradoxEmbed = await build.buildParadoxMessage(paradox, page);
                        await interaction.editReply(paradoxEmbed);

                        break;
                    }
                    case 'recruit': {
                        const qual = idArr[1];
                        const value = parseInt(idArr[2]);
                        const tag = idArr[3];
                        const select = idArr[4] === 'select';

                        const recruitEmbed = await build.buildRecruitMessage(qual, value, tag, select);
                        await interaction.editReply(recruitEmbed);

                        break;
                    }
                    case 'rogue': {
                        switch (idArr[1]) {
                            case 'relic': {
                                const theme = parseInt(idArr[2]);
                                const index = parseInt(idArr[3]);

                                const relicListEmbed = await build.buildRogueRelicListMessage(theme, index);
                                await interaction.editReply(relicListEmbed);

                                break;
                            }
                            case 'stage': {
                                const theme = parseInt(idArr[2]);
                                const rogueTheme = await getRogueTheme(theme)
                                const stages = idArr[4] === 'true' ? rogueTheme.toughStageDict : rogueTheme.stageDict;
                                const stage = stages[idArr[3]];
                                const page = parseInt(idArr[5]);

                                const stageEmbed = await build.buildRogueStageMessage(theme, stage, page);
                                await interaction.editReply(stageEmbed);

                                break;
                            }
                        }

                        break;
                    }
                    case 'skill': {
                        const op = await getOperator(idArr[1]);
                        const page = parseInt(idArr[2]);
                        const level = parseInt(idArr[3]);

                        const skillEmbed = await build.buildSkillMessage(op, page, level);
                        await interaction.editReply(skillEmbed);

                        break;
                    }
                    case 'skin': {
                        const op = await getOperator(idArr[1]);
                        const page = parseInt(idArr[2]);
                        const skinEmbed = await build.buildArtMessage(op, page);

                        await interaction.editReply(skinEmbed);
                        break;
                    }
                    case 'stage': {
                        const stage = idArr[3] === 'true' ? (await getToughStageArr(idArr[1]))[parseInt(idArr[2])] : (await getStageArr(idArr[1]))[parseInt(idArr[2])];
                        const page = parseInt(idArr[4]);

                        const stageEmbed = await build.buildStageMessage(stage, page);
                        await interaction.editReply(stageEmbed);

                        break;
                    }
                }
            } catch (err) {
                console.error(err);
            }
        });

        // Select menu interaction handling
        this.client.on(Events.InteractionCreate, async interaction => {
            if (!interaction.isStringSelectMenu()) return;

            try {
                const idArr: string[] = interaction.customId.split('ඞ');

                await interaction.deferUpdate();

                switch (idArr[0]) {
                    case 'cc': {
                        const stage = await getCcStage(interaction.values[0])

                        const ccEmbed = await build.buildCcMessage(stage, 0);
                        await interaction.editReply(ccEmbed);

                        break;
                    }
                    case 'spine': {
                        const op = await getOperator(idArr[1]);
                        const type = interaction.values[0];

                        await interaction.editReply({ content: `Generating \`${type}\` gif...`, components: [] })

                        const { page, browser, rand } = await build.buildSpinePage(op, type);

                        page.on('console', async message => {
                            if (message.text() !== 'done') return;
                            await new Promise(r => setTimeout(r, 1000));
                            await browser.close();
                            const spineEmbed = await build.buildSpineMessage(op, type, rand);
                            await interaction.editReply(spineEmbed);
                            await unlinkSync(join(__dirname, '..', 'spine', op.id + rand + '.gif'));
                        }).on('pageerror', async ({ message }) => {
                            console.error(message);
                            return await interaction.editReply({ content: 'There was an error while generating the animation!' });
                        });

                        break;
                    }
                    case 'stage': {
                        const stage = (await getStageArr(idArr[2]))[interaction.values[0]];

                        const stageEmbed = await build.buildStageMessage(stage, 0);
                        await interaction.editReply(stageEmbed);

                        break;
                    }
                }
            } catch (err) {
                console.error(err);
            }
        });
    }
}