import { SlashCommandBuilder } from 'discord.js';
import { operatorDict } from '../data';
import { buildInfoEmbed, operatorAutocomplete } from '../utils';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Show an operator\'s information and attributes')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async autocomplete(interaction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = operatorAutocomplete(value);

        await interaction.respond(arr);
    },
    async execute(interaction) {
        const name = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const operator = operatorDict[name];
        const operatorEmbed = buildInfoEmbed(operator, 0, 0, 0);
        await interaction.reply(operatorEmbed);
    }
}