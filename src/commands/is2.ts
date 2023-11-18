import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { getRogueTheme } from '../utils/api';
import { rogueRelicAutocomplete, rogueStageAutocomplete, rogueToughStageAutocomplete, rogueVariationAutocomplete } from '../utils/autocomplete';
import { buildRogueRelicListMessage, buildRogueRelicMessage, buildRogueStageMessage, buildRogueVariationListMessage, buildRogueVariationMessage } from '../utils/build';

const innerIndex = 0;
const outerIndex = innerIndex + 2;

export default class IS2Command implements Command {
    data = new SlashCommandBuilder()
        .setName(`is${outerIndex}`)
        .setDescription(`Show information on IS${outerIndex} (Phantom & Crimson Solitaire)`)
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup.setName('stage')
                .setDescription(`Show information on an IS${outerIndex} stage`)
                .addSubcommand(subcommand =>
                    subcommand.setName('normal')
                        .setDescription(`Show information on an IS${outerIndex} stage`)
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Stage name')
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand.setName('emergency')
                        .setDescription(`Show information on an IS${outerIndex} emergency stage`)
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Stage name')
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('relic')
                .setDescription(`Show information on an IS${outerIndex} relic`)
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Relic name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('variation')
                .setDescription(`Show information on an IS${outerIndex} floor effect`)
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Effect name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        );
    async autocomplete(interaction: AutocompleteInteraction) {
        const type = interaction.options.getSubcommand();
        const value = interaction.options.getFocused().toLowerCase();
        switch (type) {
            case 'normal': {
                const arr = await rogueStageAutocomplete(innerIndex, { query: value, include: ['stageDict'] });
                return await interaction.respond(arr);
            }
            case 'emergency': {
                const arr = await rogueToughStageAutocomplete(innerIndex, { query: value, include: ['toughStageDict'] });
                return await interaction.respond(arr);
            }
            case 'relic': {
                const arr = await rogueRelicAutocomplete(innerIndex, { query: value, include: ['relicDict'] });
                arr.push({ name: 'List All', value: 'list' });
                return await interaction.respond(arr);
            }
            case 'variation': {
                const arr = await rogueVariationAutocomplete(innerIndex, { query: value, include: ['variationDict'] });
                arr.push({ name: 'List All', value: 'list' });
                return await interaction.respond(arr);
            }
        }
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getSubcommand();
        const name = interaction.options.getString('name').toLowerCase();

        switch (type) {
            case 'normal': {
                const stageDict = (await getRogueTheme({ query: innerIndex.toString(), include: ['stageDict'] })).stageDict;
                const stage = stageDict[name];

                if (!stageDict.hasOwnProperty(name))
                    return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });
                if (!stage.excel || !stage.levels)
                    return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const stageEmbed = await buildRogueStageMessage(innerIndex, stage, 0);
                return await interaction.editReply(stageEmbed);
            }
            case 'emergency': {
                const stageDict = (await getRogueTheme({ query: innerIndex.toString(), include: ['toughStageDict'] })).toughStageDict;
                const stage = stageDict[name];

                if (!stageDict.hasOwnProperty(name))
                    return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });
                if (!stage.excel || !stage.levels)
                    return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const stageEmbed = await buildRogueStageMessage(innerIndex, stage, 0);
                return await interaction.editReply(stageEmbed);
            }
            case 'relic': {
                if (name === 'list') {
                    await interaction.deferReply();

                    const relicListEmbed = await buildRogueRelicListMessage(innerIndex, 0);
                    return await interaction.editReply(relicListEmbed);
                }

                const relicDict = (await getRogueTheme({ query: innerIndex.toString(), include: ['relicDict'] })).relicDict;

                if (!relicDict.hasOwnProperty(name))
                    return await interaction.reply({ content: 'That relic doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const relic = relicDict[name];
                const relicEmbed = await buildRogueRelicMessage(relic);
                return await interaction.editReply(relicEmbed);
            }
            case 'variation': {
                if (name === 'list') {
                    await interaction.deferReply();

                    const variationListEmbed = await buildRogueVariationListMessage(innerIndex);
                    return await interaction.editReply(variationListEmbed);
                }

                const variationDict = (await getRogueTheme({ query: innerIndex.toString(), include: ['variationDict'] })).variationDict;

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