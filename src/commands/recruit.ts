const { SlashCommandBuilder } = require('discord.js');
const create = require('../utils/create');

import { } from "../types";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recruit')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('qualification')
                .setDescription('qualification')
                .addChoices(
                    { name: 'starter', value: 'starter' },
                    { name: 'senior', value: 'senior' },
                    { name: 'top', value: 'top' }
                )
        ),
    async execute(interaction) {
        const qual = interaction.options.getString('qualification');
        const recruitEmbed = create.recruitEmbed(qual, 1, '', true);

        await interaction.reply(recruitEmbed);
    }
}