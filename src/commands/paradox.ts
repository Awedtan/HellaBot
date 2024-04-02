import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Operator } from 'hella-types';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteOperator } from '../utils/autocomplete';
import { buildParadoxMessage } from '../utils/build';

export default class ParadoxCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('paradox')
        .setDescription('Show an operator\'s Paradox Simulation stage')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        ) as SlashCommandBuilder;
    name = 'Paradox';
    description = ['Show the enemy list, image preview, and stage diagram for an operator\'s Paradox Simulation stage.'];
    usage = [
        '`/paradox [operator]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const callback = (op: Operator) => !!op.paradox; // !! gets truth value
        const arr = await autocompleteOperator({ query: value, include: ['paradox.excel.charId'] }, callback);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const op = await api.single('operator', { query: name });

        if (!op)
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });
        if (!op.paradox)
            return await interaction.reply({ content: 'That operator doesn\'t have a paradox simulation!', ephemeral: true });

        await interaction.deferReply();

        const paradoxEmbed = await buildParadoxMessage(op.paradox, 0);
        return await interaction.editReply(paradoxEmbed);
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const op = await api.single('operator', { query: idArr[1] });
        const paradox = await api.single('paradox', { query: op.id });
        const page = parseInt(idArr[2]);

        const paradoxEmbed = await buildParadoxMessage(paradox, page);
        await interaction.editReply(paradoxEmbed);
    }
}