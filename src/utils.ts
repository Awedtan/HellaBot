import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
// const fs = require('fs');
const nodefetch = require('node-fetch');
const path = require('path');
const puppeteer = require('puppeteer');
const { paths, gameConsts } = require('./constants');
import { archetypeDict, baseDict, definitionDict, enemyDict, eventDict, itemDict, moduleDict, operatorDict, rangeDict, rogueThemeArr, skillDict, stageDict, skinDict, toughStageDict } from './data';
import type { Base, BaseInfo, Blackboard, CCStage, Definition, Enemy, Event, Item, LevelUpCost, Module, Paradox, Operator, RogueRelic, RogueStage, RogueTheme, RogueVariation, Skill, Stage, StageData } from "./types";

const embedColour = 0xebca60;

const cleanFilename = (text: string) => text.split(/%|[#\+]|&|\[|\]/).join(''); // Remove special characters that discord doesn't like (%, #, etc.)
// const fileExists = async (path: string) => !!(await fs.promises.stat(path).catch(e => false));
export const urlExists = async (url: string) => (await nodefetch(url)).status === 200;
function formatText(text: string, blackboard: Blackboard[]) { // Dumbass string manipulation
    if (text === null || text === undefined) return '';
    if (blackboard === null || blackboard === undefined) blackboard = [];

    text = text.trim();
    const skillKeys: { [key: string]: number | string } = {};
    for (const stat of blackboard) {
        const key = stat.key;
        const value = stat.value;
        const getKeyIndex = (text: string, key: string) => { // Probably the worst way to do this
            let tempText = text;
            let keyIndex = tempText.indexOf(key);
            for (let i = 0; i < 8; i++) { // Arbitrary loop limit to prevent accidental infinite loop, 99.8% chance this will not be a problem ever
                const nextChar = tempText.charAt(keyIndex + key.length);
                if (nextChar === ':' || nextChar === '}') break;
                tempText = tempText.substring(keyIndex + 1);
                keyIndex = tempText.indexOf(key);
            }
            return text.indexOf(tempText) + keyIndex;
        }

        // If a tag has a colon like "<tag_name:0>", the value should be a percentage and thus must be converted to one (0.2 => 20%)
        if (text.charAt(getKeyIndex(text, key) + key.length) === ':' || text.charAt(getKeyIndex(text, key.toUpperCase()) + key.length) === ':') {
            skillKeys[key] = `${Math.round(value * 100)}%`;
        }
        else {
            skillKeys[key] = value;
        }
    }

    const endTagRegex = /<\/[^<]*>/; // Checks for "</tag_name>"
    const tagRegex = /<.[a-z]{2,5}?\.[^<]+>|<color=[^<]*>|:0%|:0.0%|:0.0|(?<=[^0-9]):0/; // Absolute fuckery
    text = text.split(endTagRegex).join('').split(tagRegex).join('');

    // Split text into chunks, each blackboard tag should be in its own chunk
    const temp = text.split(/-?{-?|}/);
    for (let i = 0; i < temp.length; i++) {
        if (skillKeys.hasOwnProperty(temp[i].toLowerCase())) { // If current chunk is a tag, replace current chunk with tag value
            temp[i] = `\`${skillKeys[temp[i].toLowerCase()]}\``;
        }
    }
    text = temp.join('');

    return text;
};

function buildAuthorField(op: Operator) {
    // Unholy dumbness
    const urlName = op.data.name.toLowerCase().split(' the ').join('-').split('\'').join('').split(' ').join('-').split('ë').join('e').split('ł').join('l');
    const authorField = { name: op.data.name, iconURL: `attachment://${op.id}.png`, url: `https://gamepress.gg/arknights/operator/${urlName}` };
    return authorField;
}
export function buildBaseEmbed(base: Base, baseInfo: BaseInfo, op: Operator) {
    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);
    const thumbnailPath = paths.aceshipImageUrl + `/ui/infrastructure/skill/${base.skillIcon}.png`;
    const thumbnail = new AttachmentBuilder(thumbnailPath);

    const authorField = buildAuthorField(op);
    const title = `${base.buffName} - ${gameConsts.eliteLevels[baseInfo.cond.phase]} Lv${baseInfo.cond.level}`;
    const description = formatText(base.description, []);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(title)
        .setThumbnail(`attachment://${cleanFilename(base.skillIcon)}.png`)
        .setDescription(description);

    return { embeds: [embed], files: [avatar, thumbnail] };
}
export async function buildCcEmbed(stage: CCStage, page: number) {
    const stageInfo = stage.const;
    const stageData = stage.levels;

    const title = `${stageInfo.location} - ${stageInfo.name}`;
    const description = formatText(stageInfo.description, []);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setDescription(description);

    const enemyFields = buildStageEnemyFields(stageData);
    for (const field of enemyFields) {
        embed.addFields(field);
    }

    const imageButton = new ButtonBuilder()
        .setCustomId(`ccඞ${stage.const.name.toLowerCase()}ඞ0`)
        .setLabel('Preview')
        .setStyle(ButtonStyle.Primary);
    const diagramButton = new ButtonBuilder()
        .setCustomId(`ccඞ${stage.const.name.toLowerCase()}ඞ1`)
        .setLabel('Diagram')
        .setStyle(ButtonStyle.Primary);
    const buttonRow = new ActionRowBuilder().addComponents(imageButton, diagramButton);

    switch (page) {
        case 0:
            imageButton.setDisabled(true);
            break;
        case 1:
            diagramButton.setDisabled(true);
            break;
    }

    if (page === 0) {
        const imagePath = paths.myAssetUrl + `/stages/${stageInfo.code}.png`;
        if (await urlExists(imagePath)) {
            const image = new AttachmentBuilder(imagePath);
            embed.setImage(`attachment://${stageInfo.code}.png`)

            return { content: '', embeds: [embed], files: [image], components: [buttonRow] };
        }
        else {
            const diagramFields = buildStageDiagramFields(stageData);
            embed.addFields(diagramFields);

            return { content: '', embeds: [embed] };
        }
    }
    else {
        const diagramFields = buildStageDiagramFields(stageData);
        embed.addFields(diagramFields);

        return { content: '', embeds: [embed], files: [], components: [buttonRow] };
    }
}
export function buildCcSelectEmbed(season: string) {
    const names: string = gameConsts.ccSeasons[season];

    const ccSelector = new StringSelectMenuBuilder()
        .setCustomId(`ccඞselect`)
        .setPlaceholder('Select a stage!');
    const componentRow = new ActionRowBuilder().addComponents(ccSelector);

    for (const name of names) {
        ccSelector.addOptions(new StringSelectMenuOptionBuilder()
            .setLabel(name)
            .setValue(name.toLowerCase())
        );
    }

    return { content: `Please select a stage from CC#${season} below:`, components: [componentRow] };
}
export function buildCostEmbed(op: Operator, type: string) {
    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);

    const authorField = buildAuthorField(op);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)

    const eliteButton = new ButtonBuilder()
        .setCustomId(`costඞ${op.id}ඞelite`)
        .setLabel('Promotions')
        .setStyle(ButtonStyle.Primary);
    const skillButton = new ButtonBuilder()
        .setCustomId(`costඞ${op.id}ඞskill`)
        .setLabel('Skills')
        .setStyle(ButtonStyle.Primary);
    const masteryButton = new ButtonBuilder()
        .setCustomId(`costඞ${op.id}ඞmastery`)
        .setLabel('Masteries')
        .setStyle(ButtonStyle.Primary);
    const moduleButton = new ButtonBuilder()
        .setCustomId(`costඞ${op.id}ඞmodule`)
        .setLabel('Modules')
        .setStyle(ButtonStyle.Primary);
    const buttonRow = new ActionRowBuilder().addComponents(eliteButton, skillButton, masteryButton, moduleButton);

    if (op.data.skills.length == 0) {
        skillButton.setStyle(ButtonStyle.Secondary);
        skillButton.setDisabled(true);
    }
    if (op.data.rarity <= 2) {
        masteryButton.setStyle(ButtonStyle.Secondary);
        masteryButton.setDisabled(true);
    }
    if (op.modules.length == 0) {
        moduleButton.setStyle(ButtonStyle.Secondary);
        moduleButton.setDisabled(true);
    }

    let thumbnail;

    switch (type) {
        default:
        case 'elite': {
            eliteButton.setDisabled(true);

            const thumbnailPath = paths.aceshipImageUrl + `/items/sprite_exp_card_t4.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);

            embed.setThumbnail(`attachment://sprite_exp_card_t4.png`)
                .setTitle('Elite Upgrade Costs');

            for (let i = 0; i < op.data.phases.length; i++) {
                const phase = op.data.phases[i];
                if (phase.evolveCost === null) continue;

                let phaseDescription = buildCostString(phase.evolveCost);
                phaseDescription += `LMD **x${gameConsts.eliteLmdCost[op.data.rarity][i - 1]}**\n`;
                embed.addFields({ name: `Elite ${i}`, value: phaseDescription, inline: true });
            }
            break;
        }
        case 'skill': {
            skillButton.setDisabled(true);

            const thumbnailPath = paths.aceshipImageUrl + `/items/MTL_SKILL2.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);

            embed.setThumbnail(`attachment://MTL_SKILL2.png`)
                .setTitle('Skill Upgrade Costs');

            for (let i = 0; i < op.data.allSkillLvlup.length; i++) {
                const skillDescription = buildCostString(op.data.allSkillLvlup[i].lvlUpCost);
                if (skillDescription === '') continue;

                embed.addFields({ name: `Level ${i + 2}`, value: skillDescription, inline: true });
            }
            break;
        }
        case 'mastery': {
            masteryButton.setDisabled(true);

            const thumbnailPath = paths.aceshipImageUrl + `/items/MTL_SKILL3.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);

            embed.setThumbnail(`attachment://MTL_SKILL3.png`)
                .setTitle('Skill Mastery Costs');

            for (let i = 0; i < op.data.skills.length; i++) {
                const opSkill = op.data.skills[i];
                const skill = skillDict[opSkill.skillId];

                embed.addFields({ name: '\u200B', value: `**Skill ${i + 1} - ${skill.levels[0].name}**` });

                for (let i = 0; i < opSkill.levelUpCostCond.length; i++) {
                    const masteryDescription = buildCostString(opSkill.levelUpCostCond[i].levelUpCost);
                    embed.addFields({ name: `Mastery ${i + 1}`, value: masteryDescription, inline: true });
                }
            }
            break;
        }
        case 'module': {
            moduleButton.setDisabled(true);

            const thumbnailPath = paths.aceshipImageUrl + `/items/mod_unlock_token.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);

            embed.setThumbnail(`attachment://mod_unlock_token.png`)
                .setTitle('Module Upgrade Costs');

            for (const moduleId of op.modules) {
                if (moduleId.includes('uniequip_001')) continue;
                const module = moduleDict[moduleId];

                embed.addFields({ name: '\u200B', value: `**${module.info.typeIcon.toUpperCase()} - ${module.info.uniEquipName}**` });

                for (const key of Object.keys(module.info.itemCost)) {
                    const moduleDescription = buildCostString(module.info.itemCost[key]);
                    embed.addFields({ name: `Level ${key}`, value: moduleDescription, inline: true });
                }
            }
            break;
        }
    }

    return { embeds: [embed], files: [avatar, thumbnail], components: [buttonRow] };
}
export function buildCostString(costs: LevelUpCost[]) {
    let description = '';
    for (const cost of costs) {
        const item = itemDict[cost.id];
        description += `${item.data.name} **x${cost.count}**\n`;
    }
    return description;
}
export function buildDefineEmbed(definition: Definition) {
    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(definition.termName)
        .setDescription(formatText(definition.description, []));

    return { embeds: [embed] };
}
export function buildDefineListEmbed() {
    let statusDescription = '', effectDescription = '', groupDescription = '';
    for (const term of Object.values(definitionDict)) {
        const termName = term.termName;
        const termArr = term.termId.split('.');

        switch (termArr[0]) {
            case 'ba':
                statusDescription += `${termName}\n`;
                break;
            case 'cc':
                switch (termArr[1]) {
                    case ('g'):
                    case ('tag'):
                    case ('gvial'):
                        groupDescription += `${termName}\n`;
                        break;
                    default:
                        effectDescription += `${termName}\n`;
                        break;
                }
                break;
        }
    }

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle('List of In-Game Terms and Groups')
        .addFields(
            { name: 'Status Effects', value: statusDescription, inline: true },
            { name: 'Base Effects', value: effectDescription, inline: true },
            { name: 'Base Groups', value: groupDescription, inline: true }
        );

    return { embeds: [embed] };
}
export function buildEnemyEmbed(enemy: Enemy, level: number) {
    const enemyInfo = enemy.excel;
    const enemyData = enemy.levels.Value[level].enemyData;
    const baseData = enemy.levels.Value[0].enemyData;

    const thumbnailPath = paths.aceshipImageUrl + `/enemy/${enemyInfo.enemyId}.png`;
    const thumbnail = new AttachmentBuilder(thumbnailPath);

    const title = `${enemyInfo.enemyIndex} - ${enemyInfo.name}`;
    const description = `${formatText(enemyInfo.description, [])}\n\n${formatText(enemyInfo.ability, [])}`;

    const hp = enemyData.attributes.maxHp.m_defined ? enemyData.attributes.maxHp.m_value.toString() :
        baseData.attributes.maxHp.m_defined ? baseData.attributes.maxHp.m_value.toString() : '0';
    const atk = enemyData.attributes.atk.m_defined ? enemyData.attributes.atk.m_value.toString() :
        baseData.attributes.atk.m_defined ? baseData.attributes.atk.m_value.toString() : '0';
    const def = enemyData.attributes.def.m_defined ? enemyData.attributes.def.m_value.toString() :
        baseData.attributes.def.m_defined ? baseData.attributes.def.m_value.toString() : '0';
    const res = enemyData.attributes.magicResistance.m_defined ? enemyData.attributes.magicResistance.m_value.toString() :
        baseData.attributes.magicResistance.m_defined ? baseData.attributes.magicResistance.m_value.toString() : '0';
    const weight = enemyData.attributes.massLevel.m_defined ? enemyData.attributes.massLevel.m_value.toString() :
        baseData.attributes.massLevel.m_defined ? baseData.attributes.massLevel.m_value.toString() : '1';
    const life = enemyData.lifePointReduce.m_defined ? enemyData.lifePointReduce.m_value.toString() :
        baseData.lifePointReduce.m_defined ? baseData.lifePointReduce.m_value.toString() : '1';
    const silence = enemyData.attributes.silenceImmune.m_defined ? enemyData.attributes.silenceImmune.m_value :
        baseData.attributes.silenceImmune.m_defined ? baseData.attributes.silenceImmune.m_value.toString() : false;
    const stun = enemyData.attributes.stunImmune.m_defined ? enemyData.attributes.stunImmune.m_value :
        baseData.attributes.stunImmune.m_defined ? baseData.attributes.stunImmune.m_value.toString() : false;
    const sleep = enemyData.attributes.sleepImmune.m_defined ? enemyData.attributes.sleepImmune.m_value :
        baseData.attributes.sleepImmune.m_defined ? baseData.attributes.sleepImmune.m_value.toString() : false;
    const frozen = enemyData.attributes.frozenImmune.m_defined ? enemyData.attributes.frozenImmune.m_value :
        baseData.attributes.frozenImmune.m_defined ? baseData.attributes.frozenImmune.m_value.toString() : false;
    const levitate = enemyData.attributes.levitateImmune.m_defined ? enemyData.attributes.levitateImmune.m_value :
        baseData.attributes.levitateImmune.m_defined ? baseData.attributes.levitateImmune.m_value.toString() : false;

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setThumbnail(`attachment://${enemyInfo.enemyId}.png`)
        .setDescription(description)
        .addFields(
            { name: '❤️ HP', value: hp, inline: true },
            { name: '⚔️ ATK', value: atk, inline: true },
            { name: '🛡️ DEF', value: def, inline: true },
            { name: '✨ RES', value: res, inline: true },
            { name: '⚖️ Weight', value: weight, inline: true },
            { name: '💔 Life Points', value: life, inline: true },
            { name: 'Silence', value: silence ? '❌' : '✅', inline: true },
            { name: 'Stun', value: stun ? '❌' : '✅', inline: true },
            { name: 'Sleep', value: sleep ? '❌' : '✅', inline: true },
            { name: 'Freeze', value: frozen ? '❌' : '✅', inline: true },
            { name: 'Levitate', value: levitate ? '❌' : '✅', inline: true }
        );

    const enemyLevels = enemy.levels.Value.length;
    if (enemyLevels === 1)
        return { embeds: [embed], files: [thumbnail] };

    const buttonRow = new ActionRowBuilder<ButtonBuilder>();
    for (let i = 0; i < enemyLevels; i++) {
        buttonRow.addComponents(new ButtonBuilder()
            .setCustomId(`enemyඞ${enemy.excel.enemyId}ඞ${i}`)
            .setLabel(`Level ${i + 1}`)
            .setStyle(ButtonStyle.Primary)
        )
        if (i === level) {
            buttonRow.components[i].setDisabled(true);
        }
    }

    return { embeds: [embed], files: [thumbnail], components: [buttonRow] };
}
export function buildEventListEmbed(index: number) {
    const eventCount = 6;

    let eventArr = [];
    for (const event of Object.values(eventDict)) {
        const loginArr = ['LOGIN_ONLY', 'CHECKIN_ONLY', 'FLOAT_PARADE', 'PRAY_ONLY', 'GRID_GACHA_V2', 'GRID_GACHA']; // SKip login events
        if (loginArr.includes(event.type)) continue;
        eventArr.push(event);
    }
    eventArr.sort((first: Event, second: Event) => second.startTime - first.startTime); // Sort by descending start time

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle('List of In-Game Events')
        .setDescription(`**Page ${index + 1} of ${Math.ceil(eventArr.length / eventCount)}**`);

    for (let i = index * eventCount; i < index * eventCount + eventCount && i < eventArr.length; i++) {
        const event = eventArr[i];
        const startDate = new Date(event.startTime * 1000);
        const endDate = new Date(event.endTime * 1000);
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        embed.addFields({ name: event.name, value: `${months[startDate.getMonth()]} ${startDate.getDate()}, ${startDate.getFullYear()} - ${months[endDate.getMonth()]} ${endDate.getDate()}, ${endDate.getFullYear()}` })
    }

    const prevButton = new ButtonBuilder()
        .setCustomId(`eventsඞ${index - 1}`)
        .setLabel('Newer')
        .setStyle(ButtonStyle.Primary);
    const nextButton = new ButtonBuilder()
        .setCustomId(`eventsඞ${index + 1}`)
        .setLabel('Older')
        .setStyle(ButtonStyle.Primary);
    const componentRow = new ActionRowBuilder().addComponents(prevButton, nextButton);

    if (index === 0) {
        prevButton.setDisabled(true);
        prevButton.setStyle(ButtonStyle.Secondary);
    }
    if (index * eventCount + eventCount >= eventArr.length) {
        nextButton.setDisabled(true);
        nextButton.setStyle(ButtonStyle.Secondary);
    }

    return { embeds: [embed], components: [componentRow] };
}
export async function buildItemEmbed(item: Item) {
    const description = item.data.description !== null ? `${item.data.usage}\n\n${item.data.description}` : item.data.usage;

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(item.data.name)
        .setDescription(description);

    let stageString = '';
    for (const stageDrop of item.data.stageDropList) {
        const stageId = stageDrop.stageId;
        if (!stageId.includes('main') && !stageId.includes('sub')) continue;

        const stage = stageDict[stageId][0];
        stageString += `${stage.excel.code} - ${gameConsts.itemDropRarities[stageDrop.occPer]}\n`;
    }
    if (stageString !== '') {
        embed.addFields({ name: 'Drop Stages', value: stageString, inline: true });
    }
    if (item.formula !== null && item.formula.costs.length > 0) {
        const formulaString = buildCostString(item.formula.costs);
        embed.addFields({ name: 'Crafting Formula', value: formulaString, inline: true });
    }

    const imagePath = paths.aceshipImageUrl + `/items/${item.data.iconId}.png`;
    if (await urlExists(imagePath)) {
        const image = new AttachmentBuilder(imagePath);
        embed.setThumbnail(`attachment://${cleanFilename(item.data.iconId)}.png`);

        return { embeds: [embed], files: [image] };
    }
    else {
        return { embeds: [embed] };
    }
}
export function buildInfoEmbed(op: Operator, type: number, page: number, level: number) {
    const embedArr = [], fileArr = [], rowArr = [];

    const operatorEmbed = buildOperatorEmbed(op);
    for (const embed of operatorEmbed.embeds) {
        embedArr.push(embed);
    }
    for (const file of operatorEmbed.files) {
        fileArr.push(file);
    }

    const skillButton = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ1ඞ0ඞ0`)
        .setLabel('Skills')
        .setStyle(ButtonStyle.Success);
    const moduleButton = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ2ඞ0ඞ0`)
        .setLabel('Modules')
        .setStyle(ButtonStyle.Success);
    const artButton = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ3ඞ0ඞ0`)
        .setLabel('Art')
        .setStyle(ButtonStyle.Success);
    const baseButton = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ4ඞ0ඞ0`)
        .setLabel('Base Skills')
        .setStyle(ButtonStyle.Success);
    const costButton = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ5ඞ0ඞ0`)
        .setLabel('Costs')
        .setStyle(ButtonStyle.Success);
    const typeRow = new ActionRowBuilder().addComponents(skillButton, moduleButton, artButton, baseButton, costButton);

    if (op.data.skills.length === 0) {
        skillButton.setStyle(ButtonStyle.Secondary);
        skillButton.setDisabled(true);
    }
    if (op.modules.length === 0) {
        moduleButton.setStyle(ButtonStyle.Secondary);
        moduleButton.setDisabled(true);
    }
    if (!skinDict.hasOwnProperty(op.id)) {
        artButton.setStyle(ButtonStyle.Secondary);
        artButton.setDisabled(true);
    }
    if (op.bases.length === 0) {
        baseButton.setStyle(ButtonStyle.Secondary);
        baseButton.setDisabled(true);
    }
    if (op.data.rarity <= 1) {
        costButton.setStyle(ButtonStyle.Secondary);
        costButton.setDisabled(true);
    }

    switch (type) {
        case 0:
            break;
        case 1: {
            skillButton.setDisabled(true);

            const skillEmbed = buildInfoSkillEmbed(op, type, page, level);
            for (const embed of skillEmbed.embeds) {
                embedArr.push(embed);
            }
            for (const file of skillEmbed.files) {
                fileArr.push(file);
            }
            for (const componentRow of skillEmbed.components) {
                rowArr.push(componentRow);
            }

            const skillOne = new ButtonBuilder()
                .setCustomId(`info_skill1_nonexist`)
                .setLabel('Skill 1')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);
            const skillTwo = new ButtonBuilder()
                .setCustomId(`info_skill2_nonexist`)
                .setLabel('Skill 2')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);
            const skillThree = new ButtonBuilder()
                .setCustomId(`info_skill3_nonexist`)
                .setLabel('Skill 3')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);
            const skillRow = new ActionRowBuilder().addComponents(skillOne, skillTwo, skillThree);
            rowArr.push(skillRow);

            const skillArr = [skillOne, skillTwo, skillThree];
            for (let i = 0; i < op.data.skills.length; i++) {
                skillArr[i].setStyle(ButtonStyle.Primary);
                if (i !== page) {
                    skillArr[i].setCustomId(`infoඞ${op.id}ඞ${type}ඞ${i}ඞ${level}ඞskill`)
                    skillArr[i].setDisabled(false);
                }
                else {
                    skillArr[i].setCustomId(`info_skill_current`);
                }
            }
            break;
        }
        case 2: {
            moduleButton.setDisabled(true);

            const moduleEmbed = buildInfoModuleEmbed(op, type, page, level);
            for (const embed of moduleEmbed.embeds) {
                embedArr.push(embed);
            }
            for (const file of moduleEmbed.files) {
                fileArr.push(file);
            }
            for (const componentRow of moduleEmbed.components) {
                rowArr.push(componentRow);
            }

            const moduleOne = new ButtonBuilder()
                .setCustomId(`info_module1_nonexist`)
                .setLabel('Module 1')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);
            const moduleTwo = new ButtonBuilder()
                .setCustomId(`info_module2_nonexist`)
                .setLabel('Module 2')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);
            const moduleRow = new ActionRowBuilder().addComponents(moduleOne, moduleTwo);
            rowArr.push(moduleRow);

            const moduleArr = [moduleOne, moduleTwo];
            for (let i = 0; i < op.modules.length - 1; i++) {
                moduleArr[i].setStyle(ButtonStyle.Primary);
                if (i !== page) {
                    moduleArr[i].setCustomId(`infoඞ${op.id}ඞ${type}ඞ${i}ඞ${level}ඞmodule`)
                    moduleArr[i].setDisabled(false);
                }
                else {
                    moduleArr[i].setCustomId(`info_module_current`);
                }
            }
            break;
        }
        case 3: {
            artButton.setDisabled(true);

            const skinEmbed = buildInfoSkinEmbed(op, type, page, level);
            for (const embed of skinEmbed.embeds) {
                embedArr.push(embed);
            }
            for (const file of skinEmbed.files) {
                fileArr.push(file);
            }
            for (const componentRow of skinEmbed.components) {
                rowArr.push(componentRow);
            }
            break;
        }
        case 4: {
            baseButton.setDisabled(true);

            for (const baseInfo of op.bases) {
                const base = baseDict[baseInfo.buffId];
                const baseEmbed = buildBaseEmbed(base, baseInfo, op);
                for (const embed of baseEmbed.embeds) {
                    embedArr.push(embed);
                }
                for (const file of baseEmbed.files) {
                    fileArr.push(file);
                }
            }
            break;
        }
        case 5: {
            costButton.setDisabled(true);

            const costEmbed = buildInfoCostEmbed(op, type, page, level);
            for (const embed of costEmbed.embeds) {
                embedArr.push(embed);
            }
            for (const file of costEmbed.files) {
                fileArr.push(file);
            }
            for (const componentRow of costEmbed.components) {
                rowArr.push(componentRow);
            }
            break;
        }
    }

    rowArr.push(typeRow);

    return { embeds: embedArr, files: fileArr, components: rowArr };
}
export function buildInfoSkillEmbed(op: Operator, type: number, page: number, level: number) {
    const skill = skillDict[op.data.skills[page].skillId];
    const skillLevel = skill.levels[level];

    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);
    const thumbnailFilename = skill.iconId === null ? skill.skillId : skill.iconId;
    const thumbnailPath = paths.aceshipImageUrl + `/skills/skill_icon_${thumbnailFilename}.png`;
    const thumbnail = new AttachmentBuilder(thumbnailPath);

    const authorField = buildAuthorField(op);
    const title = `${skillLevel.name} - ${gameConsts.skillLevels[level]}`;

    const spCost = skillLevel.spData.spCost;
    const initSp = skillLevel.spData.initSp;
    const skillDuration = skillLevel.duration;
    const spType = gameConsts.spTypes[skillLevel.spData.spType];
    const skillType = gameConsts.skillTypes[skillLevel.skillType];

    let description = `**${spType} - ${skillType}**\n***Cost:* ${spCost} SP - *Initial:* ${initSp} SP`;
    if (skillDuration > 0) {
        description += ` - *Duration:* ${skillDuration} sec`;
    }
    description += `**\n${formatText(skillLevel.description, skillLevel.blackboard)} `;

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(title)
        .setThumbnail(`attachment://skill_icon_${cleanFilename(thumbnailFilename)}.png`)
        .setDescription(description);

    if (skillLevel.rangeId !== null) {
        const rangeField = buildRangeField(skillLevel.rangeId);
        embed.addFields(rangeField);
    }

    const lOne = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ${page}ඞ0ඞskill`)
        .setLabel('Lv1')
        .setStyle(ButtonStyle.Secondary);
    const lTwo = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ${page}ඞ1ඞskill`)
        .setLabel('Lv2')
        .setStyle(ButtonStyle.Secondary);
    const lThree = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ${page}ඞ2ඞskill`)
        .setLabel('Lv3')
        .setStyle(ButtonStyle.Secondary);
    const lFour = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ${page}ඞ3ඞskill`)
        .setLabel('Lv4')
        .setStyle(ButtonStyle.Secondary);
    const lFive = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ${page}ඞ4ඞskill`)
        .setLabel('Lv5')
        .setStyle(ButtonStyle.Secondary);
    const lSix = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ${page}ඞ5ඞskill`)
        .setLabel('Lv6')
        .setStyle(ButtonStyle.Secondary);
    const lSeven = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ${page}ඞ6ඞskill`)
        .setLabel('Lv7')
        .setStyle(ButtonStyle.Secondary);
    const mOne = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ${page}ඞ7ඞskill`)
        .setLabel('M1')
        .setStyle(ButtonStyle.Danger);
    const mTwo = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ${page}ඞ8ඞskill`)
        .setLabel('M2')
        .setStyle(ButtonStyle.Danger);
    const mThree = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ${page}ඞ9ඞskill`)
        .setLabel('M3')
        .setStyle(ButtonStyle.Danger);
    const rowOne = new ActionRowBuilder().addComponents(lOne, lTwo, lThree, lFour, lFive);
    const rowTwo = new ActionRowBuilder().addComponents(lSix, lSeven, mOne, mTwo, mThree);

    if (skill.levels.length === 7) {
        mOne.setDisabled(true);
        mTwo.setDisabled(true);
        mThree.setDisabled(true);
    }

    switch (level) {
        case 0:
            lOne.setCustomId(`info_skill_currentlevel`);
            lOne.setDisabled(true);
            break;
        case 1:
            lTwo.setCustomId(`info_skill_currentlevel`);
            lTwo.setDisabled(true);
            break;
        case 2:
            lThree.setCustomId(`info_skill_currentlevel`);
            lThree.setDisabled(true);
            break;
        case 3:
            lFour.setCustomId(`info_skill_currentlevel`);
            lFour.setDisabled(true);
            break;
        case 4:
            lFive.setCustomId(`info_skill_currentlevel`);
            lFive.setDisabled(true);
            break;
        case 5:
            lSix.setCustomId(`info_skill_currentlevel`);
            lSix.setDisabled(true);
            break;
        case 6:
            lSeven.setCustomId(`info_skill_currentlevel`);
            lSeven.setDisabled(true);
            break;
        case 7:
            mOne.setCustomId(`info_skill_currentlevel`);
            mOne.setDisabled(true);
            break;
        case 8:
            mTwo.setCustomId(`info_skill_currentlevel`);
            mTwo.setDisabled(true);
            break;
        case 9:
            mThree.setCustomId(`info_skill_currentlevel`);
            mThree.setDisabled(true);
            break;
    }

    return { embeds: [embed], files: [avatar, thumbnail], components: [rowOne, rowTwo] };
}
export function buildInfoModuleEmbed(op: Operator, type: number, page: number, level: number) {
    const module = moduleDict[op.modules[page + 1]];
    const moduleLevel = module.data.phases[level];

    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);
    const thumbnailPath = paths.aceshipImageUrl + `/equip/icon/${module.info.uniEquipId}.png`;
    const thumbnail = new AttachmentBuilder(thumbnailPath);

    const authorField = buildAuthorField(op);
    const title = `${module.info.typeIcon.toUpperCase()} ${module.info.uniEquipName} - Lv${level + 1}`;

    let description = '', talentName = '', talentDescription = '';
    for (const part of moduleLevel.parts) {
        if (part.overrideTraitDataBundle.candidates !== null) {
            const candidates = part.overrideTraitDataBundle.candidates;
            const candidate = candidates[candidates.length - 1];

            if (candidate.additionalDescription !== null) {
                description += `${formatText(candidate.additionalDescription, candidate.blackboard)}\n`;
            }
            if (candidate.overrideDescripton !== null) {
                description += `${formatText(candidate.overrideDescripton, candidate.blackboard)}\n`;
            }
        }
        if (part.addOrOverrideTalentDataBundle.candidates !== null) {
            const candidates = part.addOrOverrideTalentDataBundle.candidates;
            const candidate = candidates[candidates.length - 1];

            if (candidate.name !== null) {
                talentName = candidate.name;
            }
            if (candidate.upgradeDescription !== null) {
                talentDescription += `${formatText(candidate.upgradeDescription, candidate.blackboard)}\n`;
            }
        }
    }

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(title)
        .setThumbnail(`attachment://${module.info.uniEquipId}.png`)
        .setDescription(description);

    if (talentName !== '' && talentDescription !== '') {
        embed.addFields({ name: `*Talent:* ${talentName}`, value: talentDescription });
    }

    let statDescription = '';
    for (const attribute of moduleLevel.attributeBlackboard) {
        if (attribute.value > 0) {
            statDescription += `${attribute.key.toUpperCase()} +${attribute.value}\n`;
        }
        else {
            statDescription += `${attribute.key.toUpperCase()} ${attribute.value}\n`;
        }
    }
    embed.addFields({ name: `Stats`, value: statDescription });

    const lOne = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ${page}ඞ0ඞmodule`)
        .setLabel('Lv1')
        .setStyle(ButtonStyle.Secondary);
    const lTwo = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ${page}ඞ1ඞmodule`)
        .setLabel('Lv2')
        .setStyle(ButtonStyle.Secondary);
    const lThree = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ${page}ඞ2ඞmodule`)
        .setLabel('Lv3')
        .setStyle(ButtonStyle.Secondary);
    const rowOne = new ActionRowBuilder().addComponents(lOne, lTwo, lThree);

    switch (level) {
        case 0:
            lOne.setCustomId(`info_module_currentlevel`);
            lOne.setDisabled(true);
            break;
        case 1:
            lOne.setCustomId(`info_module_currentlevel`);
            lTwo.setDisabled(true);
            break;
        case 2:
            lOne.setCustomId(`info_module_currentlevel`);
            lThree.setDisabled(true);
            break;
    }

    return { embeds: [embed], files: [avatar, thumbnail], components: [rowOne] };
}
export function buildInfoSkinEmbed(op: Operator, type: number, page: number, level: number) {
    const skins = skinDict[op.id];
    const skin = skins[page];
    const displaySkin = skin.displaySkin;

    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);
    const imagePath = paths.aceshipImageUrl + `/characters/${encodeURIComponent(skin.portraitId)}.png`;
    const image = new AttachmentBuilder(imagePath);

    const authorField = buildAuthorField(op);
    const skinName = displaySkin.skinName;
    const skinGroupName = displaySkin.skinGroupName;
    const name = skinName === null ? skinGroupName : `${skinGroupName} - ${skinName}`;

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(`${name}`)
        .setImage(`attachment://${cleanFilename(encodeURIComponent(skin.portraitId))}.png`);

    let artistString = '';
    for (const drawer of displaySkin.drawerList) {
        artistString += drawer + '\n';
    }
    if (artistString !== '') {
        embed.addFields({ name: displaySkin.drawerList.length > 1 ? 'Artists' : 'Artist', value: artistString });
    }

    let thumbnail;
    switch (displaySkin.skinGroupId) {
        case 'ILLUST_0': {
            const thumbnailPath = paths.aceshipImageUrl + `/ui/elite/0.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);
            embed.setThumbnail(`attachment://0.png`);
            break;
        }
        case 'ILLUST_1': {
            const thumbnailPath = paths.aceshipImageUrl + `/ui/elite/1.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);
            embed.setThumbnail(`attachment://1.png`);
            break;
        }
        case 'ILLUST_2': {
            const thumbnailPath = paths.aceshipImageUrl + `/ui/elite/2.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);
            embed.setThumbnail(`attachment://2.png`);
            break;
        }
        case 'ILLUST_3': {
            const thumbnailPath = paths.aceshipImageUrl + `/ui/elite/3.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);
            embed.setThumbnail(`attachment://3.png`);
            break;
        }
        default: {
            const split = displaySkin.skinGroupId.split('#');
            const newSkinGroupId = `${split[0]}#${split[1]}`;
            const thumbnailPath = paths.myAssetUrl + `/skingroups/${encodeURIComponent(newSkinGroupId)}.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);
            embed.setThumbnail(`attachment://${cleanFilename(encodeURIComponent(newSkinGroupId))}.png`);
            break;
        }
    }

    const defaultSkinArr = new ActionRowBuilder();
    const skinArr = new ActionRowBuilder();
    const components = [];

    for (let i = 0; i < skins.length; i++) {
        const skinGroup = skins[i].displaySkin.skinGroupName;

        const skinButton = new ButtonBuilder()
            .setCustomId(`infoඞ${op.id}ඞ${type}ඞ${i}ඞ${level}ඞskin`)
            .setLabel(skinGroup)
            .setStyle(ButtonStyle.Primary);

        if (skinGroup === 'Default Outfit') {
            defaultSkinArr.addComponents(skinButton);
            components[0] = defaultSkinArr;
        }
        else {
            skinArr.addComponents(skinButton);
            components[1] = skinArr;
        }

        if (i === page) {
            skinButton.setDisabled(true);
            skinButton.setCustomId(`info_skin_currentpage`);
        }
    }

    return { embeds: [embed], files: [image, avatar, thumbnail], components: components };
}
export function buildInfoCostEmbed(op: Operator, type: number, page: number, level: number) {
    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);

    const authorField = buildAuthorField(op);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)

    const eliteButton = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ0ඞ${level}ඞcost`)
        .setLabel('Promotions')
        .setStyle(ButtonStyle.Primary);
    const skillButton = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ1ඞ${level}ඞcost`)
        .setLabel('Skills')
        .setStyle(ButtonStyle.Primary);
    const masteryButton = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ2ඞ${level}ඞcost`)
        .setLabel('Masteries')
        .setStyle(ButtonStyle.Primary);
    const moduleButton = new ButtonBuilder()
        .setCustomId(`infoඞ${op.id}ඞ${type}ඞ3ඞ${level}ඞcost`)
        .setLabel('Modules')
        .setStyle(ButtonStyle.Primary);
    const buttonRow = new ActionRowBuilder().addComponents(eliteButton, skillButton, masteryButton, moduleButton);

    if (op.data.skills.length == 0) {
        skillButton.setStyle(ButtonStyle.Secondary);
        skillButton.setDisabled(true);
    }
    if (op.data.rarity <= 2) {
        masteryButton.setStyle(ButtonStyle.Secondary);
        masteryButton.setDisabled(true);
    }
    if (op.modules.length == 0) {
        moduleButton.setStyle(ButtonStyle.Secondary);
        moduleButton.setDisabled(true);
    }

    let thumbnail;

    switch (page) {
        default:
        case 0: {
            eliteButton.setDisabled(true);

            const thumbnailPath = paths.aceshipImageUrl + `/items/sprite_exp_card_t4.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);

            embed.setThumbnail(`attachment://sprite_exp_card_t4.png`)
                .setTitle('Elite Upgrade Costs');

            for (let i = 0; i < op.data.phases.length; i++) {
                const phase = op.data.phases[i];
                if (phase.evolveCost === null) continue;

                let phaseDescription = buildCostString(phase.evolveCost);
                phaseDescription += `LMD **x${gameConsts.eliteLmdCost[op.data.rarity][i - 1]}**\n`;
                embed.addFields({ name: `Elite ${i}`, value: phaseDescription, inline: true });
            }
            break;
        }
        case 1: {
            skillButton.setDisabled(true);

            const thumbnailPath = paths.aceshipImageUrl + `/items/MTL_SKILL2.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);

            embed.setThumbnail(`attachment://MTL_SKILL2.png`)
                .setTitle('Skill Upgrade Costs');

            for (let i = 0; i < op.data.allSkillLvlup.length; i++) {
                const skillDescription = buildCostString(op.data.allSkillLvlup[i].lvlUpCost);
                if (skillDescription === '') continue;

                embed.addFields({ name: `Level ${i + 2}`, value: skillDescription, inline: true });
            }
            break;
        }
        case 2: {
            masteryButton.setDisabled(true);

            const thumbnailPath = paths.aceshipImageUrl + `/items/MTL_SKILL3.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);

            embed.setThumbnail(`attachment://MTL_SKILL3.png`)
                .setTitle('Skill Mastery Costs');

            for (let i = 0; i < op.data.skills.length; i++) {
                const opSkill = op.data.skills[i];
                const skill = skillDict[opSkill.skillId];

                embed.addFields({ name: '\u200B', value: `**Skill ${i + 1} - ${skill.levels[0].name}**` });

                for (let i = 0; i < opSkill.levelUpCostCond.length; i++) {
                    const masteryDescription = buildCostString(opSkill.levelUpCostCond[i].levelUpCost);
                    embed.addFields({ name: `Mastery ${i + 1}`, value: masteryDescription, inline: true });
                }
            }
            break;
        }
        case 3: {
            moduleButton.setDisabled(true);

            const thumbnailPath = paths.aceshipImageUrl + `/items/mod_unlock_token.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);

            embed.setThumbnail(`attachment://mod_unlock_token.png`)
                .setTitle('Module Upgrade Costs');

            for (const moduleId of op.modules) {
                if (moduleId.includes('uniequip_001')) continue;
                const module = moduleDict[moduleId];

                embed.addFields({ name: '\u200B', value: `**${module.info.typeIcon.toUpperCase()} - ${module.info.uniEquipName}**` });

                for (const key of Object.keys(module.info.itemCost)) {
                    const moduleDescription = buildCostString(module.info.itemCost[key]);
                    embed.addFields({ name: `Level ${key}`, value: moduleDescription, inline: true });
                }
            }
            break;
        }
    }

    return { embeds: [embed], files: [avatar, thumbnail], components: [buttonRow] };
}
export function buildModuleEmbed(module: Module, op: Operator, level: number) {
    const moduleLevel = module.data.phases[level];

    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);
    const thumbnailPath = paths.aceshipImageUrl + `/equip/icon/${module.info.uniEquipId}.png`;
    const thumbnail = new AttachmentBuilder(thumbnailPath);

    const authorField = buildAuthorField(op);
    const title = `${module.info.typeIcon.toUpperCase()} ${module.info.uniEquipName} - Lv${level + 1}`;

    let description = '', talentName = '', talentDescription = '';
    for (const part of moduleLevel.parts) {
        if (part.overrideTraitDataBundle.candidates !== null) {
            const candidates = part.overrideTraitDataBundle.candidates;
            const candidate = candidates[candidates.length - 1];

            if (candidate.additionalDescription !== null) {
                description += `${formatText(candidate.additionalDescription, candidate.blackboard)}\n`;
            }
            if (candidate.overrideDescripton !== null) {
                description += `${formatText(candidate.overrideDescripton, candidate.blackboard)}\n`;
            }
        }
        if (part.addOrOverrideTalentDataBundle.candidates !== null) {
            const candidates = part.addOrOverrideTalentDataBundle.candidates;
            const candidate = candidates[candidates.length - 1];

            if (candidate.name !== null) {
                talentName = candidate.name;
            }
            if (candidate.upgradeDescription !== null) {
                talentDescription += `${formatText(candidate.upgradeDescription, candidate.blackboard)}\n`;
            }
        }
    }

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(title)
        .setThumbnail(`attachment://${module.info.uniEquipId}.png`)
        .setDescription(description);

    if (talentName !== '' && talentDescription !== '') {
        embed.addFields({ name: `*Talent:* ${talentName}`, value: talentDescription });
    }

    let statDescription = '';
    for (const attribute of moduleLevel.attributeBlackboard) {
        if (attribute.value > 0) {
            statDescription += `${attribute.key.toUpperCase()} +${attribute.value}\n`;
        }
        else {
            statDescription += `${attribute.key.toUpperCase()} ${attribute.value}\n`;
        }
    }
    embed.addFields({ name: `Stats`, value: statDescription });

    const lOne = new ButtonBuilder()
        .setCustomId(`moduleඞ${module.info.uniEquipId}ඞ${op.id}ඞ0`)
        .setLabel('Lv1')
        .setStyle(ButtonStyle.Secondary);
    const lTwo = new ButtonBuilder()
        .setCustomId(`moduleඞ${module.info.uniEquipId}ඞ${op.id}ඞ1`)
        .setLabel('Lv2')
        .setStyle(ButtonStyle.Secondary);
    const lThree = new ButtonBuilder()
        .setCustomId(`moduleඞ${module.info.uniEquipId}ඞ${op.id}ඞ2`)
        .setLabel('Lv3')
        .setStyle(ButtonStyle.Secondary);
    const rowOne = new ActionRowBuilder().addComponents(lOne, lTwo, lThree);

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

    return { embeds: [embed], files: [thumbnail, avatar], components: [rowOne] };
}
export function buildOperatorEmbed(op: Operator) {
    const opMax = op.data.phases[op.data.phases.length - 1];

    const thumbnailPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const thumbnail = new AttachmentBuilder(thumbnailPath);

    const authorField = buildAuthorField(op);
    let title = `${op.data.name} - `;
    for (let i = 0; i <= op.data.rarity; i++) {
        title += '★';
    }

    let description = formatText(op.data.description, []);
    if (op.data.trait !== null) {
        const candidate = op.data.trait.candidates[op.data.trait.candidates.length - 1];
        if (candidate.overrideDescripton !== null) {
            description = formatText(candidate.overrideDescripton, candidate.blackboard);
        }
    }
    const descriptionField = { name: `${gameConsts.professions[op.data.profession]} - ${archetypeDict[op.data.subProfessionId]}`, value: description };
    const rangeField = buildRangeField(opMax.rangeId);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(authorField.url)
        .setThumbnail(`attachment://${op.id}.png`)
        .addFields(descriptionField, rangeField);

    if (op.data.talents !== null) {
        for (const talent of op.data.talents) {
            const candidate = talent.candidates[talent.candidates.length - 1];
            embed.addFields({ name: `*Talent:* ${candidate.name}`, value: formatText(candidate.description, []) });
        }
    }

    let potentialString = '';
    for (const potential of op.data.potentialRanks) {
        potentialString += `${potential.description}\n`;
    }
    if (potentialString !== '') {
        embed.addFields({ name: 'Potentials', value: potentialString, inline: true });
    }

    let trustString = '';
    const trustBonus: { [key: string]: number | boolean } = op.data.favorKeyFrames[1].data;
    for (const trustKey of Object.keys(trustBonus)) {
        const trustValue = trustBonus[trustKey];
        if (trustValue !== 0 && trustValue !== 0.0 && trustValue !== false) {
            trustString += `${trustKey.toUpperCase()} +${trustValue}\n`;
        }
    }
    if (trustString !== '') {
        embed.addFields({ name: 'Trust Bonus', value: trustString, inline: true });
    }

    const maxStats = opMax.attributesKeyFrames[1].data;
    const hp = maxStats.maxHp.toString();
    const atk = maxStats.atk.toString();
    const def = maxStats.def.toString();
    const res = maxStats.magicResistance.toString();
    const dpCost = maxStats.cost.toString();
    const block = maxStats.blockCnt.toString();
    const redeploy = maxStats.respawnTime.toString();
    const atkInterval = maxStats.baseAttackTime.toString();

    embed.addFields(
        { name: '\u200B', value: '**Max Stats**' },
        { name: '❤️ HP', value: hp, inline: true },
        { name: '⚔️ ATK', value: atk, inline: true },
        { name: '🛡️ DEF', value: def, inline: true },
        { name: '✨ RES', value: res, inline: true },
        { name: '🏁 DP', value: dpCost, inline: true },
        { name: '✋ Block', value: block, inline: true },
        { name: '⌛ Redeploy Time', value: redeploy, inline: true },
        { name: '⏱️ Attack Interval', value: atkInterval, inline: true },
    );

    return { embeds: [embed], files: [thumbnail] };
}
export async function buildParadoxEmbed(paradox: Paradox, page: number) {
    const stageInfo = paradox.excel;
    const stageData = paradox.levels;
    const op = operatorDict[stageInfo.charId];

    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);

    const authorField = buildAuthorField(op);
    const title = `Paradox Simulation - ${stageInfo.name}`;
    const description = formatText(stageInfo.description, []);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(title)
        .setDescription(description);

    const enemyFields = buildStageEnemyFields(stageData);
    for (const field of enemyFields) {
        embed.addFields(field);
    }

    const imageButton = new ButtonBuilder()
        .setCustomId(`paradoxඞ${stageInfo.charId}ඞ0`)
        .setLabel('Preview')
        .setStyle(ButtonStyle.Primary);
    const diagramButton = new ButtonBuilder()
        .setCustomId(`paradoxඞ${stageInfo.charId}ඞ1`)
        .setLabel('Diagram')
        .setStyle(ButtonStyle.Primary);
    const buttonRow = new ActionRowBuilder().addComponents(imageButton, diagramButton);

    switch (page) {
        case 0:
            imageButton.setDisabled(true);
            break;
        case 1:
            diagramButton.setDisabled(true);
            break;
    }

    if (page === 0) {
        const imagePath = paths.myAssetUrl + `/stages/${stageInfo.stageId}.png`;
        if (await urlExists(imagePath)) {
            const image = new AttachmentBuilder(imagePath);
            embed.setImage(`attachment://${stageInfo.stageId}.png`)

            return { embeds: [embed], files: [avatar, image], components: [buttonRow] };
        }
        else {
            const diagramFields = buildStageDiagramFields(stageData);
            embed.addFields(diagramFields);

            return { embeds: [embed], files: [avatar] };
        }
    }
    else {
        const diagramFields = buildStageDiagramFields(stageData);
        embed.addFields(diagramFields);

        return { embeds: [embed], files: [avatar], components: [buttonRow] };
    }
}
function buildRangeField(rangeId: string) {
    const range = rangeDict[rangeId];

    let left = 0, right = 0, top = 0, bottom = 0;
    for (const square of range.grids) {
        if (square.col < left)
            left = square.col
        else if (square.col > right)
            right = square.col;
        if (square.row < bottom)
            bottom = square.row
        else if (square.row > top)
            top = square.row;
    }

    const arrCols = right - left + 1;
    const arrRows = top - bottom + 1;
    const rangeArr = new Array(arrCols);
    for (let i = 0; i < arrCols; i++) {
        rangeArr[i] = new Array(arrRows);
    }
    for (const square of range.grids) {
        rangeArr[square.col - left][-square.row - bottom] = 1;
    }
    rangeArr[-left][-bottom] = 2;

    let rangeString = '';
    for (let i = 0; i < arrRows; i++) {
        for (let j = 0; j < arrCols; j++) {
            switch (rangeArr[j][i]) {
                case (1):
                    rangeString += '🔳';
                    break;
                case (2):
                    rangeString += '🟦';
                    break;
                default:
                    rangeString += '⬛';
                    break;
            }
        }
        rangeString += '\n';
    }
    return { name: 'Range', value: rangeString };
}
export function buildRecruitEmbed(qual: string, value: number, tag: string, select: boolean) {
    if (tag !== '') {
        if (select) {
            value *= gameConsts.tagValues[tag];
        }
        else {
            value /= gameConsts.tagValues[tag];
        }
    }

    const buttonConstId = `recruitඞ${qual}ඞ${value}`;

    const meleeButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞmeleeඞselect`)
        .setLabel('Melee')
        .setStyle(ButtonStyle.Secondary);
    const rangedButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞrangedඞselect`)
        .setLabel('Ranged')
        .setStyle(ButtonStyle.Secondary);
    const guardButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞguardඞselect`)
        .setLabel('Guard')
        .setStyle(ButtonStyle.Secondary);
    const medicButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞmedicඞselect`)
        .setLabel('Medic')
        .setStyle(ButtonStyle.Secondary);
    const vanguardButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞvanguardඞselect`)
        .setLabel('Vanguard')
        .setStyle(ButtonStyle.Secondary);
    const casterButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞcasterඞselect`)
        .setLabel('Caster')
        .setStyle(ButtonStyle.Secondary);
    const sniperButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞsniperඞselect`)
        .setLabel('Sniper')
        .setStyle(ButtonStyle.Secondary);
    const defenderButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞdefenderඞselect`)
        .setLabel('Defender')
        .setStyle(ButtonStyle.Secondary);
    const supporterButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞsupporterඞselect`)
        .setLabel('Supporter')
        .setStyle(ButtonStyle.Secondary);
    const specialistButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞspecialistඞselect`)
        .setLabel('Specialist')
        .setStyle(ButtonStyle.Secondary);
    const healingButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞhealingඞselect`)
        .setLabel('Healing')
        .setStyle(ButtonStyle.Secondary);
    const supportButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞsupportඞselect`)
        .setLabel('Support')
        .setStyle(ButtonStyle.Secondary);
    const dpsButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞdpsඞselect`)
        .setLabel('DPS')
        .setStyle(ButtonStyle.Secondary);
    const aoeButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞaoeඞselect`)
        .setLabel('AOE')
        .setStyle(ButtonStyle.Secondary);
    const slowButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞslowඞselect`)
        .setLabel('Slow')
        .setStyle(ButtonStyle.Secondary);
    const survivalButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞsurvivalඞselect`)
        .setLabel('Survival')
        .setStyle(ButtonStyle.Secondary);
    const defenseButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞdefenseඞselect`)
        .setLabel('Defense')
        .setStyle(ButtonStyle.Secondary);
    const debuffButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞdebuffඞselect`)
        .setLabel('Debuff')
        .setStyle(ButtonStyle.Secondary);
    const shiftButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞshiftඞselect`)
        .setLabel('Shift')
        .setStyle(ButtonStyle.Secondary);
    const crowdControlButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞcrowd-controlඞselect`)
        .setLabel('Crowd Control')
        .setStyle(ButtonStyle.Secondary);
    const nukerButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞnukerඞselect`)
        .setLabel('Nuker')
        .setStyle(ButtonStyle.Secondary);
    const summonButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞsummonඞselect`)
        .setLabel('Summon')
        .setStyle(ButtonStyle.Secondary);
    const fastRedeployButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞfast-redeployඞselect`)
        .setLabel('Fast-Redeploy')
        .setStyle(ButtonStyle.Secondary);
    const dpRecoveryButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞdp-recoveryඞselect`)
        .setLabel('DP-Recovery')
        .setStyle(ButtonStyle.Secondary);
    const robotButton = new ButtonBuilder()
        .setCustomId(`${buttonConstId}ඞrobotඞselect`)
        .setLabel('Robot')
        .setStyle(ButtonStyle.Secondary);

    const components = [];
    components.push(new ActionRowBuilder().addComponents(meleeButton, rangedButton, guardButton, medicButton, vanguardButton));
    components.push(new ActionRowBuilder().addComponents(casterButton, sniperButton, defenderButton, supporterButton, specialistButton));
    components.push(new ActionRowBuilder().addComponents(healingButton, supportButton, dpsButton, aoeButton, slowButton));
    components.push(new ActionRowBuilder().addComponents(survivalButton, defenseButton, debuffButton, shiftButton, crowdControlButton));
    components.push(new ActionRowBuilder().addComponents(nukerButton, summonButton, fastRedeployButton, dpRecoveryButton, robotButton));

    const selectedButtons = [];

    for (const actionRow of components) {
        for (const button of actionRow.components) {
            const buttonTag = button.data.custom_id.split('ඞ')[3];
            const buttonValue = gameConsts.tagValues[buttonTag];

            if (value % buttonValue !== 0) continue;

            selectedButtons.push(button);
        }
    }

    for (const button of selectedButtons) {
        button.setCustomId(button.data.custom_id.replace('select', 'deselect'));
        button.setStyle(ButtonStyle.Primary);
    }

    if (selectedButtons.length >= 5) {
        for (const actionRow of components) {
            for (const button of actionRow.components) {
                if (selectedButtons.includes(button)) continue;

                button.setDisabled(true);
            }
        }
    }

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Recruitment Calculator');

    const opArr: Operator[] = [];

    if (selectedButtons.length >= 1) {
        for (const opId of Object.values(gameConsts.recruitPool)) {
            const op = operatorDict[String(opId)];
            if (op.recruitId % value !== 0) continue;
            if (qual !== null && qual !== 'null' && op.data.rarity !== gameConsts.qualifications[qual]) continue;

            opArr.push(op);
        }
    }

    opArr.sort(function (a, b) { return b.data.rarity - a.data.rarity });

    let opCount = 0;

    for (const op of opArr) {
        let rarity = '';
        for (let i = 0; i <= op.data.rarity; i++) {
            rarity += '★';
        }
        if (opCount <= 23) {
            embed.addFields({ name: op.data.name, value: rarity, inline: true });
        }
        opCount++;
    }

    if (opCount >= 25) {
        embed.addFields({ name: '\u200B', value: `${opCount - 24} more...`, inline: true });
    }

    return { embeds: [embed], components: components };
}
export async function buildRogueRelicEmbed(relic: RogueRelic) {
    const description = `***Cost:* ${relic.value}▲**\n${relic.description !== null ? `${relic.usage}\n\n${relic.description}` : relic.usage}`;

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(relic.name)
        .setDescription(description);

    const imagePath = paths.myAssetUrl + `/rogueitems/${relic.iconId}.png`;
    if (await urlExists(imagePath)) {
        const image = new AttachmentBuilder(imagePath);
        embed.setThumbnail(`attachment://${cleanFilename(relic.iconId)}.png`);

        return { embeds: [embed], files: [image] };
    }
    else {
        return { embeds: [embed] };
    }
}
export function buildRogueRelicListEmbed(theme: number, index: number) {
    const rogueTheme = rogueThemeArr[theme];
    const descriptionLengthLimit = 24;
    const columnCount = 2;

    let descriptionArr = [], i = 0;
    for (const relic of Object.values(rogueTheme.relicDict)) {
        if (descriptionArr[i] === undefined) {
            descriptionArr[i] = { string: '', length: 0 };
        }
        if (descriptionArr[i].length > descriptionLengthLimit) {
            i++;
            descriptionArr[i] = { string: '', length: 0 };
        }

        descriptionArr[i].string += `${relic.name}\n`
        descriptionArr[i].length++;
    }

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(`List of ${rogueTheme.name} Relics`)
        .setDescription(`**Page ${index + 1} of ${Math.ceil(descriptionArr.length / columnCount)}**`);

    for (let i = index * columnCount; i < index * columnCount + columnCount && i < descriptionArr.length; i++) {
        embed.addFields({ name: '\u200B', value: descriptionArr[i].string, inline: true });
    }

    const prevButton = new ButtonBuilder()
        .setCustomId(`rogueඞrelicඞ${theme}ඞ${index - 1}`)
        .setLabel('Previous')
        .setStyle(ButtonStyle.Primary);
    const nextButton = new ButtonBuilder()
        .setCustomId(`rogueඞrelicඞ${theme}ඞ${index + 1}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary);
    const componentRow = new ActionRowBuilder().addComponents(prevButton, nextButton);

    if (index === 0) {
        prevButton.setDisabled(true);
        prevButton.setStyle(ButtonStyle.Secondary);
    }
    if (index * columnCount + columnCount >= descriptionArr.length) {
        nextButton.setDisabled(true);
        nextButton.setStyle(ButtonStyle.Secondary);
    }

    return { embeds: [embed], components: [componentRow] };
}
export async function buildRogueStageEmbed(theme: number, stage: RogueStage, page: number) {
    const stageInfo = stage.excel;
    const stageData = stage.levels;
    const isChallenge = stageInfo.difficulty !== 'NORMAL';

    const title = isChallenge ? `Emergency ${stageInfo.code} - ${stageInfo.name}` : `${stageInfo.code} - ${stageInfo.name}`;
    const description = isChallenge ? formatText(`${stageInfo.description}\n${stageInfo.eliteDesc}`, []) : formatText(stageInfo.description, []);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setDescription(description);

    const enemyFields = buildStageEnemyFields(stageData);
    for (const field of enemyFields) {
        embed.addFields(field);
    }

    const imageButton = new ButtonBuilder()
        .setCustomId(`rogueඞstageඞ${theme}ඞ${stage.excel.name.toLowerCase()}ඞ${isChallenge}ඞ0`)
        .setLabel('Preview')
        .setStyle(ButtonStyle.Primary);
    const diagramButton = new ButtonBuilder()
        .setCustomId(`rogueඞstageඞ${theme}ඞ${stage.excel.name.toLowerCase()}ඞ${isChallenge}ඞ1`)
        .setLabel('Diagram')
        .setStyle(ButtonStyle.Primary);
    const buttonRow = new ActionRowBuilder().addComponents(imageButton, diagramButton);

    switch (page) {
        case 0:
            imageButton.setDisabled(true);
            break;
        case 1:
            diagramButton.setDisabled(true);
            break;
    }

    if (page === 0) {
        const imagePath = paths.myAssetUrl + `/stages/${stageInfo.id}.png`;
        if (await urlExists(imagePath)) {
            const image = new AttachmentBuilder(imagePath);
            embed.setImage(`attachment://${stageInfo.id}.png`);

            return { embeds: [embed], files: [image], components: [buttonRow] };
        }
        else {
            const diagramFields = buildStageDiagramFields(stageData);
            embed.addFields(diagramFields);

            return { embeds: [embed] };
        }
    }
    else {
        const diagramFields = buildStageDiagramFields(stageData);
        embed.addFields(diagramFields);

        return { embeds: [embed], files: [], components: [buttonRow] };
    }
}
export function buildRogueVariationEmbed(variation: RogueVariation) {
    const description = `${variation.desc}\n\n${variation.functionDesc}`;

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(variation.outerName)
        .setDescription(description);

    return { embeds: [embed] };
}
export function buildRogueVariationListEmbed(theme: RogueTheme) {
    let description = '';
    for (const variation of Object.values(theme.variationDict)) {
        description += `${variation.innerName}\n`;
    }

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(`List of ${theme.name} Floor Variations`)
        .setDescription(description);

    return { embeds: [embed] };
}
export function buildSkillEmbed(skill: Skill, op: Operator, level: number) {
    const skillLevel = skill.levels[level];

    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);
    const thumbnailFilename = skill.iconId === null ? skill.skillId : skill.iconId;
    const thumbnailPath = paths.aceshipImageUrl + `/skills/skill_icon_${thumbnailFilename}.png`;
    const thumbnail = new AttachmentBuilder(thumbnailPath);

    const authorField = buildAuthorField(op);
    const title = `${skillLevel.name} - ${gameConsts.skillLevels[level]}`;

    const spCost = skillLevel.spData.spCost;
    const initSp = skillLevel.spData.initSp;
    const skillDuration = skillLevel.duration;
    const spType = gameConsts.spTypes[skillLevel.spData.spType];
    const skillType = gameConsts.skillTypes[skillLevel.skillType];

    let description = `**${spType} - ${skillType}**\n***Cost:* ${spCost} SP - *Initial:* ${initSp} SP`;
    if (skillDuration > 0) {
        description += ` - *Duration:* ${skillDuration} sec`;
    }
    description += `**\n${formatText(skillLevel.description, skillLevel.blackboard)} `;

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(title)
        .setThumbnail(`attachment://skill_icon_${cleanFilename(thumbnailFilename)}.png`)
        .setDescription(description);

    if (skillLevel.rangeId !== null) {
        const rangeField = buildRangeField(skillLevel.rangeId);
        embed.addFields(rangeField);
    }

    const lOne = new ButtonBuilder()
        .setCustomId(`skillඞ${skill.skillId}ඞ${op.id}ඞ0`)
        .setLabel('Lv1')
        .setStyle(ButtonStyle.Secondary);
    const lTwo = new ButtonBuilder()
        .setCustomId(`skillඞ${skill.skillId}ඞ${op.id}ඞ1`)
        .setLabel('Lv2')
        .setStyle(ButtonStyle.Secondary);
    const lThree = new ButtonBuilder()
        .setCustomId(`skillඞ${skill.skillId}ඞ${op.id}ඞ2`)
        .setLabel('Lv3')
        .setStyle(ButtonStyle.Secondary);
    const lFour = new ButtonBuilder()
        .setCustomId(`skillඞ${skill.skillId}ඞ${op.id}ඞ3`)
        .setLabel('Lv4')
        .setStyle(ButtonStyle.Secondary);
    const lFive = new ButtonBuilder()
        .setCustomId(`skillඞ${skill.skillId}ඞ${op.id}ඞ4`)
        .setLabel('Lv5')
        .setStyle(ButtonStyle.Secondary);
    const lSix = new ButtonBuilder()
        .setCustomId(`skillඞ${skill.skillId}ඞ${op.id}ඞ5`)
        .setLabel('Lv6')
        .setStyle(ButtonStyle.Secondary);
    const lSeven = new ButtonBuilder()
        .setCustomId(`skillඞ${skill.skillId}ඞ${op.id}ඞ6`)
        .setLabel('Lv7')
        .setStyle(ButtonStyle.Secondary);
    const mOne = new ButtonBuilder()
        .setCustomId(`skillඞ${skill.skillId}ඞ${op.id}ඞ7`)
        .setLabel('M1')
        .setStyle(ButtonStyle.Danger);
    const mTwo = new ButtonBuilder()
        .setCustomId(`skillඞ${skill.skillId}ඞ${op.id}ඞ8`)
        .setLabel('M2')
        .setStyle(ButtonStyle.Danger);
    const mThree = new ButtonBuilder()
        .setCustomId(`skillඞ${skill.skillId}ඞ${op.id}ඞ9`)
        .setLabel('M3')
        .setStyle(ButtonStyle.Danger);
    const rowOne = new ActionRowBuilder().addComponents(lOne, lTwo, lThree, lFour, lFive);
    const rowTwo = new ActionRowBuilder().addComponents(lSix, lSeven, mOne, mTwo, mThree);

    if (skill.levels.length === 7) {
        mOne.setDisabled(true);
        mTwo.setDisabled(true);
        mThree.setDisabled(true);
    }

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
        case 3:
            lFour.setDisabled(true);
            break;
        case 4:
            lFive.setDisabled(true);
            break;
        case 5:
            lSix.setDisabled(true);
            break;
        case 6:
            lSeven.setDisabled(true);
            break;
        case 7:
            mOne.setDisabled(true);
            break;
        case 8:
            mTwo.setDisabled(true);
            break;
        case 9:
            mThree.setDisabled(true);
            break;
    }

    return { embeds: [embed], files: [avatar, thumbnail], components: [rowOne, rowTwo] };
}
export function buildSkinEmbed(op: Operator, page: number) {
    const skins = skinDict[op.id];
    const skin = skins[page];
    const displaySkin = skin.displaySkin;

    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);
    const imagePath = paths.aceshipImageUrl + `/characters/${encodeURIComponent(skin.portraitId)}.png`;
    const image = new AttachmentBuilder(imagePath);

    const authorField = buildAuthorField(op);
    const skinName = displaySkin.skinName;
    const skinGroupName = displaySkin.skinGroupName;
    const name = skinName === null ? skinGroupName : `${skinGroupName} - ${skinName}`;

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(`${name}`)
        .setImage(`attachment://${cleanFilename(encodeURIComponent(skin.portraitId))}.png`);

    let artistString = '';
    for (const drawer of displaySkin.drawerList) {
        artistString += drawer + '\n';
    }
    if (artistString !== '') {
        embed.addFields({ name: 'Artist', value: artistString });
    }

    let thumbnail;
    switch (displaySkin.skinGroupId) {
        case 'ILLUST_0': {
            const thumbnailPath = paths.aceshipImageUrl + `/ui/elite/0.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);
            embed.setThumbnail(`attachment://0.png`);
            break;
        }
        case 'ILLUST_1': {
            const thumbnailPath = paths.aceshipImageUrl + `/ui/elite/1.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);
            embed.setThumbnail(`attachment://1.png`);
            break;
        }
        case 'ILLUST_2': {
            const thumbnailPath = paths.aceshipImageUrl + `/ui/elite/2.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);
            embed.setThumbnail(`attachment://2.png`);
            break;
        }
        case 'ILLUST_3': {
            const thumbnailPath = paths.aceshipImageUrl + `/ui/elite/3.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);
            embed.setThumbnail(`attachment://3.png`);
            break;
        }
        default: {
            const newSkinGroupId = displaySkin.skinGroupId.split('#')[1];
            const thumbnailPath = paths.myAssetUrl + `/skingroups/${encodeURIComponent(newSkinGroupId)}.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);
            embed.setThumbnail(`attachment://${cleanFilename(encodeURIComponent(newSkinGroupId))}.png`);
            break;
        }
    }

    const defaultSkinArr = new ActionRowBuilder();
    const skinArr = new ActionRowBuilder();
    const components = [];

    for (let i = 0; i < skins.length; i++) {
        const skinGroup = skins[i].displaySkin.skinGroupName;

        const skillButton = new ButtonBuilder()
            .setCustomId(`skinඞ${op.id}ඞ${i}`)
            .setLabel(skinGroup)
            .setStyle(ButtonStyle.Primary);

        if (skinGroup === 'Default Outfit') {
            defaultSkinArr.addComponents(skillButton);
            components[0] = defaultSkinArr;
        }
        else {
            skinArr.addComponents(skillButton);
            components[1] = skinArr;
        }

        if (i === page) {
            skillButton.setDisabled(true);
        }
    }

    return { embeds: [embed], files: [avatar, thumbnail, image], components: components };
}
export async function buildSpinePage(op: Operator, type: string) {
    const browser = await puppeteer.launch({ headless: "old", args: ["--no-sandbox", "--disabled-setupid-sandbox"] });
    const page = await browser.newPage();
    const rand = Math.floor(Math.random() * 100000);
    await page.setViewport({ width: 300, height: 300 });
    await page.goto("file://" + path.resolve(__dirname, 'spine', `spine.html?name=${op.id}&type=${type}&rand=${rand}`));
    const client = await page.target().createCDPSession()
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: path.resolve(__dirname, 'spine'),
    })

    return { page, browser, rand };
}
export async function buildSpineEmbed(op: Operator, type: string, rand: number) {
    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);
    const authorField = buildAuthorField(op);
    const gifFile = op.id + rand + '.gif';
    const gifPath = path.join(__dirname, 'spine', gifFile);
    const gif = new AttachmentBuilder(gifPath);
    const spineJson = await (await nodefetch(paths.myAssetUrl + `/spinejson/${op.id}.json`)).json();
    const animArr = Object.keys(spineJson.animations);

    const animSelector = new StringSelectMenuBuilder()
        .setCustomId(`spineඞ${op.id}`)
        .setPlaceholder(type);
    const componentRow = new ActionRowBuilder().addComponents(animSelector);

    for (let i = 0; i < animArr.length; i++) {
        // Default animations are a single frame that lasts forever, they do not work and should not be shown
        if (animArr[i] === 'Default') continue;

        animSelector.addOptions(new StringSelectMenuOptionBuilder()
            .setLabel(animArr[i])
            .setValue(animArr[i])
        );
    }

    const embed = new EmbedBuilder()
        .setAuthor(authorField)
        .setImage(`attachment://${gifFile}`);

    return { content: '', embeds: [embed], files: [avatar, gif], components: [componentRow] };
}
export async function buildStageEmbed(stage: Stage, page: number) {
    const stageInfo = stage.excel;
    const stageData = stage.levels;
    const isChallenge = stageInfo.diffGroup === 'TOUGH' || stageInfo.difficulty === 'FOUR_STAR'

    const title = isChallenge ? `Challenge ${stageInfo.code} - ${stageInfo.name}` : `${stageInfo.code} - ${stageInfo.name}`;
    const description = formatText(stageInfo.description, []);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setDescription(description);

    const stageDropInfo = stageInfo.stageDropInfo;
    let regularString = '', specialString = '';

    for (const item of stageDropInfo.displayDetailRewards) {
        if (item.dropType === 1 || item.dropType === 8) continue; // Skip chars and furniture cause idc
        // 1: character/furniture
        // 2: regular drop
        // 3: special drop
        // 4: extra drop
        // 5-7: not used
        // 8: yellow rock
        switch (item.dropType) {
            case 2:
                regularString += `${itemDict[item.id].data.name}\n`;
                break;
            case 3:
                specialString += `${itemDict[item.id].data.name}\n`;
                break;
        }
    }

    if (regularString !== '') {
        embed.addFields({ name: 'Regular Drops', value: regularString });
    }
    if (specialString !== '') {
        embed.addFields({ name: 'Special Drops', value: specialString });
    }

    const enemyFields = buildStageEnemyFields(stageData);
    for (const field of enemyFields) {
        embed.addFields(field);
    }

    const stageIndex = isChallenge ? toughStageDict[stage.excel.code.toLowerCase()].indexOf(stage) : stageDict[stage.excel.code.toLowerCase()].indexOf(stage);

    const imageButton = new ButtonBuilder()
        .setCustomId(`stageඞ${stage.excel.code.toLowerCase()}ඞ${stageIndex}ඞ${isChallenge}ඞ0`)
        .setLabel('Preview')
        .setStyle(ButtonStyle.Primary);
    const diagramButton = new ButtonBuilder()
        .setCustomId(`stageඞ${stage.excel.code.toLowerCase()}ඞ${stageIndex}ඞ${isChallenge}ඞ1`)
        .setLabel('Diagram')
        .setStyle(ButtonStyle.Primary);
    const buttonRow = new ActionRowBuilder().addComponents(imageButton, diagramButton);

    switch (page) {
        case 0:
            imageButton.setDisabled(true);
            break;
        case 1:
            diagramButton.setDisabled(true);
            break;
    }

    if (page === 0) {
        const imagePath = paths.myAssetUrl + `/stages/${stageInfo.stageId}.png`;
        const toughPath = paths.myAssetUrl + `/stages/${stageInfo.stageId.replace('tough', 'main')}.png`;
        const newPath = paths.myAssetUrl + `/stages/${stageInfo.stageId.substring(0, stageInfo.stageId.length - 3)}.png`;

        if (await urlExists(imagePath)) {
            const image = new AttachmentBuilder(imagePath);
            embed.setImage(`attachment://${stageInfo.stageId}.png`)

            return { content: '', embeds: [embed], files: [image], components: [buttonRow] };
        }
        else if (await urlExists(toughPath)) {
            const image = new AttachmentBuilder(toughPath);
            embed.setImage(`attachment://${stageInfo.stageId}.png`)

            return { content: '', embeds: [embed], files: [image], components: [buttonRow] };
        }
        else if (await urlExists(newPath)) {
            const image = new AttachmentBuilder(newPath);
            embed.setImage(`attachment://${stageInfo.stageId}.png`)

            return { content: '', embeds: [embed], files: [image], components: [buttonRow] };
        }
        else {
            const diagramFields = buildStageDiagramFields(stageData);
            embed.addFields(diagramFields);

            return { content: '', embeds: [embed], components: [] };
        }
    }
    else {
        const diagramFields = buildStageDiagramFields(stageData);
        embed.addFields(diagramFields);

        return { content: '', embeds: [embed], files: [], components: [buttonRow] };
    }
}
function buildStageDiagramFields(stageData: StageData) {
    const map = stageData.mapData.map;
    const tiles = stageData.mapData.tiles;
    let mapString = '', legendArr = [];

    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[0].length; j++) {
            const tileKey = tiles[map[i][j]].tileKey;
            const tile = gameConsts.tileDict.hasOwnProperty(tileKey) ? gameConsts.tileDict[tileKey] : gameConsts.tileDict['unknown'];
            mapString += tile.emoji;

            if (legendArr.includes(`${tile.emoji} - ${tile.name}`)) continue;

            legendArr.push(`${tile.emoji} - ${tile.name}`);
        }
        mapString += '\n';
    }
    const legendString = legendArr.join('\n');

    return [{ name: 'Map', value: mapString }, { name: 'Legend', value: legendString }];
}
function buildStageEnemyFields(stageData: StageData) {
    const waveDict: { [key: string]: number } = {}; // enemyId => enemy quantity
    for (const wave of stageData.waves) { // Count number of enemies in stage, store results in waveDict
        for (const fragment of wave.fragments) {
            for (const action of fragment.actions) {
                if (action.actionType !== 0) continue;
                // 0: spawn
                // 1: skip??
                // 2: tutorial/story popup
                // 3: not used
                // 4: change bgm
                // 5: enemy intro popup
                // 6: spawn npc/trap
                // 7: stage effect (rumble)
                // 8: environmental effect (blizzards)
                // 9: some sss tutorial thing idk
                waveDict[action.key] = waveDict[action.key] === undefined ? action.count : waveDict[action.key] + action.count;
            }
        }
    }

    let enemyString = '', eliteString = '', bossString = '';
    for (const enemyRef of stageData.enemyDbRefs) {
        if (enemyDict.hasOwnProperty(enemyRef.id)) {
            const enemy = enemyDict[enemyRef.id];

            let enemyLine = `${enemy.excel.enemyIndex} - ${enemy.excel.name}`;
            if (enemy.levels.Value.length !== 1) {
                enemyLine += ` (Lv${enemyRef.level + 1})`; // Add predefine level if enemy has more than one
            }
            if (waveDict.hasOwnProperty(enemy.excel.enemyId)) {
                enemyLine += ` **x${waveDict[enemy.excel.enemyId]}**`; // Enemies like IS3 chests and OD rock slugs don't have predefined quantities, exclude these
            }
            enemyLine += '\n';

            switch (enemy.excel.enemyLevel) {
                case ('NORMAL'):
                    enemyString += enemyLine;
                    break;
                case ('ELITE'):
                    eliteString += enemyLine;
                    break;
                case ('BOSS'):
                    bossString += enemyLine;
                    break;
            }
        }
    }

    const fieldArr = [];
    if (enemyString !== '') {
        fieldArr.push({ name: 'Enemies', value: enemyString, inline: true });
    }
    if (eliteString !== '') {
        fieldArr.push({ name: 'Elites', value: eliteString, inline: true });
    }
    if (bossString !== '') {
        fieldArr.push({ name: 'Leaders', value: bossString });
    }

    return fieldArr;
}
export function buildStageSelectEmbed(stageArr: Stage[] | RogueStage[]) {
    const stageSelector = new StringSelectMenuBuilder()
        .setCustomId(`stageඞselectඞ${stageArr[0].excel.code.toLowerCase()}`)
        .setPlaceholder('Select a stage!');
    const componentRow = new ActionRowBuilder().addComponents(stageSelector);

    for (let i = 0; i < stageArr.length; i++) {
        const stage = stageArr[i];
        const name = `${stage.excel.code} - ${stage.excel.name}`;

        stageSelector.addOptions(new StringSelectMenuOptionBuilder()
            .setLabel(name)
            .setValue(`${i}`)
        );
    }

    return { content: 'Multiple stages with that code were found, please select a stage below:', components: [componentRow] };
}

