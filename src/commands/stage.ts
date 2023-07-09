import { SlashCommandBuilder } from 'discord.js';
import { stageDict, toughStageDict } from '../data';
const create = require('../create');

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

        const currStageDict = difficulty === 'challenge' ? toughStageDict : stageDict;
        const stageArr = currStageDict[code];

        if (!currStageDict.hasOwnProperty(code) || stageArr.length === 0)
            return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });

        if (stageArr.length == 1) {
            const stage = stageArr[0];
            if (stage.excel === undefined || stage.levels === undefined)
                return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

            const stageEmbed = await create.stageEmbed(stage, 0);
            await interaction.reply(stageEmbed);
        }
        else {
            const stageSelectEmbed = create.stageSelectEmbed(stageArr);
            await interaction.reply(stageSelectEmbed);
        }
    }
}