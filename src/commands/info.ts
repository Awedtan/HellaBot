import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { operatorDict } from '../data';
import { buildInfoMessage, operatorAutocomplete } from '../utils';

export default {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Show an operator\'s information and attributes')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = operatorAutocomplete(value);
        await interaction.respond(arr);
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const operator = operatorDict[name];
        const operatorEmbed = buildInfoMessage(operator, 0, 0, 0);
        await interaction.reply(operatorEmbed);
    }
}