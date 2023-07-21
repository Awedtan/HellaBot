import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { operatorDict } from '../data';
import { Command } from '../structures/Command';
import { operatorAutocomplete } from '../utils/autocomplete';
import { buildSkillMessage } from '../utils/build';
import { getOperator } from '../api';

export default class SkillCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('skills')
        .setDescription('Show an operator\'s skills')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('Skill #')
                .setMinValue(1)
                .setMaxValue(3)
        );
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const callback = op => op.data.skills.length !== 0;
        const arr = operatorAutocomplete(value, callback);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        let index = interaction.options.getInteger('index') - 1;

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        // const op = operatorDict[name];
        const op = await getOperator(name);

        if (op.data.skills.length === 0)
            return await interaction.reply({ content: 'That operator doesn\'t have any skills!', ephemeral: true });

        if (index !== -1 && index > op.data.skills.length - 1)
            index = -1;

        let first = true;

        for (let i = 0; i < op.data.skills.length; i++) {
            if (index !== -1 && index !== i) continue;
            if (first) {
                const skillEmbed = buildSkillMessage(op, i, 0);
                await interaction.reply(skillEmbed);
                first = false;
            }
            else {
                const skillEmbed = buildSkillMessage(op, i, 0);
                await interaction.followUp(skillEmbed);
            }
        }
    }
}