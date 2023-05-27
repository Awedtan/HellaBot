const { SlashCommandBuilder } = require('discord.js');
const { fetchModules, fetchOperators } = require('../utils/fetchData');
const wait = require('timers/promises').setTimeout;
const create = require('../utils/create');

import { Module, Operator } from "../utils/types";

const levelId: { [key: string]: number } = { l1: 0, l2: 1, l3: 2 };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modules')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetchOperators();
        const moduleDict: { [key: string]: Module } = fetchModules();
        const operatorName = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(operatorName))
            return await interaction.reply('That operator doesn\'t exist!');

        const op = operatorDict[operatorName];

        if (op.modules.length === 0)
            return await interaction.reply('That operator doesn\'t have any modules!');

        let first = true;

        for (const moduleId of op.modules) {
            if (moduleId.indexOf('uniequip_001') != -1) continue;

            const module = moduleDict[moduleId];

            if (first) {
                replyModuleEmbed(interaction, module, op);
                first = false;
            }
            else {
                sendModuleEmbed(interaction.channel, module, op);
            }
            await wait(200);
        }
    }
}

async function replyModuleEmbed(interaction, module: Module, operator: Operator) {
    let level = 0;
    let moduleEmbed = create.moduleEmbed(module, level, operator);
    let response = await interaction.reply(moduleEmbed);

    while (true) {
        try {
            const confirm = await response.awaitMessageComponent({ time: 300000 });

            try {
                await confirm.update({ content: '' });
            } catch (e) {
                continue;
            }

            level = levelId[confirm.customId];
            moduleEmbed = create.moduleEmbed(module, level, operator);
            response = await response.edit(moduleEmbed);
        } catch (e) {
            console.error(e);
            await response.edit({ embeds: moduleEmbed.embeds, files: moduleEmbed.files, components: [] });
            break;
        }
    }
}

async function sendModuleEmbed(channel, module: Module, operator: Operator) {
    let level = 0;
    let moduleEmbed = create.moduleEmbed(module, level, operator);
    let response = await channel.send(moduleEmbed);

    while (true) {
        try {
            const confirm = await response.awaitMessageComponent({ time: 300000 });

            try {
                await confirm.update({ content: '' });
            } catch (e) {
                continue;
            }

            level = levelId[confirm.customId];
            moduleEmbed = create.moduleEmbed(module, level, operator);
            response = await response.edit(moduleEmbed);
        } catch (e) {
            console.error(e);
            await response.edit({ embeds: moduleEmbed.embeds, files: moduleEmbed.files, components: [] });
            break;
        }
    }
}