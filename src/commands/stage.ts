import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { getStageArr, getToughStageArr } from '../utils/Api';
import { stageAutocomplete } from '../utils/Autocomplete';
import { buildStageMessage, buildStageSelectMessage } from '../utils/Build';

export default class StageCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('stage')
        .setDescription('Show information on a stage')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('Stage code')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName('difficulty')
                .setDescription('Stage Difficulty')
                .addChoices(
                    { name: 'normal', value: 'normal' },
                    { name: 'challenge', value: 'challenge' }
                )
        );
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = await stageAutocomplete({ query: value, include: ['excel.name', 'excel.code', 'excel.stageId'] });
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const code = interaction.options.getString('code').toLowerCase();
        const difficulty = interaction.options.getString('difficulty');
        const stageArr = difficulty === 'challenge' ? await getToughStageArr({ query: code }) : await getStageArr({ query: code });

        if (!stageArr || stageArr.length === 0)
            return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });

        if (stageArr.length == 1) {
            const stage = stageArr[0];
            if (stage.excel === undefined || stage.levels === undefined)
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
};