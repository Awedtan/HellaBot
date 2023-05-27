const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { RogueStage } from '../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('is3')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('type')
                .addChoices(
                    { name: 'stage', value: 'stage' },
                )
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name')
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
        const type = interaction.options.getString('type').toLowerCase();

        switch (type) {
            case 'stage': {
                const stageCode = interaction.options.getString('name').toLowerCase();
                const stageMode = interaction.options.getString('difficulty');

                const stageDict: { [key: string]: RogueStage[] } = stageMode === 'challenge' ? fetch.toughRogue2Stages() : fetch.rogue2Stages();
                const stageArr = stageDict[stageCode];

                if (!stageDict.hasOwnProperty(stageCode) || stageArr.length === 0)
                    return await interaction.reply('That stage doesn\'t exist!');

                if (stageArr.length == 1) {
                    const stage = stageArr[0];
                    if (stage.excel === undefined || stage.levels === undefined)
                        return await interaction.reply('That stage data doesn\'t exist!');

                    const stageEmbed = await create.rogueStageEmbed(stage);
                    await interaction.reply(stageEmbed);
                } else {
                    const stageSelectEmbed = create.stageSelectEmbed(stageArr);
                    let response = await interaction.reply(stageSelectEmbed);

                    while (true) {
                        try {
                            const confirm = await response.awaitMessageComponent({ time: 300000 });
                            const value = parseInt(confirm.values[0]);
                            const stage = stageArr[value];
                            const stageEmbed = await create.rogueStageEmbed(stage);
                            response = await confirm.update(stageEmbed);
                        } catch (e) {
                            console.error(e);
                            await response.edit({ components: [] });
                            break;
                        }
                    }
                }
            }
        }
    }
}