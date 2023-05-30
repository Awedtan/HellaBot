const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Definition } from "../types";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('define')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('term')
                .setDescription('term')
                .setRequired(true)
        ),
    async execute(interaction) {
        const term = interaction.options.getString('term').toLowerCase();

        if (term === 'list') {
            const defineListEmbed = create.defineListEmbed();
            await interaction.reply(defineListEmbed);
        }
        else {
            const defineDict: { [key: string]: Definition } = fetch.definitions();

            if (!defineDict.hasOwnProperty(term))
                return await interaction.reply('That term doesn\'t exist!');

            const definition = defineDict[term];
            const defineEmbed = create.defineEmbed(definition);
            await interaction.reply(defineEmbed);
        }
    }
}