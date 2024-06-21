import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder, StringSelectMenuInteraction } from 'discord.js';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteCcb } from '../utils/autocomplete';
import { buildCcbMessage, buildCcbSelectMessage } from '../utils/build';
const { gameConsts } = require('../constants');

export default class CCBCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('ccb')
        .setDescription('Show information on a CCB stage or season')
        .addSubcommand(subcommand =>
            subcommand.setName('stage')
                .setDescription('Show information on a CCB stage')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Stage name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('season')
                .setDescription('Show information on a CCB season')
                .addStringOption(option =>
                    option.setName('index')
                        .setDescription('Season #')
                        .setRequired(true)
                        .addChoices(
                            { name: 'poo', value: 'poo' },
                            { name: '1', value: '1' }
                        )
                )
        ) as SlashCommandBuilder;
    name = 'CCB';
    description = [
        'Show information on a Contingency Contract Battleplan stage.',
        '`stage`: show the enemy list, image preview, and stage diagram for a stage.',
        '`season`: show the list of stages for a season.'
    ];
    usage = [
        '`/ccb stage [stage]`',
        '`/ccb season [season]`'
    ]
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = await autocompleteCcb(value);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getSubcommand();

        switch (type) {
            case 'stage': {
                const name = interaction.options.getString('name').toLowerCase();
                const stage = await api.single('ccb', { query: name });

                if (!stage || !stage.const || !stage.levels)
                    return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const ccbEmbed = await buildCcbMessage(stage, 0);
                return await interaction.editReply(ccbEmbed);
            }
            case 'season': {
                const index = interaction.options.getString('index').toLowerCase();

                if (!gameConsts.ccSeasons.hasOwnProperty(index))
                    return await interaction.reply({ content: 'That stage/season doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const ccbSelectEmbed = await buildCcbSelectMessage(index);
                return await interaction.editReply(ccbSelectEmbed);
            }
        }
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const stage = await api.single('ccb', { query: idArr[1] });
        const page = parseInt(idArr[2]);

        const ccbEmbed = await buildCcbMessage(stage, page);
        await interaction.editReply(ccbEmbed);
    }
    async selectResponse(interaction: StringSelectMenuInteraction<CacheType>, idArr: string[]) {
        const stage = await api.single('ccb', { query: interaction.values[0] });

        const ccbEmbed = await buildCcbMessage(stage, 0);
        await interaction.editReply(ccbEmbed);
    }
}
