const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../fetch');
const create = require('../create');

import { Definition } from "../types";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('define')
        .setDescription('Show the definition for in-game terms (use \'list\' to display all in-game terms)')
        .addStringOption(option =>
            option.setName('term')
                .setDescription('Term')
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
                return await interaction.reply({ content: 'That term doesn\'t exist!', ephemeral: true });

            const definition = defineDict[term];
            const defineEmbed = create.defineEmbed(definition);
            await interaction.reply(defineEmbed);
        }
    }
}