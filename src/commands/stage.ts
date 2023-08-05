import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { getStageArr, getToughStageArr } from '../utils/Api';
import { stageAutocomplete, toughStageAutocomplete } from '../utils/Autocomplete';
import { buildStageMessage, buildStageSelectMessage } from '../utils/Build';

export default class StageCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('stage')
        .setDescription('Show information on a stage')
        .addSubcommand(subcommand =>
            subcommand.setName('normal')
                .setDescription('Show information on a normal stage')
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
        );
    async autocomplete(interaction: AutocompleteInteraction) {
        const type = interaction.options.getSubcommand();
        const value = interaction.options.getFocused().toLowerCase();
        switch (type) {
            case 'normal': {
                const arr = await stageAutocomplete({ query: value, include: ['excel.name', 'excel.code', 'excel.stageId'] });
                return await interaction.respond(arr);
            }
            case 'challenge': {
                const arr = await toughStageAutocomplete({ query: value, include: ['excel.name', 'excel.code', 'excel.stageId'] });
                return await interaction.respond(arr);
            }
        }
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getSubcommand();
        const code = interaction.options.getString('code').toLowerCase();

        switch (type) {
            case 'normal': {
                const stageArr = await getStageArr({ query: code });

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
                const stageArr = await getToughStageArr({ query: code });

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
};