const { SlashCommandBuilder } = require('discord.js');
const { fetchBases, fetchOperators } = require('../utils/fetchData');
const wait = require('node:timers/promises').setTimeout;
const create = require('../utils/create');

import { Base, Operator } from "../utils/types";

const levelId: { [key: string]: number } = { l1: 0, l2: 1, l3: 2 };

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

        if (operatorDict.hasOwnProperty(operatorName)) {
            const op = operatorDict[operatorName];

            let first = true;
            for (const baseId of op.bases) {
                const base = baseBuffDict[baseId];

                if (first) {
                    replyBaseEmbed(interaction, base, op);
                    first = false;
                }
                else {
                    sendBaseEmbed(interaction.channel, base, op);
                }
                await wait(100);
            }
        }
        else {
            await interaction.reply('That operator doesn\'t exist!');
        }
    }
}

async function replyBaseEmbed(interaction, base: Base, operator: Operator) {
    let level = 0;
    const baseEmbed = create.baseEmbed(base, level, operator);
    let response = await interaction.reply(baseEmbed);

    while (true) {
        try {
            const confirm = await response.awaitMessageComponent({ time: 300000 });
            level = levelId[confirm.customId];
            try {
                await confirm.update({ content: '' });
            } catch (e) {
                continue;
            }
            response = await response.edit(create.baseEmbed(base, level, operator));
        } catch (e) {
            console.log(e);
            await response.edit({ embeds: baseEmbed.embeds, files: baseEmbed.files, components: [] });
            break;
        }
    }
}

async function sendBaseEmbed(channel, base: Base, operator: Operator) {
    let level = 0;
    const baseEmbed = create.baseEmbed(base, level, operator);
    let response = await channel.send(baseEmbed);

    while (true) {
        try {
            const confirm = await response.awaitMessageComponent({ time: 300000 });
            level = levelId[confirm.customId];
            try {
                await confirm.update({ content: '' });
            } catch (e) {
                continue;
            }
            response = await response.edit(create.baseEmbed(base, level, operator));
        } catch (e) {
            console.log(e);
            await response.edit({ embeds: baseEmbed.embeds, files: baseEmbed.files, components: [] });
            break;
        }
    }
}