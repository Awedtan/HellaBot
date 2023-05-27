const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Operator, Skin } from "../types";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skins')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetch.operators();
        const skinDict: { [key: string]: Skin[] } = fetch.skins();
        const operatorName = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(operatorName))
            return await interaction.reply('That operator doesn\'t exist!');

        const op = operatorDict[operatorName];

        if (!skinDict.hasOwnProperty(op.id))
            return await interaction.reply('That operator doesn\'t have any skins!');

        const skinEmbed = create.skinEmbed(op, 0);
        await interaction.reply(skinEmbed);
    }
}