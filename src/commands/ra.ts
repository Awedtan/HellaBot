import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { getSandboxAct } from '../utils/api';
import { sandboxStageAutocomplete } from '../utils/autocomplete';
import { buildSandboxStageMessage } from '../utils/build';

const actIndex = 0;

export default class RACommand implements Command {
    data = new SlashCommandBuilder()
        .setName(`ra`)
        .setDescription(`Show information on Reclamation Algorithm`)
        .addSubcommand(subcommand =>
            subcommand.setName('stage')
                .setDescription(`Show information on an RA stage`)
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Stage name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        );
    async autocomplete(interaction: AutocompleteInteraction) {
        const type = interaction.options.getSubcommand();
        const value = interaction.options.getFocused().toLowerCase();
        switch (type) {
            case 'stage': {
                const arr = await sandboxStageAutocomplete(actIndex, { query: value, include: ['stageDict'] });
                return await interaction.respond(arr);
            }
        }
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getSubcommand();
        const name = interaction.options.getString('name').toLowerCase();

        switch (type) {
            case 'stage': {
                const stageDict = (await getSandboxAct({ query: actIndex.toString(), include: ['stageDict'] })).stageDict;
                const stage = stageDict[name];

                if (!stageDict.hasOwnProperty(name))
                    return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });
                if (!stage.excel || !stage.levels)
                    return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const stageEmbed = await buildSandboxStageMessage(stage);
                return await interaction.editReply(stageEmbed);
            }
        }
    }
}