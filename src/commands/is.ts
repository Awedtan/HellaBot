import { ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandGroupBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { getRogueTheme } from '../utils/Api';
import { buildRogueRelicListMessage, buildRogueRelicMessage, buildRogueStageMessage, buildRogueVariationListMessage, buildRogueVariationMessage } from '../utils/Build';

function buildSubcommandGroup(subcommandGroup: SlashCommandSubcommandGroupBuilder, index: number) {
    subcommandGroup.setName(index.toString()).setDescription(`IS${index}`)
        .addSubcommand(subcommand =>
            subcommand.setName('stage')
                .setDescription(`Show information on IS${index} stages`)
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
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('relic')
                .setDescription(`Show information on IS${index} relics`)
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('variation')
                .setDescription(`Show information on IS${index} floor effects`)
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name')
                        .setRequired(true)
                )
        )

    return subcommandGroup;
}

export default class ISCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('is')
        .setDescription('Show information on Integrated Strategies')
        .addSubcommandGroup(subcommandGroup =>
            buildSubcommandGroup(subcommandGroup, 2)
        )
        .addSubcommandGroup(subcommandGroup =>
            buildSubcommandGroup(subcommandGroup, 3)
        );
    async execute(interaction: ChatInputCommandInteraction) {
        const theme = parseInt(interaction.options.getSubcommandGroup()) - 2;
        const type = interaction.options.getSubcommand();
        const name = interaction.options.getString('name').toLowerCase();

        switch (type) {
            case 'stage': {
                const difficulty = interaction.options.getString('difficulty');
                const stageDict = difficulty === 'emergency' ?
                    (await getRogueTheme({ query: theme.toString(), include: ['toughStageDict'] })).toughStageDict :
                    (await getRogueTheme({ query: theme.toString(), include: ['stageDict'] })).stageDict;
                const stage = stageDict[name];

                if (!stageDict.hasOwnProperty(name))
                    return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });
                if (!stage.excel || !stage.levels)
                    return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const stageEmbed = await buildRogueStageMessage(theme, stage, 0);
                return await interaction.editReply(stageEmbed);
            }
            case 'relic': {
                if (name === 'list') {
                    await interaction.deferReply();

                    const relicListEmbed = await buildRogueRelicListMessage(theme, 0);
                    return await interaction.editReply(relicListEmbed);
                }
                else {
                    const relicDict = (await getRogueTheme({ query: theme.toString(), include: ['relicDict'] })).relicDict;

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

                    const variationListEmbed = await buildRogueVariationListMessage(theme);
                    return await interaction.editReply(variationListEmbed);
                }
                else {
                    const variationDict = (await getRogueTheme({ query: theme.toString(), include: ['variationDict'] })).variationDict;

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