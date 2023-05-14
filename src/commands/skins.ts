const { SlashCommandBuilder } = require('discord.js');
const { fetchOperators, fetchSkins } = require('../utils/fetchData');
const wait = require('node:timers/promises').setTimeout;
const create = require('../utils/create');

import { Module, Operator, Skin } from "../utils/types";

const pageId: { [key: string]: number } = { l1: 0, l2: 1, l3: 2, l4: 3, l5: 4, l6: 5, l7: 6 };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skins')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetchOperators();
        const skinDict: { [key: string]: Skin[] } = fetchSkins();
        const operatorName = interaction.options.getString('name').toLowerCase();

        if (operatorDict.hasOwnProperty(operatorName)) {
            const operator = operatorDict[operatorName];
            const operatorId = operator.id;

            if (skinDict.hasOwnProperty(operatorId)) {
                replySkinEmbed(interaction, operator);
            }
            else {
                await interaction.reply('That operator doesn\'t have any skins!');
            }
        }
        else {
            await interaction.reply('That operator doesn\'t exist!');
        }
    }
}

async function replySkinEmbed(interaction, operator: Operator) {
    let page = 0;
    const skinEmbed = create.skinEmbed(operator, page);
    let response = await interaction.reply(skinEmbed);

    while (true) {
        try {
            const confirm = await response.awaitMessageComponent({ time: 300000 });
            page = pageId[confirm.customId];
            try {
                await confirm.update({ content: '' });
            } catch (e) {
                continue;
            }
            response = await response.edit(create.skinEmbed(operator, page));
        } catch (e) {
            console.log(e);
            await response.edit({ embeds: skinEmbed.embeds, files: skinEmbed.files, components: [] });
            break;
        }
    }
}