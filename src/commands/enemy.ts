import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getEnemy } from '../api';
import { Command } from '../structures/Command';
import { enemyAutocomplete } from '../utils/autocomplete';
import { buildEnemyMessage } from '../utils/build';

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
        const arr = await enemyAutocomplete(value);
        return await interaction.respond(arr);
    };
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const enemy = await getEnemy(name);

        if (!enemy)
            return await interaction.reply({ content: 'That enemy doesn\'t exist!', ephemeral: true });

        await interaction.deferReply();

        const enemyEmbed = await buildEnemyMessage(enemy, 0);
        return await interaction.editReply(enemyEmbed);
    }
}