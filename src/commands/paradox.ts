const { SlashCommandBuilder } = require('discord.js');
const { fetchOperators, fetchParadoxes } = require('../utils/fetch');
const create = require('../utils/create');

import { Operator, Paradox } from '../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('paradox')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const name = interaction.options.getString('name').toLowerCase();
        const operatorDict: { [key: string]: Operator } = fetchOperators();
        const paradoxDict: { [key: string]: Paradox } = fetchParadoxes();

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply('That operator doesn\'t exist!');

        const op = operatorDict[name];

        if (!paradoxDict.hasOwnProperty(op.id))
            return await interaction.reply('That operator doesn\'t have a paradox simulation!');

        const paradox = paradoxDict[op.id];
        const paradoxEmbed = await create.paradoxEmbed(paradox);
        
        await interaction.reply(paradoxEmbed);
    }
}