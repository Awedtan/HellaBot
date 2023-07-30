import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { getItem } from '../utils/Api';
import { itemAutocomplete } from '../utils/Autocomplete';
import { buildItemMessage } from '../utils/Build';

export default class ItemCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('item')
        .setDescription('Show information on an item')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Item name')
                .setRequired(true)
                .setAutocomplete(true)
        );
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = await itemAutocomplete({ query: value, include: ['data.name'] });
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const item = await getItem({ query: name });

        if (!item)
            return await interaction.reply({ content: 'That item doesn\'t exist!', ephemeral: true });

        await interaction.deferReply();

        const itemEmbed = await buildItemMessage(item);
        return await interaction.editReply(itemEmbed);
    }
}