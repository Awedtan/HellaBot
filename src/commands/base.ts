import { SlashCommandBuilder } from 'discord.js';
import { baseDict, operatorDict } from '../data';
import { buildBaseEmbed, operatorAutocomplete } from '../utils';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('base')
        .setDescription('Show an operator\'s base skills')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async autocomplete(interaction) {
        const value = interaction.options.getFocused().toLowerCase();
        const callback = op => op.bases.length !== 0;
        const arr = operatorAutocomplete(value, callback);

        await interaction.respond(arr);
    },
    async execute(interaction) {
        const name = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const op = operatorDict[name];

        if (op.bases.length === 0)
            return await interaction.reply({ content: 'That operator doesn\'t have any base skills!', ephemeral: true });

        let first = true;

        for (const baseInfo of op.bases) {
            const base = baseDict[baseInfo.buffId];

            if (first) {
                const baseEmbed = buildBaseEmbed(base, baseInfo, op);
                await interaction.reply(baseEmbed);
                first = false;
            }
            else {
                const baseEmbed = buildBaseEmbed(base, baseInfo, op);
                await interaction.followUp(baseEmbed);
            }
        }
    }
}