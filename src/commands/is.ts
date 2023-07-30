import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { getRogueTheme } from '../utils/Api';
import { buildRogueRelicListMessage, buildRogueRelicMessage, buildRogueStageMessage, buildRogueVariationListMessage, buildRogueVariationMessage } from '../utils/Build';

export default class IsCommand implements Command {
    data = new SlashCommandBuilder()
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
        );
    async execute(interaction: ChatInputCommandInteraction) {
        const theme = interaction.options.getInteger('theme') - 2;
        const rogueDict = await getRogueTheme({ query: theme.toString() });
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

                await interaction.deferReply();

                const stageEmbed = await buildRogueStageMessage(theme, stage, 0);
                return await interaction.editReply(stageEmbed);
            }
            case 'relic': {
                if (name === 'list') {
                    const relicListEmbed = await buildRogueRelicListMessage(theme, 0);
                    return await interaction.reply(relicListEmbed);
                }
                else {
                    const relicDict = rogueDict.relicDict;

                    if (!relicDict.hasOwnProperty(name))
                        return await interaction.reply({ content: 'That relic doesn\'t exist!', ephemeral: true });

                    await interaction.deferReply();

                    const relic = relicDict[name];
                    const relicEmbed = await buildRogueRelicMessage(relic);
                    return await interaction.editReply(relicEmbed);
                }
            }
            case 'variation': {
                if (name === 'list') {
                    await interaction.deferReply();

                    const variationListEmbed = await buildRogueVariationListMessage(rogueDict);
                    return await interaction.editReply(variationListEmbed);
                }
                else {
                    const variationDict = rogueDict.variationDict;

                    if (!variationDict.hasOwnProperty(name))
                        return await interaction.reply({ content: 'That variation doesn\'t exist!', ephemeral: true });

                    await interaction.deferReply();

                    const variation = variationDict[name];
                    const variationEmbed = await buildRogueVariationMessage(variation);
                    return await interaction.editReply(variationEmbed);
                }
            }
        }
    }
}