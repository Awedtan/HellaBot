import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { Operator } from '../types';
import { getOperator } from '../utils/Api';
import { operatorAutocomplete } from '../utils/Autocomplete';
import { buildModuleMessage } from '../utils/Build';

export default class ModuleCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('modules')
        .setDescription('Show an operator\'s modules')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        );
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const callback = (op: Operator) => op.modules.length !== 0;
        const arr = await operatorAutocomplete({ query: value, include: ['data.name', 'modules.info.uniEquipId'] }, callback);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const op = await getOperator({ query: name });

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
}