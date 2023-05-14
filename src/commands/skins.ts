const { SlashCommandBuilder } = require('discord.js');
const { fetchOperators, fetchSkins } = require('../utils/fetchData');
const create = require('../utils/create');

import { Operator, Skin } from "../utils/types";

const pageId: { [key: string]: number } = { p1: 0, p2: 1, p3: 2, p4: 3, p5: 4, p6: 5, p7: 6, p8: 7, p9: 8 };

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