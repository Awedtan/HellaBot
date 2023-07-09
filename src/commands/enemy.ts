const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../data');
const create = require('../create');

import { Enemy } from '../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enemy')
        .setDescription('Show an enemy\'s information and abilities')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Enemy name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const enemyDict: { [key: string]: Enemy } = fetch.enemies();
        const name = interaction.options.getString('name').toLowerCase();

        if (!enemyDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That enemy doesn\'t exist!', ephemeral: true });

        const enemy = enemyDict[name];
        const enemyEmbed = create.enemyEmbed(enemy, 0);
        await interaction.reply(enemyEmbed);
    }
}