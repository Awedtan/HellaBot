import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { Operator } from '../types';
import { getOperator } from '../utils/api';
import { operatorAutocomplete } from '../utils/autocomplete';
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
        );
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const callback = (op: Operator) => op.skins.length !== 0;
        const arr = await operatorAutocomplete({ query: value, include: ['data.name', 'skins.skinId'] }, callback);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const op = await getOperator({ query: name });

        if (!op)
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });
        if (!op.skins || op.skins.length === 0)
            return await interaction.reply({ content: 'That operator doesn\'t have any artwork!', ephemeral: true });

        await interaction.deferReply();

        const skinEmbed = await buildArtMessage(op, 0);
        return await interaction.editReply(skinEmbed);
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const op = await getOperator({ query: idArr[1] });
        const page = parseInt(idArr[2]);
        const skinEmbed = await buildArtMessage(op, page);

        await interaction.editReply(skinEmbed);
    }
}