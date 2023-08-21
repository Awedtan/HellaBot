import { ActivityType, Client, Collection, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { getCCStage, getEnemy, getOperator, getParadox, getRogueTheme, getStageArr, getToughStageArr } from '../utils/Api';
import * as Build from '../utils/Build';
import * as SpineHelper from '../utils/SpineHelper';
import { Command } from './Command';

export default class HellaBot {
    client: Client;
    commands = new Collection<string, Command>();

    public constructor(token: string, clientId: string, channelId: string, intents: { intents: GatewayIntentBits[] }) {
        this.client = new Client(intents);
        this.client.login(token);
        this.loadCommands(token, clientId);
        this.handleInteractions(channelId);

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
            this.commands.set(command.data.name, command);
            commandArr.push(command.data.toJSON());
        }
        const rest = new REST().setToken(token);
        await rest.put(Routes.applicationCommands(clientId), { body: commandArr },);
    }

    async handleInteractions(channelId: string) {
        if (channelId && channelId !== '') {
            this.client.on(Events.GuildCreate, async guild => {
                const channel = await this.client.channels.fetch(channelId);
                const name = guild.name;
                const memberCount = guild.memberCount;
                const owner = (await this.client.users.fetch(guild.ownerId)).username;
                if (channel.isTextBased()) {
                    channel.send(`Joined server \`${name}\`, owned by \`${owner}\`, with \`${memberCount}\` members.`);
                }
            });
            this.client.on(Events.GuildDelete, async guild => {
                const channel = await this.client.channels.fetch(channelId);
                const name = guild.name;
                const memberCount = guild.memberCount;
                const owner = (await this.client.users.fetch(guild.ownerId)).username;
                if (channel.isTextBased()) {
                    channel.send(`Left server \`${name}\`, owned by \`${owner}\`, with \`${memberCount}\` members.`);
                }
            });
        }

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
                        const stage = await getCCStage({ query: idArr[1] })
                        const page = parseInt(idArr[2]);

                        const ccEmbed = await Build.buildCcMessage(stage, page);
                        await interaction.editReply(ccEmbed);

                        break;
                    }
                    case 'cost': {
                        const op = await getOperator({ query: idArr[1] });
                        const page = parseInt(idArr[2]);

                        const costEmbed = await Build.buildCostMessage(op, page);
                        await interaction.editReply(costEmbed);

                        break;
                    }
                    case 'enemy': {
                        const enemy = await getEnemy({ query: idArr[1] });
                        const level = parseInt(idArr[2]);

                        const enemyEmbed = await Build.buildEnemyMessage(enemy, level);
                        await interaction.editReply(enemyEmbed);

                        break;
                    }
                    case 'events': {
                        const index = parseInt(idArr[1]);

                        const eventListEmbed = await Build.buildEventListMessage(index);
                        await interaction.editReply(eventListEmbed);

                        break;
                    }
                    case 'info': {
                        const op = await getOperator({ query: idArr[1] });
                        const type = parseInt(idArr[2]);
                        const page = parseInt(idArr[3]);
                        const level = parseInt(idArr[4]);

                        const infoEmbed = await Build.buildInfoMessage(op, type, page, level);
                        await interaction.editReply(infoEmbed);

                        break;
                    }
                    case 'module': {
                        const op = await getOperator({ query: idArr[1] });
                        const page = parseInt(idArr[2]);
                        const level = parseInt(idArr[3]);

                        const moduleEmbed = await Build.buildModuleMessage(op, page, level);
                        await interaction.editReply(moduleEmbed);

                        break;
                    }
                    case 'paradox': {
                        const op = await getOperator({ query: idArr[1] });
                        const paradox = await getParadox({ query: op.id });
                        const page = parseInt(idArr[2]);

                        const paradoxEmbed = await Build.buildParadoxMessage(paradox, page);
                        await interaction.editReply(paradoxEmbed);

                        break;
                    }
                    case 'recruit': {
                        const qual = idArr[1];
                        const value = parseInt(idArr[2]);
                        const tag = idArr[3];
                        const select = idArr[4] === 'select';

                        const recruitEmbed = await Build.buildRecruitMessage(qual, value, tag, select);
                        await interaction.editReply(recruitEmbed);

                        break;
                    }
                    case 'rogue': {
                        switch (idArr[1]) {
                            case 'relic': {
                                const theme = parseInt(idArr[2]);
                                const index = parseInt(idArr[3]);

                                const relicListEmbed = await Build.buildRogueRelicListMessage(theme, index);
                                await interaction.editReply(relicListEmbed);

                                break;
                            }
                            case 'stage': {
                                const theme = parseInt(idArr[2]);
                                const rogueTheme = await getRogueTheme({ query: theme.toString() })
                                const stages = idArr[4] === 'true' ? rogueTheme.toughStageDict : rogueTheme.stageDict;
                                const stage = stages[idArr[3]];
                                const page = parseInt(idArr[5]);

                                const stageEmbed = await Build.buildRogueStageMessage(theme, stage, page);
                                await interaction.editReply(stageEmbed);

                                break;
                            }
                        }

                        break;
                    }
                    case 'skill': {
                        const op = await getOperator({ query: idArr[1] });
                        const page = parseInt(idArr[2]);
                        const level = parseInt(idArr[3]);

                        const skillEmbed = await Build.buildSkillMessage(op, page, level);
                        await interaction.editReply(skillEmbed);

                        break;
                    }
                    case 'skin': {
                        const op = await getOperator({ query: idArr[1] });
                        const page = parseInt(idArr[2]);
                        const skinEmbed = await Build.buildArtMessage(op, page);

                        await interaction.editReply(skinEmbed);
                        break;
                    }
                    case 'stage': {
                        const stage = idArr[3] === 'true' ? (await getToughStageArr({ query: idArr[1] }))[parseInt(idArr[2])] : (await getStageArr({ query: idArr[1] }))[parseInt(idArr[2])];
                        const page = parseInt(idArr[4]);

                        const stageEmbed = await Build.buildStageMessage(stage, page);
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
                        const stage = await getCCStage({ query: interaction.values[0] })

                        const ccEmbed = await Build.buildCcMessage(stage, 0);
                        await interaction.editReply(ccEmbed);

                        break;
                    }
                    case 'spine': {
                        const type = idArr[1];
                        let id = idArr[2];
                        const anim = interaction.values[0];

                        await interaction.editReply({ content: `Generating \`${anim}\` gif...`, components: [] })

                        const char = type === 'operator' ? await getOperator({ query: id, include: ['id', 'data'] }) : await getEnemy({ query: id, include: ['excel'] });
                        const skelData = await SpineHelper.loadSkel(type, id);

                        const animArr = [];
                        for (const animation of skelData.animations) {
                            if (animation.name === 'Default') continue;
                            animArr.push(animation.name);
                        }

                        const { page, browser, rand } = await SpineHelper.launchPage(type, id, anim);

                        page.on('console', async message => {
                            if (message.text() === 'done') {
                                await new Promise(r => setTimeout(r, 1000));
                                await browser.close();

                                const spineEmbed = await Build.buildSpineMessage(char, animArr, anim, rand);
                                await interaction.editReply(spineEmbed);
                                id = id.split('zomsbr').join('zomsabr');

                                let gifPath = join(__dirname, '..', 'utils', 'spine', id + rand + '.gif');
                                if (!await Build.fileExists(gifPath)) {
                                    gifPath = gifPath.split('_2').join('');
                                }
                                unlinkSync(gifPath);
                            }
                        }).on('pageerror', async ({ message }) => {
                            console.error(`Spine error for ${id}: ` + message);
                            return await interaction.editReply({ content: 'There was an error while generating the animation!' });
                        });

                        break;
                    }
                    case 'stage': {
                        const stage = (await getStageArr({ query: idArr[2] }))[interaction.values[0]];

                        const stageEmbed = await Build.buildStageMessage(stage, 0);
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