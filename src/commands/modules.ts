import { SlashCommandBuilder } from 'discord.js';
import { moduleDict, operatorDict } from '../data';
import { buildModuleEmbed, operatorAutocomplete } from '../utils';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modules')
        .setDescription('Show an operator\'s modules')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async autocomplete(interaction) {
        const value = interaction.options.getFocused().toLowerCase();
        const callback = op => op.modules.length !== 0;
        const arr = operatorAutocomplete(value, callback);

        await interaction.respond(arr);
    },
    async execute(interaction) {
        const name = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const op = operatorDict[name];

        if (op.modules.length === 0)
            return await interaction.reply({ content: 'That operator doesn\'t have any modules!', ephemeral: true });

        let first = true;

        for (const moduleId of op.modules) {
            if (moduleId.includes('uniequip_001')) continue;

            const module = moduleDict[moduleId];

            if (first) {
                const moduleEmbed = buildModuleEmbed(module, op, 0);
                await interaction.reply(moduleEmbed);
                first = false;
            }
            else {
                const moduleEmbed = buildModuleEmbed(module, op, 0);
                await interaction.followUp(moduleEmbed);
            }
        }
    }
}