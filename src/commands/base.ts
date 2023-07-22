import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getBase, getOperator } from '../api';
import { Command } from '../structures/Command';
import { operatorAutocomplete } from '../utils/autocomplete';
import { buildBaseMessage } from '../utils/build';

export default class BaseCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('base')
        .setDescription('Show an operator\'s base skills')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        );
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const callback = op => op.bases.length !== 0;
        const arr = operatorAutocomplete(value, callback);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const op = await getOperator(name);

        if (!op)
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });
        if (op.bases.length === 0)
            return await interaction.reply({ content: 'That operator doesn\'t have any base skills!', ephemeral: true });

        await interaction.deferReply();

        let first = true;

        for (const baseInfo of op.bases) {
            const base = await getBase(baseInfo.buffId);

            if (first) {
                const baseEmbed = await buildBaseMessage(base, baseInfo, op);
                await interaction.editReply(baseEmbed);
                first = false;
            }
            else {
                const baseEmbed = await buildBaseMessage(base, baseInfo, op);
                await interaction.followUp(baseEmbed);
            }
        }
    }
}