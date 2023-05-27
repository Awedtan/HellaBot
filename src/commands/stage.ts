const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Stage } from '../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stage')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('code')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('difficulty')
                .setDescription('difficulty')
                .addChoices(
                    { name: 'normal', value: 'normal' },
                    { name: 'challenge', value: 'challenge' }
                )
        ),
    async execute(interaction) {
        const stageCode = interaction.options.getString('code').toLowerCase();
        const stageMode = interaction.options.getString('difficulty');

        const stageDict: { [key: string]: Stage[] } = stageMode === 'challenge' ? fetch.toughStages() : fetch.stages();
        const stageArr = stageDict[stageCode];

        if (!stageDict.hasOwnProperty(stageCode) || stageArr.length === 0)
            return await interaction.reply('That stage doesn\'t exist!');

        if (stageArr.length == 1) {
            const stage = stageArr[0];
            if (stage.excel === undefined || stage.levels === undefined)
                return await interaction.reply('That stage data doesn\'t exist!');

            const stageEmbed = await create.stageEmbed(stage);
            await interaction.reply(stageEmbed);
        } else {
            const stageSelectEmbed = create.stageSelectEmbed(stageArr);
            await interaction.reply(stageSelectEmbed);
        }
    }
}