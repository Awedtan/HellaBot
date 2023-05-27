const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Enemy } from '../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enemy')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const enemyDict: { [key: string]: Enemy } = fetch.enemies();
        const enemyName = interaction.options.getString('name').toLowerCase();

        if (!enemyDict.hasOwnProperty(enemyName))
            return await interaction.reply('That enemy doesn\'t exist!');

        const enemy = enemyDict[enemyName];
        const enemyEmbed = create.enemyEmbed(enemy);
        await interaction.reply(enemyEmbed);
    }
}