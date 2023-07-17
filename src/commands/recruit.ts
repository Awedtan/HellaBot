import { SlashCommandBuilder } from 'discord.js';
import { buildRecruitMessage } from '../utils';

module.exports = {
    data: new SlashCommandBuilder()
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
        ),
    async execute(interaction) {
        const qual = interaction.options.getString('qualification');
        const recruitEmbed = buildRecruitMessage(qual, 1, '', true);

        await interaction.reply(recruitEmbed);
    }
}