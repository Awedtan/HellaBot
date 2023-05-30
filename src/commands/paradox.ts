const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Operator, Paradox } from '../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('paradox')
        .setDescription('Show an operator\'s Paradox Simulation stage')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const name = interaction.options.getString('name').toLowerCase();
        const operatorDict: { [key: string]: Operator } = fetch.operators();
        const paradoxDict: { [key: string]: Paradox } = fetch.paradoxes();

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