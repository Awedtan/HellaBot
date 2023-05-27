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
        )
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('index')
                .addChoices({ name: '1', value: 1 }, { name: '2', value: 2 }, { name: '3', value: 3 })
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetchOperators();
        const skillDict: { [key: string]: Skill } = fetchSkills();
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
                await replySkillEmbed(interaction, skill, op);
                first = false;
            }
            else {
                await sendSkillEmbed(interaction, skill, op);
            }
            await wait(200);
        }
    }
}

async function replySkillEmbed(interaction, skill: Skill, operator: Operator) {
    let level = 0;
    let skillEmbed = create.skillEmbed(skill, level, operator);
    let response = await interaction.reply(skillEmbed);

    // while (true) {
    //     try {
    //         const confirm = await response.awaitMessageComponent({ time: 300000 });

    //         level = levelId[confirm.customId];
    //         try {
    //             await confirm.update({ content: '' });
    //         } catch (e) {
    //             continue;
    //         }

    //         skillEmbed = create.skillEmbed(skill, level, operator);
    //         response = await response.edit(skillEmbed);
    //     } catch (e) {
    //         console.error(e);
    //         await response.edit({ embeds: skillEmbed.embeds, files: skillEmbed.files, components: [] });
    //         break;
    //     }
    // }
}

async function sendSkillEmbed(interaction, skill: Skill, operator: Operator) {
    let level = 0;
    let skillEmbed = create.skillEmbed(skill, level, operator);
    let response = await interaction.followUp(skillEmbed);

    // while (true) {
    //     try {
    //         const confirm = await response.awaitMessageComponent({ time: 300000 });

    //         try {
    //             await confirm.update({ content: '' });
    //         } catch (e) {
    //             continue;
    //         }

    //         level = levelId[confirm.customId];
    //         skillEmbed = create.skillEmbed(skill, level, operator);
    //         response = await response.edit(skillEmbed);
    //     } catch (e) {
    //         console.error(e);
    //         await response.edit({ embeds: skillEmbed.embeds, files: skillEmbed.files, components: [] });
    //         break;
    //     }
    // }
}