export function defineAutocomplete(query: string, callback: (op: Definition) => boolean = () => true) {
    let arr: Definition[] = [];
    for (const define of Object.values(definitionDict)) {
        if (arr.includes(define)) continue;
        arr.push(define);
    }
    const filteredArr = arr.filter(define => define.termName.toLowerCase().includes(query) && callback(define));
    const filteredMap = filteredArr.slice(0, 8).map(define => ({ name: define.termName, value: define.termName }));

    return filteredMap;
}
export function enemyAutocomplete(query: string, callback: (op: Enemy) => boolean = () => true) {
    let arr: Enemy[] = [];
    for (const enemy of Object.values(enemyDict)) {
        if (arr.includes(enemy)) continue;
        arr.push(enemy);
    }
    const matchQuery = (enemy: Enemy) => enemy.excel.name.toLowerCase().includes(query) || enemy.excel.enemyIndex.toLowerCase().includes(query);
    const filteredArr = arr.filter(enemy => matchQuery(enemy) && callback(enemy));
    const filteredMap = filteredArr.slice(0, 8).map(enemy => ({ name: `${enemy.excel.enemyIndex} - ${enemy.excel.name}`, value: enemy.excel.enemyId }));

    return filteredMap;
}
export function itemAutocomplete(query: string, callback: (op: Item) => boolean = () => true) {
    let arr: Item[] = [];
    for (const item of Object.values(itemDict)) {
        if (arr.includes(item)) continue;
        arr.push(item);
    }
    const filteredArr = arr.filter(item => item.data.name.toLowerCase().includes(query) && callback(item));
    const filteredMap = filteredArr.slice(0, 8).map(item => ({ name: item.data.name, value: item.data.name }));

    return filteredMap;
}
export function operatorAutocomplete(query: string, callback: (op: Operator) => boolean = () => true) {
    let arr: Operator[] = [];
    for (const op of Object.values(operatorDict)) {
        if (arr.includes(op)) continue;
        arr.push(op);
    }
    const filteredArr = arr.filter(op => op.data.name.toLowerCase().includes(query) && callback(op));
    const filteredMap = filteredArr.slice(0, 8).map(op => ({ name: op.data.name, value: op.data.name }));

    return filteredMap;
}
export function stageAutocomplete(query: string, callback: (op: Stage) => boolean = () => true) {
    let arr: Stage[] = [];
    for (const stageArr of Object.values(stageDict)) {
        for (const stage of stageArr) {
            if (arr.includes(stage)) continue;
            arr.push(stage);
        }
    }
    const matchQuery = (stage: Stage) => stage.excel.name.toLowerCase().includes(query) || stage.excel.code.toLowerCase().includes(query);
    const filteredArr = arr.filter(stage => matchQuery(stage) && callback(stage));
    const filteredMap = filteredArr.slice(0, 8).map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.stageId }));

    return filteredMap;
}