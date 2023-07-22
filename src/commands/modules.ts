import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { operatorDict } from '../data';
import { Command } from '../structures/Command';
import { operatorAutocomplete } from '../utils/autocomplete';
import { buildModuleMessage } from '../utils/build';
import { getOperator } from '../api';

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
        const callback = op => op.modules.length !== 0;
        const arr = operatorAutocomplete(value, callback);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const op = await getOperator(name);

        if (op.modules.length === 0)
            return await interaction.reply({ content: 'That operator doesn\'t have any modules!', ephemeral: true });

        let first = true;

        for (let i = 0; i < op.modules.length; i++) {
            if (op.modules[i].includes('uniequip_001')) continue;
            if (first) {
                const moduleEmbed = await buildModuleMessage(op, i, 0);
                await interaction.reply(moduleEmbed);
                first = false;
            }
            else {
                const moduleEmbed = await buildModuleMessage(op, i, 0);
                await interaction.followUp(moduleEmbed);
            }
        }
    }
}