import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { enemyDict } from '../data';
import { buildEnemyMessage, enemyAutocomplete } from '../utils';

export default {
    data: new SlashCommandBuilder()
        .setName('enemy')
        .setDescription('Show an enemy\'s information and abilities')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Enemy name')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = enemyAutocomplete(value);
        await interaction.respond(arr);
    },
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();

        if (!enemyDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That enemy doesn\'t exist!', ephemeral: true });

        const enemy = enemyDict[name];
        const enemyEmbed = buildEnemyMessage(enemy, 0);
        await interaction.reply(enemyEmbed);
    }
}