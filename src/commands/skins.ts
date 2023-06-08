const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Operator, Skin } from "../types";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skins')
        .setDescription('Show an operator\'s skins')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetch.operators();
        const skinDict: { [key: string]: Skin[] } = fetch.skins();
        const name = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply('That operator doesn\'t exist!');

        const op = operatorDict[name];

        if (!skinDict.hasOwnProperty(op.id))
            return await interaction.reply('That operator doesn\'t have any skins!');

        const skinEmbed = create.skinEmbed(op, 0);
        await interaction.reply(skinEmbed);
    }
}