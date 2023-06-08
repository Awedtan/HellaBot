const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Operator } from '../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Show an operator\'s information and attributes')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetch.operators();
        const name = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const operator = operatorDict[name];
        const operatorEmbed = create.infoEmbed(operator, 0, 0, 0);
        await interaction.reply(operatorEmbed);
    }
}