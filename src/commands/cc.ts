import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { ccDict } from '../data';
import { Command } from '../structures/Command';
import { buildCcMessage, buildCcSelectMessage } from '../utils/build';
import { getCcStage } from '../api';

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

        if (!ccDict.hasOwnProperty(name)) {
            const { gameConsts } = require('../constants');
            const ccSeasons: { [key: string]: string[] } = gameConsts.ccSeasons;
            if (!ccSeasons.hasOwnProperty(name))
                return await interaction.reply({ content: 'That stage/season doesn\'t exist!', ephemeral: true });
            else {
                const ccSelectEmbed = await buildCcSelectMessage(name);
                return await interaction.reply(ccSelectEmbed);
            }
        }

        const stage = await getCcStage(name);

        if (stage.const === undefined || stage.levels === undefined)
            return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

        const ccEmbed = await buildCcMessage(stage, 0);
        return await interaction.reply(ccEmbed);
    }
}