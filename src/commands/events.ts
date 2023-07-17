import { SlashCommandBuilder } from 'discord.js';
import { buildEventListMessage } from '../utils';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('events')
        .setDescription('Display a list of in-game events'),
    async execute(interaction) {
        const eventListEmbed = buildEventListMessage(0);
        await interaction.reply(eventListEmbed);
    }
}