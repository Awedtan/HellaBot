const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Operator, Skill } from '../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skills')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('index')
                .addChoices({ name: '1', value: 1 }, { name: '2', value: 2 }, { name: '3', value: 3 })
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetch.operators();
        const skillDict: { [key: string]: Skill } = fetch.skills();
        const name = interaction.options.getString('name').toLowerCase();
        let index = interaction.options.getInteger('index') - 1;
        const op = operatorDict[name];

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply('That operator doesn\'t exist!');

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
                let skillEmbed = create.skillEmbed(skill, 0, op);
                await interaction.reply(skillEmbed);
                first = false;
            }
            else {
                let skillEmbed = create.skillEmbed(skill, 0, op);
                await interaction.followUp(skillEmbed);
            }
        }
    }
}