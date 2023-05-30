const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Operator, Skill } from '../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skills')
        .setDescription('Show an operator\'s skills')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('Skill #')
                .addChoices({ name: '1', value: 1 }, { name: '2', value: 2 }, { name: '3', value: 3 })
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetch.operators();
        const skillDict: { [key: string]: Skill } = fetch.skills();
        const name = interaction.options.getString('name').toLowerCase();
        let index = interaction.options.getInteger('index') - 1;

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply('That operator doesn\'t exist!');

        const op = operatorDict[name];

        if (op.data.skills.length === 0)
            return await interaction.reply('That operator doesn\'t have any skills!');

        if (index != -1 && index > op.data.skills.length - 1)
            index = -1;

        let first = true;

        for (let i = 0; i < op.data.skills.length; i++) {
            if (index != -1 && index != i) continue;

            const opSkill = op.data.skills[i];
            const skill = skillDict[opSkill.skillId];

            if (first) {
                const skillEmbed = create.skillEmbed(skill, op, 0);
                await interaction.reply(skillEmbed);
                first = false;
            }
            else {
                const skillEmbed = create.skillEmbed(skill, op, 0);
                await interaction.followUp(skillEmbed);
            }
        }
    }
}