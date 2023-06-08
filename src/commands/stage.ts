const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Stage } from '../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stage')
        .setDescription('Show information on a stage')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('Stage code')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('difficulty')
                .setDescription('Stage Difficulty')
                .addChoices(
                    { name: 'normal', value: 'normal' },
                    { name: 'challenge', value: 'challenge' }
                )
        ),
    async execute(interaction) {
        const code = interaction.options.getString('code').toLowerCase();
        const difficulty = interaction.options.getString('difficulty');

        const stageDict: { [key: string]: Stage[] } = difficulty === 'challenge' ? fetch.toughStages() : fetch.stages();
        const stageArr = stageDict[code];

        if (!stageDict.hasOwnProperty(code) || stageArr.length === 0)
            return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });

        if (stageArr.length == 1) {
            const stage = stageArr[0];
            if (stage.excel === undefined || stage.levels === undefined)
                return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

            const stageEmbed = await create.stageEmbed(stage);
            await interaction.reply(stageEmbed);
        }
        else {
            const stageSelectEmbed = create.stageSelectEmbed(stageArr);
            await interaction.reply(stageSelectEmbed);
        }
    }
}