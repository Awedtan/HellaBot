import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { buildEventListMessage } from '../utils';

export default {
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription('Display a list of in-game events'),
    async execute(interaction: ChatInputCommandInteraction) {
        const eventListEmbed = buildEventListMessage(0);
        await interaction.reply(eventListEmbed);
    }
}