const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../fetch');
const create = require('../create');
const utils = require('../utils/utils');

import { RogueTheme } from '../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('is3')
        .setDescription('Show information on Mizuki & Caerula Arbor (IS3)')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Info type')
                .addChoices(
                    { name: 'stage', value: 'stage' },
                    { name: 'relic', value: 'relic' },
                    { name: 'variation', value: 'variation' }
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('difficulty')
                .setDescription('Stage difficulty')
                .addChoices(
                    { name: 'normal', value: 'normal' },
                    { name: 'emergency', value: 'emergency' }
                )
        ),
    async execute(interaction) {

        const rogueDict: RogueTheme = fetch.rogueThemes()[1];
        const type = interaction.options.getString('type').toLowerCase();
        const name = interaction.options.getString('name').toLowerCase();

        switch (type) {
            case 'stage': {
                const stageMode = interaction.options.getString('difficulty');

                const stageDict = stageMode === 'emergency' ? rogueDict.toughStageDict : rogueDict.stageDict;
                const stageArr = stageDict[name];

                if (!stageDict.hasOwnProperty(name))
                    return await interaction.reply('That stage doesn\'t exist!');

                const stage = stageArr[0];
                if (stage.excel === undefined || stage.levels === undefined)
                    return await interaction.reply('That stage data doesn\'t exist!');

                const stageEmbed = await create.rogueStageEmbed(stage);
                await interaction.reply(stageEmbed);
                break;
            }
            case 'relic': {
                const relicDict = rogueDict.relicDict;

                if (!relicDict.hasOwnProperty(name))
                    return await interaction.reply('That relic doesn\'t exist!');

                const relic = relicDict[name];
                const relicEmbed = create.rogueRelicEmbed(relic);
                await interaction.reply(relicEmbed);

                break;
            }
            case 'variation': {
                if (name === 'list') {
                    const variationListEmbed = create.rogueVariationListEmbed(rogueDict);
                    await interaction.reply(variationListEmbed);
                }
                else {
                    const variationDict = rogueDict.variationDict;

                    if (!variationDict.hasOwnProperty(name))
                        return await interaction.reply('That variation doesn\'t exist!');

                    const variation = variationDict[name];
                    const variationEmbed = create.rogueVariationEmbed(variation);
                    await interaction.reply(variationEmbed);

                    break;
                }
            }
        }
    }
}