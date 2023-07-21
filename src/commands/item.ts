import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { itemDict } from '../data';
import { Command } from '../structures/Command';
import { itemAutocomplete } from '../utils/autocomplete';
import { buildItemMessage } from '../utils/build';
import { getItem } from '../api';

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
        const arr = itemAutocomplete(value);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();

        if (!itemDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That item doesn\'t exist!', ephemeral: true });

        // const item = itemDict[name];
        const item = await getItem(name);

        const itemEmbed = await buildItemMessage(item);
        return await interaction.reply(itemEmbed);
    }
}