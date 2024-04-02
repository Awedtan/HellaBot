import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Operator } from 'hella-types';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteOperator } from '../utils/autocomplete';
import { buildArtMessage } from '../utils/build';

export default class ArtCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('art')
        .setDescription('Show an operator\'s artworks')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        ) as SlashCommandBuilder;
    name = 'Art';
    description = ['Show an operator\'s artworks and artist(s), including default and alternate outfits.'];
    usage = [
        '`/art [operator]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const callback = (op: Operator) => op.skins.length !== 0;
        const arr = await autocompleteOperator({ query: value, include: ['skins.skinId'] }, callback);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const op = await api.single('operator', { query: name });

        if (!op)
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });
        if (!op.skins || op.skins.length === 0)
            return await interaction.reply({ content: 'That operator doesn\'t have any artwork!', ephemeral: true });

        await interaction.deferReply();

        const skinEmbed = await buildArtMessage(op, 0);
        return await interaction.editReply(skinEmbed);
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const op = await api.single('operator', { query: idArr[1] });
        const page = parseInt(idArr[2]);
        const skinEmbed = await buildArtMessage(op, page);

        await interaction.editReply(skinEmbed);
    }
}