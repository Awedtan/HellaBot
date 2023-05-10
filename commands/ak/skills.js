const { SlashCommandBuilder } = require('discord.js');
const { fetchOperators } = require('../../utils/fetchData.js');
const { replySkillEmbed, sendSkillEmbed } = require('./skill.js');
const wait = require('node:timers/promises').setTimeout;

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
        const operatorDict = fetchOperators();
        const operatorName = interaction.options.getString('name').toLowerCase();

        if (operatorDict.hasOwnProperty(operatorName)) {
            const op = operatorDict[operatorName].data;
            let first = true;
            for (const skill of op.skills) {
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
            await interaction.reply('That operator doesn\'t exist!');
        }
    }
}