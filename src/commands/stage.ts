const { SlashCommandBuilder } = require('discord.js');
const { fetchEnemies, fetchStages } = require('../utils/fetchData');
const create = require('../utils/create');


import { Enemy, Stage } from '../utils/types';

//TODO: stage drops, sanity cost
module.exports = {
    data: new SlashCommandBuilder()
        .setName('stage')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('difficulty')
                .setDescription('difficulty')
                .addChoices(
                    { name: 'Normal', value: 'normal' },
                    { name: 'Challenge', value: 'challenge' }
                )
        ),
    async execute(interaction) {
        const stageDict: { [key: string]: Stage } = fetchStages();

        const stageName = interaction.options.getString('name').toLowerCase();
        const stageMode = interaction.options.getString('difficulty');

        if (!stageDict.hasOwnProperty(stageName))
            return await interaction.reply('That stage doesn\'t exist!');

        const stage = stageDict[stageName];
        const isChallenge = stageMode === 'challenge';
        const stageDifficulty = isChallenge ? stage.challenge : stage.normal;

        if (stageDifficulty.excel === undefined || stageDifficulty.levels === undefined)
            return await interaction.reply('That stage data doesn\'t exist!');

        const stageEmbed = await create.stageEmbed(stage, isChallenge);
        await interaction.reply(stageEmbed);
    }
}