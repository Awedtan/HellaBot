const fs = require('fs');
const path = require('path');
const { ActivityType, Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('../config.json');
const create = require('./create');
const fetch = require('./fetch');

// Load command files
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
    else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Pull data from ArknightsGameData repo
fetch.initializeAll();

client.login(token);

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    c.user.setActivity('CC#13', { type: ActivityType.Competing });
});

// Initial slash command interaction handling
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) return console.error(`No command matching ${interaction.commandName} was found.`);
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        }
        else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

// Start of command interaction handling
import { CCStage, Enemy, Module, Paradox, Operator, RogueTheme, Skill, Stage } from "./types";

const ccDict: { [key: string]: CCStage } = fetch.cc();
const enemyDict: { [key: string]: Enemy } = fetch.enemies();
const moduleDict: { [key: string]: Module } = fetch.modules();
const opDict: { [key: string]: Operator } = fetch.operators();
const paradoxDict: { [key: string]: Paradox } = fetch.paradoxes();
const rogueThemeArr: RogueTheme[] = fetch.rogueThemes();
const skillDict: { [key: string]: Skill } = fetch.skills();
const stageDict: { [key: string]: Stage[] } = fetch.stages();
const toughStageDict: { [key: string]: Stage[] } = fetch.toughStages();

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isAutocomplete()) return;

    try {
        const command = client.commands.get(interaction.commandName);
        await command.autocomplete(interaction);
    } catch (err) {
        console.log(err);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    const idArr: string[] = interaction.customId.split('ඞ');

    switch (idArr[0]) {
        case 'cc': {
            if (idArr[1] === 'select') {
                const stage = ccDict[interaction.values[0]];

                const ccEmbed = await create.ccEmbed(stage, 0);
                await interaction.update(ccEmbed);

                break;
            }
            else {
                const stage = ccDict[idArr[1]];
                const page = parseInt(idArr[2]);

                const ccEmbed = await create.ccEmbed(stage, page);
                await interaction.update(ccEmbed);

                break;
            }
        }
        case 'cost': {
            const op = opDict[idArr[1]];
            const type = idArr[2];

            const costEmbed = create.costEmbed(op, type);
            await interaction.update(costEmbed);

            break;
        }
        case 'enemy': {
            const enemy = enemyDict[idArr[1]];
            const level = parseInt(idArr[2]);

            const enemyEmbed = create.enemyEmbed(enemy, level);
            await interaction.update(enemyEmbed);

            break;
        }
        case 'info': {
            await interaction.deferUpdate();

            const op = opDict[idArr[1]];
            const type = parseInt(idArr[2]);
            const page = parseInt(idArr[3]);
            const level = parseInt(idArr[4]);

            const infoEmbed = create.infoEmbed(op, type, page, level);
            await interaction.editReply(infoEmbed);

            break;
        }
        case 'module': {
            const module = moduleDict[idArr[1]];
            const op = opDict[idArr[2]];
            const level = parseInt(idArr[3]);

            const moduleEmbed = create.moduleEmbed(module, op, level);
            await interaction.update(moduleEmbed);

            break;
        }
        case 'paradox': {
            const paradox = paradoxDict[opDict[idArr[1]].id];
            const page = parseInt(idArr[2]);

            const paradoxEmbed = await create.paradoxEmbed(paradox, page);
            await interaction.update(paradoxEmbed);

            break;
        }
        case 'recruit': {
            const qual = idArr[1];
            const value = parseInt(idArr[2]);
            const tag = idArr[3];
            const select = idArr[4] === 'select';

            const recruitEmbed = create.recruitEmbed(qual, value, tag, select);
            await interaction.update(recruitEmbed);

            break;
        }
        case 'rogue': {
            switch (idArr[1]) {
                case 'relic': {
                    const theme = parseInt(idArr[2]);
                    const index = parseInt(idArr[3]);

                    const relicListEmbed = create.rogueRelicListEmbed(theme, index);
                    await interaction.update(relicListEmbed);

                    break;
                }
                case 'stage': {
                    const theme = parseInt(idArr[2]);
                    const rogueTheme = rogueThemeArr[theme];
                    const stages = idArr[4] === 'true' ? rogueTheme.toughStageDict : rogueTheme.stageDict;
                    const stage = stages[idArr[3]];
                    const page = parseInt(idArr[5]);

                    const stageEmbed = await create.rogueStageEmbed(theme, stage, page);
                    await interaction.update(stageEmbed);

                    break;
                }
            }

            break;
        }
        case 'skill': {
            const skill = skillDict[idArr[1]];
            const op = opDict[idArr[2]];
            const level = parseInt(idArr[3]);

            const skillEmbed = create.skillEmbed(skill, op, level);
            await interaction.update(skillEmbed);

            break;
        }
        case 'skin': {
            await interaction.deferUpdate();

            const op = opDict[idArr[1]];
            const page = parseInt(idArr[2]);
            const skinEmbed = create.skinEmbed(op, page);

            await interaction.editReply(skinEmbed);
            break;
        }
        case 'spine': {
            const op = opDict[idArr[1]];
            const type = interaction.values[0];

            await interaction.deferUpdate();
            await interaction.editReply({ content: `Generating \`${type}\` gif...`, components: [] })

            const { page, browser } = await create.spinePage(op, type);

            page.on('console', async message => {
                if (message.text() === 'done') {
                    await new Promise(r => setTimeout(r, 1000));
                    await browser.close();

                    const spineEmbed = await create.spineEmbed(op, type);
                    return await interaction.editReply(spineEmbed);
                }
            }).on('pageerror', async ({ message }) => {
                console.error(message);
                return await interaction.editReply({ content: 'There was an error while generating the animation!' });
            });

            break;
        }
        case 'stage': {
            if (idArr[1] === 'select') {
                const stages = stageDict[idArr[2]];
                const stage = stages[interaction.values[0]];

                const stageEmbed = await create.stageEmbed(stage, 0);
                await interaction.update(stageEmbed);

                break;
            }
            else {
                const stages = idArr[3] === 'true' ? toughStageDict[idArr[1]] : stageDict[idArr[1]];
                const stage = stages[parseInt(idArr[2])];
                const page = parseInt(idArr[4]);

                const stageEmbed = await create.stageEmbed(stage, page);
                await interaction.update(stageEmbed);

                break;
            }
        }
    }
});