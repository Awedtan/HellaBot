const { SlashCommandBuilder } = require('discord.js');
const { fetchBases, fetchOperators } = require('../utils/fetchData');
const wait = require('timers/promises').setTimeout;
const create = require('../utils/create');

import { Base, BaseInfo, Operator } from "../utils/types";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('base')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetchOperators();
        const baseBuffDict: { [key: string]: Base } = fetchBases();
        const operatorName = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(operatorName))
            return await interaction.reply('That operator doesn\'t exist!');

        const op = operatorDict[operatorName];

        let first = true;
        for (const baseInfo of op.bases) {
            const base = baseBuffDict[baseInfo.buffId];

            if (first) {
                const baseEmbed = create.baseEmbed(base, baseInfo, op);
                await interaction.reply(baseEmbed);
                first = false;
            }
            else {
                const baseEmbed = create.baseEmbed(base, baseInfo, op);
                await interaction.channel.send(baseEmbed);
            }
            await wait(200);
        }
    }
}