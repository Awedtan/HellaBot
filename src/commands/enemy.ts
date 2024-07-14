import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteEnemy } from '../utils/autocomplete';
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
        ) as SlashCommandBuilder;
    name = 'Enemy';
    description = ['Show an enemy\'s description, abilities, stats, and immunities.'];
    usage = [
        '`/enemy [enemy]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = await autocompleteEnemy({ query: value });
        return await interaction.respond(arr);
    };
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const enemy = await api.single('enemy', { query: name });

        if (!enemy)
            return await interaction.reply({ content: 'That enemy doesn\'t exist!', ephemeral: true });

        await interaction.deferReply();

        const enemyEmbed = await buildEnemyMessage(enemy, 0);
        return await interaction.editReply(enemyEmbed);
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const enemy = await api.single('enemy', { query: idArr[1] });
        const level = parseInt(idArr[2]);

        const enemyEmbed = await buildEnemyMessage(enemy, level);
        await interaction.update(enemyEmbed);
    }
}