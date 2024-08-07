import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder, StringSelectMenuInteraction } from 'discord.js';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteStage, autocompleteToughStage } from '../utils/autocomplete';
import { buildStageMessage, buildStageSelectMessage } from '../utils/build';

export default class StageCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('stage')
        .setDescription('Show information on a stage')
        .addSubcommand(subcommand =>
            subcommand.setName('normal')
                .setDescription('Show information on a stage')
                .addStringOption(option =>
                    option.setName('code')
                        .setDescription('Stage code')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('challenge')
                .setDescription('Show information on a challenge stage')
                .addStringOption(option =>
                    option.setName('code')
                        .setDescription('Stage code')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ) as SlashCommandBuilder;
    name = 'Stage';
    description = [
        'Show the enemy list, image preview, and stage diagram for a stage.',
        '`normal`: show the enemy list, image preview, and stage diagram for a stage.',
        '`challenge`: show the enemy list, image preview, and stage diagram for the challenge version of a stage.',
    ];
    usage = [
        '`/stage normal [stage]`',
        '`/stage challenge [stage]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const type = interaction.options.getSubcommand();
        const value = interaction.options.getFocused().toLowerCase();
        switch (type) {
            case 'normal': {
                const arr = await autocompleteStage({ query: value });
                return await interaction.respond(arr);
            }
            case 'challenge': {
                const arr = await autocompleteToughStage({ query: value });
                return await interaction.respond(arr);
            }
        }
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getSubcommand();
        const code = interaction.options.getString('code').toLowerCase();

        switch (type) {
            case 'normal': {
                const stageArr = await api.single('stage', { query: code });

                if (!stageArr || stageArr.length === 0)
                    return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });

                if (stageArr.length == 1) {
                    const stage = stageArr[0];
                    if (!stage.excel || !stage.levels)
                        return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

                    await interaction.deferReply();

                    const stageEmbed = await buildStageMessage(stage, 0);
                    return await interaction.editReply(stageEmbed);
                }
                else {
                    await interaction.deferReply();

                    const stageSelectEmbed = await buildStageSelectMessage(stageArr);
                    return await interaction.editReply(stageSelectEmbed);
                }
            }
            case 'challenge': {
                const stageArr = await api.single('toughstage', { query: code });

                if (!stageArr || stageArr.length === 0)
                    return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });

                if (stageArr.length == 1) {
                    const stage = stageArr[0];
                    if (!stage.excel || !stage.levels)
                        return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

                    await interaction.deferReply();

                    const stageEmbed = await buildStageMessage(stage, 0);
                    return await interaction.editReply(stageEmbed);
                }
                else {
                    await interaction.deferReply();

                    const stageSelectEmbed = await buildStageSelectMessage(stageArr);
                    return await interaction.editReply(stageSelectEmbed);
                }
            }
        }
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const stage = idArr[3] === 'true' ? (await api.single('toughstage', { query: idArr[1] }))[parseInt(idArr[2])] : (await api.single('stage', { query: idArr[1] }))[parseInt(idArr[2])];
        const page = parseInt(idArr[4]);

        const stageEmbed = await buildStageMessage(stage, page);
        await interaction.update(stageEmbed);
    }
    async selectResponse(interaction: StringSelectMenuInteraction<CacheType>, idArr: string[]) {
        const stage = (await api.single('stage', { query: idArr[2] }))[interaction.values[0]];

        const stageEmbed = await buildStageMessage(stage, 0);
        await interaction.update(stageEmbed);
    }
};