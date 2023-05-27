const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Operator } from '../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetch.operators();
        const operatorName = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(operatorName))
            return await interaction.reply('That operator doesn\'t exist!');

        const operator = operatorDict[operatorName];
        const operatorEmbed = create.infoEmbed(operator, 0, 0, 0);
        await interaction.reply(operatorEmbed);
    }
}