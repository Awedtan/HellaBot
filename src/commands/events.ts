import { ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import { buildEventListMessage } from '../utils/build';

export default class EventCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('events')
        .setDescription('Display a list of in-game events');
    name = 'Events';
    description = ['Display a list of in-game events, including start and end dates.'];
    usage = [
        '`/events`'
    ];
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const eventListEmbed = await buildEventListMessage(0);
        return await interaction.editReply(eventListEmbed);
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const index = parseInt(idArr[1]);

        const eventListEmbed = await buildEventListMessage(index);
        await interaction.update(eventListEmbed);
    }
}