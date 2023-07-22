import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { buildRecruitMessage } from '../utils/build';

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
        const recruitEmbed = await buildRecruitMessage(qual, 1, '', true);

        return await interaction.reply(recruitEmbed);
    }
}