const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const utils = require('../utils/utils');

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
        const defineDict: { [key: string]: Definition } = fetch.definitions();
        const term = interaction.options.getString('term').toLowerCase();

        if (term === 'list') {
            let baDescription = '', ccDescription = '', groupDescription = '';
            for (const term of Object.values(defineDict)) {
                const termId = term.termId;
                const termName = term.termName;
                const termArr = termId.split('.');

                switch (termArr[0]) {
                    case 'ba':
                        baDescription += `${termName}\n`;
                        break;
                    case 'cc':
                        switch (termArr[1]) {
                            case ('g'):
                            case ('tag'):
                            case ('gvial'):
                                groupDescription += `${termName}\n`;
                                break;
                            default:
                                ccDescription += `${termName}\n`;
                                break;
                        }
                        break;
                }
            }

            const embed = new EmbedBuilder()
                .setColor(0xebca60)
                .setTitle('List of In-Game Terms and Groups')
                .addFields(
                    { name: 'Status Effects', value: baDescription, inline: true },
                    { name: 'Base Effects', value: ccDescription, inline: true },
                    { name: 'Base Groups', value: groupDescription, inline: true }
                );

            return await interaction.reply({ embeds: [embed] });
        }

        if (!defineDict.hasOwnProperty(term))
            return await interaction.reply('That term doesn\'t exist!');

        const definition = defineDict[term];

        const embed = new EmbedBuilder()
            .setColor(0xebca60)
            .setTitle(definition.termName)
            .setDescription(utils.formatText(definition.description));

        await interaction.reply({ embeds: [embed] });
    }
}