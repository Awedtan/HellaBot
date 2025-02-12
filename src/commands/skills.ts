import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Operator } from 'hella-types';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteOperator } from '../utils/autocomplete';
import { buildSkillMessage } from '../utils/build';

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
        ) as SlashCommandBuilder;
    name = 'Skills';
    description = ['Show information on an operator\'s skills, including SP type, SP cost, duration, effects, and range.'];
    usage = [
        '`/skills [operator]`',
        '`/skills [operator] [index]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const callback = (op: Operator) => op.skills.length !== 0;
        const arr = await autocompleteOperator({ query: value, include: ['skills.skillId'] }, callback);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        let index = interaction.options.getInteger('index') - 1;

        const op = await api.single('operator', { query: name, include: ['id', 'data', 'skills'] });

        if (!op)
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });
        if (op.data.skills.length === 0)
            return await interaction.reply({ content: 'That operator doesn\'t have any skills!', ephemeral: true });

        await interaction.deferReply();

        if (index !== -1 && index > op.data.skills.length - 1)
            index = -1;

        let first = true;
        for (let i = 0; i < op.data.skills.length; i++) {
            if (index !== -1 && index !== i) continue;
            const skillEmbed = await buildSkillMessage(op, i, 6);
            if (first) {
                await interaction.editReply(skillEmbed);
                first = false;
            }
            else {
                await interaction.followUp(skillEmbed);
            }
        }
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const op = await api.single('operator', { query: idArr[1], include: ['id', 'data', 'skills'] });
        const page = parseInt(idArr[2]);
        const level = parseInt(idArr[3]);

        const skillEmbed = await buildSkillMessage(op, page, level);
        await interaction.update(skillEmbed);
    }
}
