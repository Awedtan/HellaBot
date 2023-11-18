import { ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { buildRecruitMessage } from '../utils/Build';

export default class RecruitCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('recruit')
        .setDescription('Find recruitable operators from recruitment tags')
        .addStringOption(option =>
            option.setName('qualification')
                .setDescription('Qualification tag')
                .addChoices(
                    { name: 'starter', value: 'starter' },
                    { name: 'senior', value: 'senior' },
                    { name: 'top', value: 'top' }
                )
        );
    async execute(interaction: ChatInputCommandInteraction) {
        const qual = interaction.options.getString('qualification');

        await interaction.deferReply();

        const recruitEmbed = await buildRecruitMessage(qual, 1, '', true);
        return await interaction.editReply(recruitEmbed);
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const qual = idArr[1];
        const value = parseInt(idArr[2]);
        const tag = idArr[3];
        const select = idArr[4] === 'select';

        const recruitEmbed = await buildRecruitMessage(qual, value, tag, select);
        await interaction.editReply(recruitEmbed);
    }
}