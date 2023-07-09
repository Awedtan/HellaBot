import { SlashCommandBuilder } from 'discord.js';
import { operatorDict, paradoxDict } from '../data';
const create = require('../create');

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