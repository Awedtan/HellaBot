import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder, StringSelectMenuInteraction } from 'discord.js';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteStage, autocompleteToughStage } from '../utils/autocomplete';
import { buildStageMessage } from '../utils/build';
import { Stage } from '../utils/canon';

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

        const stageArr = await api.single(type === 'normal' ? 'stage' : 'toughstage', { query: code });

        if (!stageArr || stageArr.length === 0)
            return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });

        const stage = stageArr[0];
        if (!Stage.isValid(stage))
            return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

        await interaction.deferReply();

        const stageEmbed = await buildStageMessage(stage, 0);
        return await interaction.editReply(stageEmbed);
    }
    async selectResponse(interaction: StringSelectMenuInteraction<CacheType>, idArr: string[]) {
        const value = parseInt(interaction.values[0]);
        const id = idArr[1];
        const index = parseInt(idArr[2]);
        const isTough = idArr[3] === 'true';
        const stage = isTough
            ? (await api.single('toughstage', { query: id }))[index]
            : (await api.single('stage', { query: id }))[index];

        const stageEmbed = await buildStageMessage(stage, value);
        await interaction.update(stageEmbed);
    }
};