import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getOperator, getSkinArr } from '../api';
import { skinDict } from '../data';
import { Command } from '../structures/Command';
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
        const callback = op => skinDict.hasOwnProperty(op.id);
        // const callback = async op => await getSkinArr(op.id);
        const arr = operatorAutocomplete(value, callback);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const op = await getOperator(name);

        if (!op)
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const skins = await getSkinArr(op.id);

        if (!skins)
            return await interaction.reply({ content: 'That operator doesn\'t have any artwork!', ephemeral: true });

        await interaction.deferReply();

        const skinEmbed = await buildArtMessage(op, 0);
        return await interaction.editReply(skinEmbed);
    }
}