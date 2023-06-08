const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Item, Operator } from "../types";

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
                    { name: 'elite', value: 'elite' },
                    { name: 'skill', value: 'skill' },
                    { name: 'mastery', value: 'mastery' },
                    { name: 'module', value: 'module' }
                )
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetch.operators();
        const name = interaction.options.getString('name').toLowerCase();
        const type = interaction.options.getString('type');

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply('That operator doesn\'t exist!');

        const op = operatorDict[name];
        
        const costEmbed = create.costEmbed(op, type);
        await interaction.reply(costEmbed);
    }
}