import { SlashCommandBuilder } from 'discord.js';
import { definitionDict } from '../data';
import { buildDefineEmbed, buildDefineListEmbed } from '../utils';

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
            const defineListEmbed = buildDefineListEmbed();
            await interaction.reply(defineListEmbed);
        }
        else {
            if (!definitionDict.hasOwnProperty(term))
                return await interaction.reply({ content: 'That term doesn\'t exist!', ephemeral: true });

            const definition = definitionDict[term];
            const defineEmbed = buildDefineEmbed(definition);
            await interaction.reply(defineEmbed);
        }
    }
}