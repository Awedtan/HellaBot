import { ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import { buildEventListMessage, buildGachaListMessage } from '../utils/build';

export default class GachaCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('gacha')
        .setDescription('Display a list of gacha banners');
    name = 'Gacha';
    description = ['Display a list of gacha banners, including rate-ups and dates.'];
    usage = [
        '`/gacha`'
    ];
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const gachaListEmbed = await buildGachaListMessage(0);
        return await interaction.editReply(gachaListEmbed);
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const index = parseInt(idArr[1]);

        const eventListEmbed = await buildGachaListMessage(index);
        await interaction.update(eventListEmbed);
    }
}