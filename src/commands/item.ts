import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteItem } from '../utils/autocomplete';
import { buildItemMessage } from '../utils/build';
import { Item } from '../utils/canon';

export default class ItemCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('item')
        .setDescription('Show information on an item')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Item name')
                .setRequired(true)
                .setAutocomplete(true)
        ) as SlashCommandBuilder;
    name = 'Item';
    description = ['Show an item\'s description, crafting recipe, and droppable stages.'];
    usage = [
        '`/item [item]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = await autocompleteItem({ query: value });
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const item = await api.single('item', { query: name });

        if (!Item.isValid(item))
            return await interaction.reply({ content: 'That item doesn\'t exist!', ephemeral: true });

        await interaction.deferReply();

        const itemEmbed = await buildItemMessage(item);
        return await interaction.editReply(itemEmbed);
    }
}