import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { getCcStage } from '../utils/api';
import { buildCcMessage, buildCcSelectMessage } from '../utils/build';

export default class CcCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('cc')
        .setDescription('Show information on a CC stage or season')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Stage name/season number')
                .setRequired(true)
        );
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const stage = await getCcStage({ query: name });

        if (!stage) {
            const { gameConsts } = require('../constants');
            const ccSeasons: { [key: string]: string[] } = gameConsts.ccSeasons;
            if (!ccSeasons.hasOwnProperty(name))
                return await interaction.reply({ content: 'That stage/season doesn\'t exist!', ephemeral: true });
            else {
                await interaction.deferReply();

                const ccSelectEmbed = await buildCcSelectMessage(name);
                return await interaction.editReply(ccSelectEmbed);
            }
        }

        if (stage.const === undefined || stage.levels === undefined)
            return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

        await interaction.deferReply();

        const ccEmbed = await buildCcMessage(stage, 0);
        return await interaction.editReply(ccEmbed);
    }
}