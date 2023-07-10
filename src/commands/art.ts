import { SlashCommandBuilder } from 'discord.js';
import { operatorDict, skinDict } from '../data';
import { buildSkinEmbed, operatorAutocomplete } from '../utils';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('art')
        .setDescription('Show an operator\'s artwork')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async autocomplete(interaction) {
        const value = interaction.options.getFocused().toLowerCase();
        const callback = op => skinDict.hasOwnProperty(op.id);
        const arr = operatorAutocomplete(value, callback);

        await interaction.respond(arr);
    },
    async execute(interaction) {
        const name = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const op = operatorDict[name];

        if (!skinDict.hasOwnProperty(op.id))
            return await interaction.reply({ content: 'That operator doesn\'t have any artwork!', ephemeral: true });

        const skinEmbed = buildSkinEmbed(op, 0);
        await interaction.reply(skinEmbed);
    }
}