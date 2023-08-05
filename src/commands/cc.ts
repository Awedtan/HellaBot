import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { getCCStage } from '../utils/Api';
import { buildCcMessage, buildCcSelectMessage } from '../utils/Build';
import { ccAutocomplete } from '../utils/Autocomplete';
const { gameConsts } = require('../constants');

export default class CCCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('cc')
        .setDescription('Show information on a CC stage or season')
        .addSubcommand(subcommand =>
            subcommand.setName('stage')
                .setDescription('Show information on a CC stage')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Stage name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('season')
                .setDescription('Show information on a CC season')
                .addStringOption(option =>
                    option.setName('index')
                        .setDescription('Season #')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Beta', value: 'beta' },
                            { name: '0', value: '0' },
                            { name: '1', value: '1' },
                            { name: '2', value: '2' },
                            { name: '3', value: '3' },
                            { name: '4', value: '4' },
                            { name: '5', value: '5' },
                            { name: '6', value: '6' },
                            { name: '7', value: '7' },
                            { name: '8', value: '8' },
                            { name: '9', value: '9' },
                            { name: '10', value: '10' },
                            { name: '11', value: '11' }
                        )
                )
        );
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = await ccAutocomplete(value);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getSubcommand();

        switch (type) {
            case 'stage': {
                const name = interaction.options.getString('name').toLowerCase();
                const stage = await getCCStage({ query: name });

                if (!stage.const || !stage.levels)
                    return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const ccEmbed = await buildCcMessage(stage, 0);
                return await interaction.editReply(ccEmbed);
            }
            case 'season': {
                const index = interaction.options.getString('index').toLowerCase();

                if (!gameConsts.ccSeasons.hasOwnProperty(index))
                    return await interaction.reply({ content: 'That stage/season doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const ccSelectEmbed = await buildCcSelectMessage(index);
                return await interaction.editReply(ccSelectEmbed);
            }
        }
    }
}