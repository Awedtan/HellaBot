import { SlashCommandBuilder } from 'discord.js';
import { buildRecruitEmbed } from '../utils';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recruit')
        .setDescription('Find recruitable operators using selected tags')
        .addStringOption(option =>
            option.setName('qualification')
                .setDescription('Qualification tag')
                .addChoices(
                    { name: 'starter', value: 'starter' },
                    { name: 'senior', value: 'senior' },
                    { name: 'top', value: 'top' }
                )
        ),
    async execute(interaction) {
        const qual = interaction.options.getString('qualification');
        const recruitEmbed = buildRecruitEmbed(qual, 1, '', true);

        await interaction.reply(recruitEmbed);
    }
}