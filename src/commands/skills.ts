const { SlashCommandBuilder } = require('discord.js');
const { fetchOperators, fetchSkills } = require('../utils/fetchData');
const wait = require('timers/promises').setTimeout;
const create = require('../utils/create');

import { Operator, Skill } from '../utils/types';

const levelId: { [key: string]: number } = { l1: 0, l2: 1, l3: 2, l4: 3, l5: 4, l6: 5, l7: 6, m1: 7, m2: 8, m3: 9 };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skills')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetchOperators();
        const skillDict: { [key: string]: Skill } = fetchSkills();
        const operatorName = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(operatorName))
            return await interaction.reply('That operator doesn\'t exist!');

        const op = operatorDict[operatorName];

        if (op.data.skills.length === 0)
            return await interaction.reply('That operator doesn\'t have any skills!');

        let first = true;

        for (const opSkill of op.data.skills) {
            const skill = skillDict[opSkill.skillId];

            if (first) {
                replySkillEmbed(interaction, skill, op);
                first = false;
            }
            else {
                sendSkillEmbed(interaction.channel, skill, op);
            }
            await wait(100);
        }
    }
}

async function replySkillEmbed(interaction, skill: Skill, operator: Operator) {
    let level = 0;
    let skillEmbed = create.skillEmbed(skill, level, operator);
    let response = await interaction.reply(skillEmbed);

    while (true) {
        try {
            const confirm = await response.awaitMessageComponent({ time: 300000 });
            level = levelId[confirm.customId];
            try {
                await confirm.update({ content: '' });
            } catch (e) {
                continue;
            }
            skillEmbed = create.skillEmbed(skill, level, operator);
            response = await response.edit(skillEmbed);
        } catch (e) {
            console.log(e);
            await response.edit({ embeds: skillEmbed.embeds, files: skillEmbed.files, components: [] });
            break;
        }
    }
}

async function sendSkillEmbed(channel, skill: Skill, operator: Operator) {
    let level = 0;
    let skillEmbed = create.skillEmbed(skill, level, operator);
    let response = await channel.send(skillEmbed);

    while (true) {
        try {
            const confirm = await response.awaitMessageComponent({ time: 300000 });
            level = levelId[confirm.customId];
            try {
                await confirm.update({ content: '' });
            } catch (e) {
                continue;
            }
            skillEmbed = create.skillEmbed(skill, level, operator);
            response = await response.edit(skillEmbed);
        } catch (e) {
            console.log(e);
            await response.edit({ embeds: skillEmbed.embeds, files: skillEmbed.files, components: [] });
            break;
        }
    }
}