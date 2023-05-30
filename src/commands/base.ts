const { SlashCommandBuilder } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Base, Operator } from "../types";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('base')
        .setDescription('Show an operator\'s base skills')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetch.operators();
        const baseBuffDict: { [key: string]: Base } = fetch.bases();
        const name = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply('That operator doesn\'t exist!');

        const op = operatorDict[name];

        if (op.bases.length === 0)
            return await interaction.reply('That operator doesn\'t have any base skills!');

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
                await interaction.followUp(baseEmbed);
            }
        }
    }
}