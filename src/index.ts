const fs = require('fs');
const path = require('path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('../config.json');
const create = require('./utils/create');
const fetch = require('./utils/fetch');

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

import { Module, Operator, RogueTheme, Skill, Stage } from "./types";

const moduleDict: { [key: string]: Module } = fetch.modules();
const opDict: { [key: string]: Operator } = fetch.operators();
const rogueArr: RogueTheme = fetch.rogueThemes();
const skillDict: { [key: string]: Skill } = fetch.skills();
const stageDict: { [key: string]: Stage[] } = fetch.stages();

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    const idArr: string[] = interaction.customId.split('ඞ');

    switch (idArr[0]) {
        case 'info': {
            const op = opDict[idArr[1]];
            const type = parseInt(idArr[2]);
            const page = parseInt(idArr[3]);
            const level = parseInt(idArr[4]);

            const infoEmbed = create.infoEmbed(op, type, page, level);
            await interaction.update(infoEmbed);

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
            }

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
        case 'recruit': {
            const qual = idArr[1];
            const value = parseInt(idArr[2]);
            const tag = idArr[3];
            const select = idArr[4] === 'select';

            const recruitEmbed = create.recruitEmbed(qual, value, tag, select);
            await interaction.update(recruitEmbed);

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
            const op = opDict[idArr[1]];
            const page = parseInt(idArr[2]);

            const skinEmbed = create.skinEmbed(op, page);
            await interaction.update(skinEmbed);

            break;
        }
        case 'stage': {
            const stages = stageDict[idArr[1]];
            const stage = stages[interaction.values[0]];

            const stageEmbed = await create.stageEmbed(stage);
            await interaction.update(stageEmbed);

            break;
        }
    }
});