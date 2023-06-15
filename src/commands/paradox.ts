const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../fetch');
const create = require('../create');

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
        const operatorDict: { [key: string]: Operator } = fetch.operators();
        const paradoxDict: { [key: string]: Paradox } = fetch.paradoxes();
        const name = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const op = operatorDict[name];

        if (!paradoxDict.hasOwnProperty(op.id))
            return await interaction.reply({ content: 'That operator doesn\'t have a paradox simulation!', ephemeral: true });

        const paradox = paradoxDict[op.id];
        const paradoxEmbed = await create.paradoxEmbed(paradox, 0);

        await interaction.reply(paradoxEmbed);
    }
}