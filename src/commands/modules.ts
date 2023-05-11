const { iconPath, moduleImagePath } = require('../../paths.json');
const { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { formatTextBlackboardTags } = require('../utils/utils');
const { fetchModules, fetchOperators } = require('../utils/fetchData');
const wait = require('node:timers/promises').setTimeout;

import { Module, Operator } from "../utils/types";

const levelId: { [key: string]: number } = { l1: 0, l2: 1, l3: 2 };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modules')
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
            const opModules = operatorDict[operatorName].modules;
            if (opModules != null) {
                let first = true;
                for (const moduleId of opModules) {
                    if (moduleId.indexOf('uniequip_001') != -1) {
                        continue;
                    }
                    if (first) {
                        replyModuleEmbed(interaction, moduleId);
                        first = false;
                    }
                    else {
                        sendModuleEmbed(interaction.channel, moduleId);
                    }
                    await wait(200);
                }
            }
            else {
                await interaction.reply('That operator doesn\'t have any modules!');
            }
        }
        else {
            await interaction.reply('That operator doesn\'t exist!');
        }
    }
}

async function replyModuleEmbed(interaction, moduleId: string) {
    let level = 0;
    const moduleEmbed = createModuleEmbed(moduleId, level);
    let response = await interaction.reply(moduleEmbed);

    while (true) {
        try {
            const confirm = await response.awaitMessageComponent({ time: 300000 });
            level = levelId[confirm.customId];
            try {
                await confirm.update({ content: '' });
            } catch (e) {
                continue;
            }
            response = await response.edit(createModuleEmbed(moduleId, level));
        } catch (e) {
            console.log(e);
            await response.edit({ embeds: moduleEmbed.embeds, files: moduleEmbed.files, components: [] });
            break;
        }
    }
}

async function sendModuleEmbed(channel, moduleId: string) {
    let level = 0;
    const moduleEmbed = createModuleEmbed(moduleId, level);
    let response = await channel.send(moduleEmbed);

    while (true) {
        try {
            const confirm = await response.awaitMessageComponent({ time: 300000 });
            level = levelId[confirm.customId];
            try {
                await confirm.update({ content: '' });
            } catch (e) {
                continue;
            }
            response = await response.edit(createModuleEmbed(moduleId, level));
        } catch (e) {
            console.log(e);
            await response.edit({ embeds: moduleEmbed.embeds, files: moduleEmbed.files, components: [] });
            break;
        }
    }
}

function createModuleEmbed(moduleId: string, level: number) {
    const moduleDict: { [key: string]: Module } = fetchModules();
    const module = moduleDict[moduleId]
    const moduleInfo = module.info;
    const moduleData = module.data;
    const moduleLevel = moduleData.phases[level];

    const icon = new AttachmentBuilder(iconPath);
    const image = new AttachmentBuilder(`./${moduleImagePath}/${moduleId}.png`);

    const name = `${moduleInfo.typeIcon.toUpperCase()} - ${moduleInfo.uniEquipName}`;

    let traitDescription = '', talentName = '', talentDescription = '';
    for (const part of moduleLevel.parts) {
        if (part.overrideTraitDataBundle.candidates != null) {
            const candidates = part.overrideTraitDataBundle.candidates;
            const candidate = candidates[candidates.length - 1];

            if (candidate.additionalDescription != null) {
                traitDescription += `${formatTextBlackboardTags(candidate.additionalDescription, candidate.blackboard)}\n`;
            }
            if (candidate.overrideDescripton != null) {
                traitDescription += `${formatTextBlackboardTags(candidate.overrideDescripton, candidate.blackboard)}\n`;
            }
        }
        if (part.addOrOverrideTalentDataBundle.candidates != null) {
            const candidates = part.addOrOverrideTalentDataBundle.candidates;
            const candidate = candidates[candidates.length - 1];

            if (candidate.name != null) {
                talentName = candidate.name;
            }
            if (candidate.upgradeDescription != null) {
                talentDescription += `${formatTextBlackboardTags(candidate.upgradeDescription, candidate.blackboard)}\n`;
            }
        }
    }

    const embed = new EmbedBuilder()
        .setColor(0xebca60)
        .setAuthor({ name: 'Hellabot', iconURL: `attachment://${iconPath}` })
        .setTitle(name)
        .setThumbnail(`attachment://${moduleId}.png`)
        .setDescription(traitDescription);

    if (talentName != '' && talentDescription != '') {
        embed.addFields({ name: `*Talent:* ${talentName}`, value: talentDescription });
    }

    const lOne = new ButtonBuilder()
        .setCustomId('l1')
        .setLabel('Lv1')
        .setStyle(ButtonStyle.Secondary);
    const lTwo = new ButtonBuilder()
        .setCustomId('l2')
        .setLabel('Lv2')
        .setStyle(ButtonStyle.Secondary);
    const lThree = new ButtonBuilder()
        .setCustomId('l3')
        .setLabel('Lv3')
        .setStyle(ButtonStyle.Secondary);

    switch (level) {
        case 0:
            lOne.setDisabled(true);
            break;
        case 1:
            lTwo.setDisabled(true);
            break;
        case 2:
            lThree.setDisabled(true);
            break;
    }

    const rowOne = new ActionRowBuilder().addComponents(lOne, lTwo, lThree);

    return { embeds: [embed], files: [icon, image], components: [rowOne] };
}