const { SlashCommandBuilder } = require('discord.js');
const { fetchEnemies } = require('../utils/fetchData');
const create = require('../utils/create');

import { Enemy } from '../utils/types';

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
        const enemyDict: { [key: string]: Enemy } = fetchEnemies();
        const enemyName = interaction.options.getString('name').toLowerCase();

        if (enemyDict.hasOwnProperty(enemyName)) {
            const enemy = enemyDict[enemyName];
            const enemyEmbed = create.enemyEmbed(enemy);
            await interaction.reply(enemyEmbed);
        }
        else {
            await interaction.reply('That enemy doesn\'t exist!');
        }
    }
}