import { ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { buildEventListMessage } from '../utils/Build';

export default class EventCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('events')
        .setDescription('Display a list of in-game events');
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const eventListEmbed = await buildEventListMessage(0);
        return await interaction.editReply(eventListEmbed);
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const index = parseInt(idArr[1]);

        const eventListEmbed = await buildEventListMessage(index);
        await interaction.editReply(eventListEmbed);
    }
}