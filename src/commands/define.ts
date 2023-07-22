import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { definitionDict } from '../data';
import { Command } from '../structures/Command';
import { defineAutocomplete } from '../utils/autocomplete';
import { buildDefineListMessage, buildDefineMessage } from '../utils/build';
import { getDefinition } from '../api';

export default class DefineCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('define')
        .setDescription('Show definitions for in-game terms (use \'list\' to display all in-game terms)')
        .addStringOption(option =>
            option.setName('term')
                .setDescription('Term')
                .setRequired(true)
                .setAutocomplete(true)
        );
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = defineAutocomplete(value);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const term = interaction.options.getString('term').toLowerCase();

        if (term === 'list') {
            await interaction.deferReply();

            const defineListEmbed = await buildDefineListMessage();
            return await interaction.editReply(defineListEmbed);
        }
        else {
            if (!definitionDict.hasOwnProperty(term))
                return await interaction.reply({ content: 'That term doesn\'t exist!', ephemeral: true });

            await interaction.deferReply();

            const definition = await getDefinition(term);

            const defineEmbed = await buildDefineMessage(definition);
            return await interaction.editReply(defineEmbed);
        }
    }
}