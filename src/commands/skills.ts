const { SlashCommandBuilder } = require('discord.js');
const { fetchOperators } = require('../utils/fetchData');
const { replySkillEmbed, sendSkillEmbed } = require('./skill');
const wait = require('node:timers/promises').setTimeout;

import { Operator } from '../utils/types';

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
        const operatorName = interaction.options.getString('name').toLowerCase();

        if (operatorDict.hasOwnProperty(operatorName)) {
            const op = operatorDict[operatorName];
            const opData = op.data;

            if (opData.skills.length != 0) {
                let first = true;
                for (const skill of opData.skills) {
                    if (first) {
                        replySkillEmbed(interaction, skill.skillId);
                        first = false;
                    }
                    else {
                        sendSkillEmbed(interaction.channel, skill.skillId);
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