import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { buildEventListMessage } from '../utils/build';

export default class EventCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('events')
        .setDescription('Display a list of in-game events');
    async execute(interaction: ChatInputCommandInteraction) {
        const eventListEmbed = buildEventListMessage(0);
        return await interaction.reply(eventListEmbed);
    }
}