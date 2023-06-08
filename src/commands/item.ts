const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Item } from '../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('item')
        .setDescription('Show information on an item')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Item name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const itemDict: { [key: string]: Item } = fetch.items();
        const name = interaction.options.getString('name').toLowerCase();

        if (!itemDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That item doesn\'t exist!', ephemeral: true });

        const item = itemDict[name];
        const itemEmbed = await create.itemEmbed(item);
        await interaction.reply(itemEmbed);
    }
}