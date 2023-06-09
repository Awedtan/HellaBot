import { SlashCommandBuilder } from 'discord.js';
import { enemyDict } from '../data';
import { buildEnemyEmbed } from '../utils';

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
        const name = interaction.options.getString('name').toLowerCase();

        if (!enemyDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That enemy doesn\'t exist!', ephemeral: true });

        const enemy = enemyDict[name];
        const enemyEmbed = buildEnemyEmbed(enemy, 0);
        await interaction.reply(enemyEmbed);
    }
}