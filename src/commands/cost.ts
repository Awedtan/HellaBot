const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../fetch');
const create = require('../create');

import { Operator } from "../types";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cost')
        .setDescription('Show an operator\'s elite, skill, mastery, and module level costs')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Cost type')
                .addChoices(
                    { name: 'promotions', value: 'elite' },
                    { name: 'skills', value: 'skill' },
                    { name: 'masteries', value: 'mastery' },
                    { name: 'modules', value: 'module' }
                )
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetch.operators();
        const name = interaction.options.getString('name').toLowerCase();
        const type = interaction.options.getString('type');

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const op = operatorDict[name];

        if (op.data.rarity <= 1)
            return await interaction.reply({ content: 'That operator has no upgrades!', ephemeral: true });

        const costEmbed = create.costEmbed(op, type);
        await interaction.reply(costEmbed);
    }
}