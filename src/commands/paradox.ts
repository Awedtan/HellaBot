import { SlashCommandBuilder } from 'discord.js';
import { operatorDict, paradoxDict } from '../data';
import { buildParadoxMessage, operatorAutocomplete } from '../utils';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('paradox')
        .setDescription('Show an operator\'s Paradox Simulation stage')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async autocomplete(interaction) {
        const value = interaction.options.getFocused().toLowerCase();
        const callback = op => paradoxDict.hasOwnProperty(op.id);
        const arr = operatorAutocomplete(value, callback);
        await interaction.respond(arr);
    },
    async execute(interaction) {
        const name = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const op = operatorDict[name];

        if (!paradoxDict.hasOwnProperty(op.id))
            return await interaction.reply({ content: 'That operator doesn\'t have a paradox simulation!', ephemeral: true });

        const paradox = paradoxDict[op.id];
        const paradoxEmbed = await buildParadoxMessage(paradox, 0);

        await interaction.reply(paradoxEmbed);
    }
}