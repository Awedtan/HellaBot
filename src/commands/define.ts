import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteDefine } from '../utils/autocomplete';
import { buildDefineListMessage, buildDefineMessage } from '../utils/build';
import { Definition } from '../utils/canon';

export default class DefineCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('define')
        .setDescription('Show the definition for an in-game term')
        .addStringOption(option =>
            option.setName('term')
                .setDescription('Term')
                .setRequired(true)
                .setAutocomplete(true)
        ) as SlashCommandBuilder;
    name = 'Define';
    description = ['Show the definition for an in-game term.'];
    usage = [
        '`/define [term]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = await autocompleteDefine({ query: value });
        arr.push({ name: 'List All', value: 'list' });
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
            const definition = await api.single('define', { query: term });

            if (!Definition.isValid(definition))
                return await interaction.reply({ content: 'That term doesn\'t exist!', ephemeral: true });

            await interaction.deferReply();

            const defineEmbed = await buildDefineMessage(definition);
            return await interaction.editReply(defineEmbed);
        }
    }
}