const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

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
            return await interaction.reply('That enemy doesn\'t exist!');

        const enemy = enemyDict[name];
        const enemyEmbed = create.enemyEmbed(enemy);
        await interaction.reply(enemyEmbed);
    }
}