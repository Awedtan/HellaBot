import { SlashCommandBuilder } from 'discord.js';
import { ccDict } from '../data';
const create = require('../create');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cc')
        .setDescription('Show information on a CC stage or season')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Stage name/season number')
                .setRequired(true)
        ),
    async execute(interaction) {
        const name = interaction.options.getString('name').toLowerCase();

        if (!ccDict.hasOwnProperty(name)) {
            const { gameConsts } = require('../constants');
            const ccSeasons: { [key: string]: string[] } = gameConsts.ccSeasons;
            if (!ccSeasons.hasOwnProperty(name))
                return await interaction.reply({ content: 'That stage/season doesn\'t exist!', ephemeral: true });
            else {
                const ccSelectEmbed = await create.ccSelectEmbed(name);
                return await interaction.reply(ccSelectEmbed);
            }
        }

        const stage = ccDict[name];
        if (stage.const === undefined || stage.levels === undefined)
            return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

        const ccEmbed = await create.ccEmbed(stage, 0);
        await interaction.reply(ccEmbed);
    }
}