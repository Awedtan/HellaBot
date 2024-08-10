import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteSandboxStage } from '../utils/autocomplete';
import { buildSandboxStageMessage } from '../utils/build';

const innerIndex = 0;
const outerIndex = innerIndex + 2;
const outerName = 'Tales Within the Sand';

export default class RA2Command implements Command {
    data = new SlashCommandBuilder()
        .setName(`ra${outerIndex}`)
        .setDescription(`Show information on RA${outerIndex}: ${outerName}`)
        .addSubcommand(subcommand =>
            subcommand.setName('stage')
                .setDescription(`Show information on an RA${outerIndex} stage`)
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Stage name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ) as SlashCommandBuilder;
    name = `RA${outerIndex}`;
    description = [
        `Show information on RA${outerIndex}: ${outerName}.`,
        '`stage`: show the enemy list, image preview, and stage diagram for a stage.',
    ];
    usage = [
        `\`/ra${outerIndex} stage [stage]\``
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const type = interaction.options.getSubcommand();
        const value = interaction.options.getFocused().toLowerCase();
        switch (type) {
            case 'stage': {
                const arr = await autocompleteSandboxStage(innerIndex, { query: value });
                return await interaction.respond(arr);
            }
        }
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getSubcommand();
        const name = interaction.options.getString('name').toLowerCase();

        switch (type) {
            case 'stage': {
                const stageDict = (await api.single('sandbox', { query: innerIndex.toString(), include: ['stageDict'] })).stageDict;
                const stage = stageDict[name];

                if (!stageDict.hasOwnProperty(name))
                    return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });
                if (!stage.excel || !stage.levels)
                    return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const stageEmbed = await buildSandboxStageMessage(innerIndex, stage, 0);
                return await interaction.editReply(stageEmbed);
            }
        }
    }
    async buttonResponse(interaction: ButtonInteraction, idArr: string[]) {
        switch (idArr[1]) {
            case 'stage': {
                const stage = await api.single(`sandboxstage/${innerIndex}`, { query: idArr[2] });
                const page = parseInt(idArr[3]);

                const stageEmbed = await buildSandboxStageMessage(innerIndex, stage, page);
                await interaction.update(stageEmbed);

                break;
            }
        }
    }
}