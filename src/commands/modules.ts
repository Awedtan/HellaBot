const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Module, Operator } from "../types";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modules')
        .setDescription('Show an operator\'s modules')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetch.operators();
        const moduleDict: { [key: string]: Module } = fetch.modules();
        const operatorName = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(operatorName))
            return await interaction.reply('That operator doesn\'t exist!');

        const op = operatorDict[operatorName];

        if (op.modules.length === 0)
            return await interaction.reply('That operator doesn\'t have any modules!');

        let first = true;

        for (const moduleId of op.modules) {
            if (moduleId.indexOf('uniequip_001') === 0) continue;

            const module = moduleDict[moduleId];

            if (first) {
                const moduleEmbed = create.moduleEmbed(module, op, 0);
                await interaction.reply(moduleEmbed);
                first = false;
            }
            else {
                const moduleEmbed = create.moduleEmbed(module, op, 0);
                await interaction.followUp(moduleEmbed);
            }
        }
    }
}