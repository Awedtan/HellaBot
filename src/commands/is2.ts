import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteRogueRelic, autocompleteRogueStage, autocompleteRogueToughStage, autocompleteRogueVariation } from '../utils/autocomplete';
import { buildRogueRelicListMessage, buildRogueRelicMessage, buildRogueStageMessage, buildRogueVariationListMessage, buildRogueVariationMessage } from '../utils/build';

const innerIndex = 0;
const outerIndex = innerIndex + 2;
const outerName = 'Phantom & Crimson Solitaire';

export default class IS2Command implements Command {
    data = new SlashCommandBuilder()
        .setName(`is${outerIndex}`)
        .setDescription(`Show information on IS${outerIndex}: ${outerName}`)
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
        ) as SlashCommandBuilder;
    name = `IS${outerIndex}`;
    description = [
        `Show information on IS${outerIndex}: ${outerName}.`,
        '`stage normal`: show the enemy list, image preview, and stage diagram for a stage.',
        '`stage emergency`: show the enemy list, image preview, and stage diagram for the emergency version of a stage.',
        '`relic`: show the cost and description of a relic.',
        '`variation`: show the description of a floor effect.'
    ];
    usage = [
        `\`/is${outerIndex} stage normal [stage]\``,
        `\`/is${outerIndex} stage emergency [stage]\``,
        `\`/is${outerIndex} relic [relic]\``,
        `\`/is${outerIndex} variation [effect]\``
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const type = interaction.options.getSubcommand();
        const value = interaction.options.getFocused().toLowerCase();
        switch (type) {
            case 'normal': {
                const arr = await autocompleteRogueStage(innerIndex, { query: value });
                return await interaction.respond(arr);
            }
            case 'emergency': {
                const arr = await autocompleteRogueToughStage(innerIndex, { query: value });
                return await interaction.respond(arr);
            }
            case 'relic': {
                const arr = await autocompleteRogueRelic(innerIndex, { query: value });
                arr.push({ name: 'List All', value: 'list' });
                return await interaction.respond(arr);
            }
            case 'variation': {
                const arr = await autocompleteRogueVariation(innerIndex, { query: value });
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
                const stage = (await api.single(`roguestage/${innerIndex}`, { query: name }));

                if (!stage)
                    return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });
                if (!stage.excel || !stage.levels)
                    return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const stageEmbed = await buildRogueStageMessage(innerIndex, stage, 0);
                return await interaction.editReply(stageEmbed);
            }
            case 'emergency': {
                const stageDict = (await api.single('rogue', { query: innerIndex.toString(), include: ['toughStageDict'] })).toughStageDict;
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

                const relicDict = (await api.single('rogue', { query: innerIndex.toString(), include: ['relicDict'] })).relicDict;

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

                const variationDict = (await api.single('rogue', { query: innerIndex.toString(), include: ['variationDict'] })).variationDict;

                if (!variationDict.hasOwnProperty(name))
                    return await interaction.reply({ content: 'That variation doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const variation = variationDict[name];
                const variationEmbed = await buildRogueVariationMessage(variation);
                return await interaction.editReply(variationEmbed);
            }
        }
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        switch (idArr[1]) {
            case 'relic': {
                const index = parseInt(idArr[2]);

                const relicListEmbed = await buildRogueRelicListMessage(innerIndex, index);
                await interaction.update(relicListEmbed);

                break;
            }
            case 'stage': {
                const stage = idArr[2] === 'true'
                    ? await api.single(`roguetoughstage/${innerIndex}`, { query: idArr[3] })
                    : await api.single(`roguestage/${innerIndex}`, { query: idArr[3] });
                const page = parseInt(idArr[4]);

                const stageEmbed = await buildRogueStageMessage(innerIndex, stage, page);
                await interaction.update(stageEmbed);

                break;
            }
        }
    }
}