import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { enemyDict } from '../data';
import { Command } from '../structures/Command';
import { enemyAutocomplete } from '../utils/autocomplete';
import { buildEnemyMessage } from '../utils/build';
import { getEnemy } from '../api';

export default class EnemyCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('enemy')
        .setDescription('Show an enemy\'s information and abilities')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Enemy name')
                .setRequired(true)
                .setAutocomplete(true)
        );
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = enemyAutocomplete(value);
        return await interaction.respond(arr);
    };
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();

        if (!enemyDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That enemy doesn\'t exist!', ephemeral: true });

        // const enemy = enemyDict[name];
        const enemy = await getEnemy(name);

        const enemyEmbed = buildEnemyMessage(enemy, 0);
        return await interaction.reply(enemyEmbed);
    }
}