const { SlashCommandBuilder } = require('discord.js');
const { fetchBases, fetchOperators } = require('../utils/fetchData');
const wait = require('node:timers/promises').setTimeout;
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
                replyBaseEmbed(interaction, base, baseInfo, op);
                first = false;
            }
            else {
                sendBaseEmbed(interaction.channel, base, baseInfo, op);
            }
            await wait(100);
        }
    }
}

async function replyBaseEmbed(interaction, base: Base, baseInfo: BaseInfo, operator: Operator) {
    const baseEmbed = create.baseEmbed(base, baseInfo, operator);
    let response = await interaction.reply(baseEmbed);

    while (true) {
        try {
            const confirm = await response.awaitMessageComponent({ time: 300000 });
            try {
                await confirm.update({ content: '' });
            } catch (e) {
                continue;
            }
            response = await response.edit(create.baseEmbed(base, baseInfo, operator));
        } catch (e) {
            console.log(e);
            await response.edit({ embeds: baseEmbed.embeds, files: baseEmbed.files, components: [] });
            break;
        }
    }
}

async function sendBaseEmbed(channel, base: Base, baseInfo: BaseInfo, operator: Operator) {
    const baseEmbed = create.baseEmbed(base, baseInfo, operator);
    let response = await channel.send(baseEmbed);

    while (true) {
        try {
            const confirm = await response.awaitMessageComponent({ time: 300000 });
            try {
                await confirm.update({ content: '' });
            } catch (e) {
                continue;
            }
            response = await response.edit(create.baseEmbed(base, baseInfo, operator));
        } catch (e) {
            console.log(e);
            await response.edit({ embeds: baseEmbed.embeds, files: baseEmbed.files, components: [] });
            break;
        }
    }
}