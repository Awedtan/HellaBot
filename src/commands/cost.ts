import { SlashCommandBuilder } from 'discord.js';
import { operatorDict, } from '../data';
import { buildCostEmbed, operatorAutocomplete } from '../utils';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cost')
        .setDescription('Show an operator\'s elite, skill, mastery, and module level costs')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Cost type')
                .addChoices(
                    { name: 'promotions', value: 'elite' },
                    { name: 'skills', value: 'skill' },
                    { name: 'masteries', value: 'mastery' },
                    { name: 'modules', value: 'module' }
                )
        ),
    async autocomplete(interaction) {
        const value = interaction.options.getFocused().toLowerCase();
        const callback = op => op.data.rarity > 1;
        const arr = operatorAutocomplete(value, callback);
        await interaction.respond(arr);
    },
    async execute(interaction) {
        const name = interaction.options.getString('name').toLowerCase();
        const type = interaction.options.getString('type');

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const op = operatorDict[name];

        if (op.data.rarity <= 1)
            return await interaction.reply({ content: 'That operator has no upgrades!', ephemeral: true });

        const costEmbed = buildCostEmbed(op, type);
        await interaction.reply(costEmbed);
    }
}