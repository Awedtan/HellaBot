import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import { Operator } from 'hella-types';
import * as api from '../utils/api';
import { autocompleteOperator } from '../utils/autocomplete';
import { buildModuleMessage } from '../utils/build';

export default class ModuleCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('modules')
        .setDescription('Show an operator\'s modules')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        ) as SlashCommandBuilder;
    name = 'Modules';
    description = ['Show information on an operator\'s modules, including descriptions, talents, and stats.'];
    usage = [
        '`/modules [operator]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const callback = (op: Operator) => op.modules.length !== 0;
        const arr = await autocompleteOperator({ query: value, include: ['modules.info.uniEquipId'] }, callback);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const op = await api.single('operator', { query: name, include: ['id', 'data', 'modules'] });

        if (!op)
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });
        if (op.modules.length === 0)
            return await interaction.reply({ content: 'That operator doesn\'t have any modules!', ephemeral: true });

        await interaction.deferReply();

        let first = true;
        for (let i = 0; i < op.modules.length; i++) {
            if (op.modules[i].info.uniEquipId.includes('uniequip_001')) continue;
            const moduleEmbed = await buildModuleMessage(op, i, 0);
            if (first) {
                await interaction.editReply(moduleEmbed);
                first = false;
            }
            else {
                await interaction.followUp(moduleEmbed);
            }
        }
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const op = await api.single('operator', { query: idArr[1], include: ['id', 'data', 'modules'] });
        const page = parseInt(idArr[2]);
        const level = parseInt(idArr[3]);

        const moduleEmbed = await buildModuleMessage(op, page, level);
        await interaction.editReply(moduleEmbed);
    }
}