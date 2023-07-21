import { ActivityType, Client, Collection, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { ccDict, enemyDict, operatorDict, paradoxDict, rogueThemeArr, stageDict, toughStageDict } from '../data';
import * as utils from '../utils/build';
import { Command } from './Command';
import { getCcStage, getEnemy, getOperator, getParadox } from '../api';
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

        // Button and select menu interaction handling
        this.client.on(Events.InteractionCreate, async interaction => {
            if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

            try {
                const idArr: string[] = interaction.customId.split('ඞ');

                switch (idArr[0]) {
                    case 'cc': {
                        if (interaction.isStringSelectMenu()) {
                            // const stage = ccDict[interaction.values[0]];
                            const stage = await getCcStage(interaction.values[0])

                            const ccEmbed = await utils.buildCcMessage(stage, 0);
                            await interaction.update(ccEmbed);

                            break;
                        }
                        else {
                            // const stage = ccDict[idArr[1]];
                            const stage = await getCcStage(idArr[1])
                            const page = parseInt(idArr[2]);

                            const ccEmbed = await utils.buildCcMessage(stage, page);
                            await interaction.update(ccEmbed);

                            break;
                        }
                    }
                    case 'cost': {
                        // const op = operatorDict[idArr[1]];
                        const op = await getOperator(idArr[1]);
                        const page = parseInt(idArr[2]);

                        const costEmbed = utils.buildCostMessage(op, page);
                        await interaction.update(costEmbed);

                        break;
                    }
                    case 'enemy': {
                        // const enemy = enemyDict[idArr[1]];
                        const enemy = await getEnemy(idArr[1]);
                        const level = parseInt(idArr[2]);

                        const enemyEmbed = utils.buildEnemyMessage(enemy, level);
                        await interaction.update(enemyEmbed);

                        break;
                    }
                    case 'events': {
                        const index = parseInt(idArr[1]);

                        const eventListEmbed = utils.buildEventListMessage(index);
                        await interaction.update(eventListEmbed);

                        break;
                    }
                    case 'info': {
                        await interaction.deferUpdate();

                        // const op = operatorDict[idArr[1]];
                        const op = await getOperator(idArr[1]);
                        const type = parseInt(idArr[2]);
                        const page = parseInt(idArr[3]);
                        const level = parseInt(idArr[4]);

                        const infoEmbed = utils.buildInfoMessage(op, type, page, level);
                        await interaction.editReply(infoEmbed);

                        break;
                    }
                    case 'module': {
                        // const op = operatorDict[idArr[1]];
                        const op = await getOperator(idArr[1]);
                        const page = parseInt(idArr[2]);
                        const level = parseInt(idArr[3]);

                        const moduleEmbed = utils.buildModuleMessage(op, page, level);
                        await interaction.update(moduleEmbed);

                        break;
                    }
                    case 'paradox': {
                        // const paradox = paradoxDict[operatorDict[idArr[1]].id];
                        const op = await getOperator(idArr[1]);
                        const paradox = await getParadox(op.id);
                        const page = parseInt(idArr[2]);

                        const paradoxEmbed = await utils.buildParadoxMessage(paradox, page);
                        await interaction.update(paradoxEmbed);

                        break;
                    }
                    case 'recruit': {
                        const qual = idArr[1];
                        const value = parseInt(idArr[2]);
                        const tag = idArr[3];
                        const select = idArr[4] === 'select';

                        const recruitEmbed = utils.buildRecruitMessage(qual, value, tag, select);
                        await interaction.update(recruitEmbed);

                        break;
                    }
                    case 'rogue': {
                        switch (idArr[1]) {
                            case 'relic': {
                                const theme = parseInt(idArr[2]);
                                const index = parseInt(idArr[3]);

                                const relicListEmbed = utils.buildRogueRelicListMessage(theme, index);
                                await interaction.update(relicListEmbed);

                                break;
                            }
                            case 'stage': {
                                const theme = parseInt(idArr[2]);
                                const rogueTheme = rogueThemeArr[theme];
                                const stages = idArr[4] === 'true' ? rogueTheme.toughStageDict : rogueTheme.stageDict;
                                const stage = stages[idArr[3]];
                                const page = parseInt(idArr[5]);

                                const stageEmbed = await utils.buildRogueStageMessage(theme, stage, page);
                                await interaction.update(stageEmbed);

                                break;
                            }
                        }

                        break;
                    }
                    case 'skill': {
                        // const op = operatorDict[idArr[1]];
                        const op = await getOperator(idArr[1]);
                        const page = parseInt(idArr[2]);
                        const level = parseInt(idArr[3]);

                        const skillEmbed = utils.buildSkillMessage(op, page, level);
                        await interaction.update(skillEmbed);

                        break;
                    }
                    case 'skin': {
                        await interaction.deferUpdate();

                        // const op = operatorDict[idArr[1]];
                        const op = await getOperator(idArr[1]);
                        const page = parseInt(idArr[2]);
                        const skinEmbed = utils.buildArtMessage(op, page);

                        await interaction.editReply(skinEmbed);
                        break;
                    }
                    case 'spine': {
                        if (interaction.isButton()) break;
                        // const op = operatorDict[idArr[1]];
                        const op = await getOperator(idArr[1]);
                        const type = interaction.values[0];

                        await interaction.deferUpdate();
                        await interaction.editReply({ content: `Generating \`${type}\` gif...`, components: [] })

                        const { page, browser, rand } = await utils.buildSpinePage(op, type);

                        page.on('console', async message => {
                            if (message.text() !== 'done') return;
                            await new Promise(r => setTimeout(r, 1000));
                            await browser.close();
                            const spineEmbed = await utils.buildSpineMessage(op, type, rand);
                            await interaction.editReply(spineEmbed);
                            await unlinkSync(join(__dirname, '..', 'spine', op.id + rand + '.gif'));
                        }).on('pageerror', async ({ message }) => {
                            console.error(message);
                            return await interaction.editReply({ content: 'There was an error while generating the animation!' });
                        });

                        break;
                    }
                    case 'stage': {
                        if (interaction.isStringSelectMenu()) {
                            const stages = stageDict[idArr[2]];
                            const stage = stages[interaction.values[0]];

                            const stageEmbed = await utils.buildStageMessage(stage, 0);
                            await interaction.update(stageEmbed);

                            break;
                        }
                        else {
                            const stages = idArr[3] === 'true' ? toughStageDict[idArr[1]] : stageDict[idArr[1]];
                            const stage = stages[parseInt(idArr[2])];
                            const page = parseInt(idArr[4]);

                            const stageEmbed = await utils.buildStageMessage(stage, page);
                            await interaction.update(stageEmbed);

                            break;
                        }
                    }
                }
            } catch (err) {
                console.error(err);
            }
        });
    }
}