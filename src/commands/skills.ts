const { SlashCommandBuilder } = require('discord.js');
const { fetchOperators, fetchSkills } = require('../utils/fetchData');
const wait = require('node:timers/promises').setTimeout;
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

        if (operatorDict.hasOwnProperty(operatorName)) {
            const op = operatorDict[operatorName];

            if (op.data.skills.length != 0) {
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
                    await wait(200);
                }
            }
            else {
                await interaction.reply('That operator doesn\'t have any skills!');
            }
        }
        else {
            await interaction.reply('That operator doesn\'t exist!');
        }
    }
}

async function replySkillEmbed(interaction, skill: Skill, operator: Operator) {
    let level = 0;
    const skillEmbed = create.skillEmbed(skill, level, operator);
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
            response = await response.edit(create.skillEmbed(skill, level, operator));
        } catch (e) {
            console.log(e);
            await response.edit({ embeds: skillEmbed.embeds, files: skillEmbed.files, components: [] });
            break;
        }
    }
}

async function sendSkillEmbed(channel, skill: Skill, operator: Operator) {
    let level = 0;
    const skillEmbed = create.skillEmbed(skill, level, operator);
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
            response = await response.edit(create.skillEmbed(skill, level, operator));
        } catch (e) {
            console.log(e);
            await response.edit({ embeds: skillEmbed.embeds, files: skillEmbed.files, components: [] });
            break;
        }
    }
}