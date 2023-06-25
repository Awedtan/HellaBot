const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../fetch');
const create = require('../create');

import { Stage } from '../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cc')
        .setDescription('Show information on a CC stage')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Stage name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const name = interaction.options.getString('name').toLowerCase();

        const ccDict = fetch.cc();

        if (!ccDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });

        const stage = ccDict[name];
        if (stage.const === undefined || stage.levels === undefined)
            return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

        const ccEmbed = await create.ccEmbed(stage, 0);
        await interaction.reply(ccEmbed);
    }
}