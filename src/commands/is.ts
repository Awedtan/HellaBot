import { SlashCommandBuilder } from 'discord.js';
import { rogueThemeArr } from '../data';
import { buildRogueRelicEmbed, buildRogueRelicListEmbed, buildRogueStageEmbed, buildRogueVariationEmbed, buildRogueVariationListEmbed } from '../utils';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('is')
        .setDescription('Show information on Integrated Strategies')
        .addIntegerOption(option =>
            option.setName('theme')
                .setDescription('IS #')
                .setMinValue(2)
                .setMaxValue(3)
                .setRequired(true)
        )
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
                .setDescription('Name (use \'list\' to display all relics/variations)')
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
        const theme = interaction.options.getInteger('theme') - 2;
        const rogueDict = rogueThemeArr[theme];
        const type = interaction.options.getString('type').toLowerCase();
        const name = interaction.options.getString('name').toLowerCase();

        switch (type) {
            case 'stage': {
                const stageMode = interaction.options.getString('difficulty');

                const stageDict = stageMode === 'emergency' ? rogueDict.toughStageDict : rogueDict.stageDict;
                const stage = stageDict[name];

                if (!stageDict.hasOwnProperty(name))
                    return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });

                if (stage.excel === undefined || stage.levels === undefined)
                    return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

                const stageEmbed = await buildRogueStageEmbed(theme, stage, 0);
                await interaction.reply(stageEmbed);

                break;
            }
            case 'relic': {
                if (name === 'list') {
                    const relicListEmbed = buildRogueRelicListEmbed(theme, 0);
                    await interaction.reply(relicListEmbed);
                }
                else {
                    const relicDict = rogueDict.relicDict;

                    if (!relicDict.hasOwnProperty(name))
                        return await interaction.reply({ content: 'That relic doesn\'t exist!', ephemeral: true });

                    const relic = relicDict[name];
                    const relicEmbed = await buildRogueRelicEmbed(relic);
                    await interaction.reply(relicEmbed);
                }
                break;
            }
            case 'variation': {
                if (name === 'list') {
                    const variationListEmbed = buildRogueVariationListEmbed(rogueDict);
                    await interaction.reply(variationListEmbed);
                }
                else {
                    const variationDict = rogueDict.variationDict;

                    if (!variationDict.hasOwnProperty(name))
                        return await interaction.reply({ content: 'That variation doesn\'t exist!', ephemeral: true });

                    const variation = variationDict[name];
                    const variationEmbed = buildRogueVariationEmbed(variation);
                    await interaction.reply(variationEmbed);
                }
                break;
            }
        }
    }
}