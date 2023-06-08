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
        const name = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const op = operatorDict[name];

        if (op.modules.length === 0)
            return await interaction.reply({ content: 'That operator doesn\'t have any modules!', ephemeral: true });

        let first = true;

        for (const moduleId of op.modules) {
            if (moduleId.includes('uniequip_001')) continue;

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