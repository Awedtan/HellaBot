import { ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import { buildCurrentMessage } from '../utils/build';

export default class CurrentCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('current')
        .setDescription('Show what\'s currently happening in the game');
    name = 'Current';
    description = ['Show what\'s currently happening in the game, including active events and banners.'];
    usage = [
        '`/current`'
    ];
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const currentEmbed = await buildCurrentMessage();
        return await interaction.editReply(currentEmbed);
    }
}