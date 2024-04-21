import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Operator } from 'hella-types';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteOperator } from '../utils/autocomplete';
import { buildCostMessage } from '../utils/build';
const { gameConsts } = require('../constants');

export default class CostCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('costs')
        .setDescription('Show an operator\'s elite, skill, mastery, and module level costs')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Cost type')
                .addChoices(
                    { name: 'promotions', value: '0' },
                    { name: 'skills', value: '1' },
                    { name: 'masteries', value: '2' },
                    { name: 'modules', value: '3' }
                )
        ) as SlashCommandBuilder;
    name = 'Costs';
    description = ['Show the material cost for an operator\'s elite promotions, skill levels, mastery levels, and module levels.'];
    usage = [
        '`/costs [operator]`',
        '`/costs [operator] [type]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const callback = (op: Operator) => gameConsts.rarity[op.data.rarity] > 1;
        const arr = await autocompleteOperator({ query: value, include: ['data.rarity'] }, callback);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const page = parseInt(interaction.options.getString('type'));
        const op = await api.single('operator', { query: name, include: ['id', 'data', 'skills', 'modules'] });

        if (!op)
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });
        if (gameConsts.rarity[op.data.rarity] <= 1)
            return await interaction.reply({ content: 'That operator has no upgrades!', ephemeral: true });

        await interaction.deferReply();

        const costEmbed = await buildCostMessage(op, page);
        return await interaction.editReply(costEmbed);
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const op = await api.single('operator', { query: idArr[1], include: ['id', 'data', 'skills', 'modules'] });
        const page = parseInt(idArr[2]);

        const costEmbed = await buildCostMessage(op, page);
        await interaction.editReply(costEmbed);
    }
}