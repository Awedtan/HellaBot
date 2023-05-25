const { SlashCommandBuilder } = require('discord.js');
const { fetchOperators } = require('../utils/fetchData');
const create = require('../utils/create');

import { Operator } from '../utils/types';

const typeId: { [key: string]: number } = { null: 0, skills: 1, modules: 2, art: 3, base: 4 };
const pageId: { [key: string]: number } = { p1: 0, p2: 1, p3: 2, p4: 3, p5: 4, p6: 5, p7: 6, p8: 7, p9: 8 };
const levelId: { [key: string]: number } = { l1: 0, l2: 1, l3: 2, l4: 3, l5: 4, l6: 5, l7: 6, m1: 7, m2: 8, m3: 9 };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetchOperators();
        const operatorName = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(operatorName))
            return await interaction.reply('That operator doesn\'t exist!');

        const operator = operatorDict[operatorName];
        await replyInfoEmbed(interaction, operator);
    }
}

async function replyInfoEmbed(interaction, operator: Operator) {
    let type = 0, page = 0, level = 0;
    let operatorEmbed = create.infoEmbed(operator, type, page, level);
    let response = await interaction.reply(operatorEmbed);

    while (true) {
        try {
            const confirm = await response.awaitMessageComponent({ time: 300000 });

            try {
                await confirm.update({ content: '' });
            } catch (e) {
                continue;
            }

            if (typeId.hasOwnProperty(confirm.customId)) {
                type = typeId[confirm.customId];
                page = 0;
                level = 0;
            } else if (pageId.hasOwnProperty(confirm.customId)) {
                page = pageId[confirm.customId];
            } else if (levelId.hasOwnProperty(confirm.customId)) {
                level = levelId[confirm.customId];
            }

            operatorEmbed = create.infoEmbed(operator, type, page, level);
            response = await response.edit(operatorEmbed);
        } catch (e) {
            console.log(e);
            await response.edit({ embeds: operatorEmbed.embeds, files: operatorEmbed.files, components: [] });
            break;
        }
    }
}