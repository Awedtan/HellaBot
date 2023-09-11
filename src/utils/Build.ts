import { ActionRowBuilder, AttachmentBuilder, BaseMessageOptions, ButtonBuilder, ButtonStyle, EmbedAuthorOptions, EmbedBuilder, EmbedField, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import { join } from 'path';
import type { Blackboard, CCStage, Definition, Enemy, GameEvent, GridRange, Item, LevelUpCost, Operator, Paradox, RogueRelic, RogueStage, RogueVariation, SandboxStage, Stage, StageData } from "../types";
import { getAllDefinitions, getAllEvents, getEnemy, getItem, getOperator, getRange, getRogueTheme, getStageArr, getToughStageArr } from './Api';
const nodefetch = require('node-fetch');
const fs = require('fs');
const { embedColour, paths, gameConsts } = require('../constants');

const cleanFilename = (text: string) => text.split(/%|[#\+]|&|\[|\]/).join(''); // Remove special characters that discord doesn't like (%, #, etc.)
export const fileExists = async (path: string) => !!(await fs.promises.stat(path).catch(e => false));
export const urlExists = async (url: string) => (await nodefetch(url)).status === 200;
function removeStyleTags(text: string) {
    if (!text) text = '';
    const regex = /<.[a-z]{2,5}?\.[^<]+>|<\/[^<]*>|<color=[^>]+>/;
    text = text.split(regex).join('');
    return text;
}
function insertBlackboardVariables(text: string, blackboard: Blackboard[]) {
    // Note: check these every so often to see if their skills still display properly
    // silverash s2/s3
    // eyjafjalla s2
    // lin s1
    // tachanka s1/s2
    // mizuki s1
    // mostima s3
    // irene s1
    // utage s2

    const chunkIsVariable = (chunk: string, blackboard: Blackboard[]) => {
        chunk = chunk.toLowerCase();
        for (const variable of blackboard) {
            const key = variable.key;
            if (chunk.indexOf(key.toLowerCase()) !== 0 && !(chunk.charAt(0) === '-' && chunk.indexOf(key.toLowerCase()) === 1)) continue;
            if (chunk.split(' ').length !== 1) continue;
            if (![key.charAt(key.length - 1), '0', '%'].includes(chunk.charAt(chunk.length - 1))) continue;
            return true;
        }
        return false;
    }
    const formatVariable = (chunk: string, blackboard: Blackboard[]) => {
        // {tag} {tag:0} {tag:0%} {tag:0.0} {tag:0.0%}
        chunk = chunk.toLowerCase();
        let value;
        const tag = chunk.split(':')[0];
        for (const variable of blackboard) {
            const key = variable.key;
            if (tag === key) {
                switch (chunk.charAt(chunk.length - 1)) {
                    case key.charAt(key.length - 1):
                    case '0':
                        value = variable.value;
                        break;
                    case '%':
                        value = `${Math.round(variable.value * 100)}%`
                        break;
                }
            }
            else if (tag === `-${key}`) {
                switch (chunk.charAt(chunk.length - 1)) {
                    case key.charAt(key.length - 1):
                    case '0':
                        value = -variable.value;
                        break;
                    case '%':
                        value = `${-Math.round(variable.value * 100)}%`
                        break;
                }
            }
        }
        return `\`${value}\``;
    }

    const textArr = removeStyleTags(text.trim()).split(/{|}/);

    for (let i = 0; i < textArr.length; i++) {
        if (chunkIsVariable(textArr[i], blackboard)) {
            textArr[i] = formatVariable(textArr[i], blackboard);
        }
    }

    return textArr.join('').split('-`').join('`-').split('+`').join('`+');
}

export async function buildArtMessage(op: Operator, page: number): Promise<BaseMessageOptions> {
    const skins = op.skins;
    const skin = skins[page];

    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);
    const imagePath = paths.aceshipImageUrl + `/characters/${encodeURIComponent(skin.portraitId)}.png`;
    const image = new AttachmentBuilder(imagePath);

    const { embed, thumbnail } = await buildArtEmbed(op, page);

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
export async function buildBaseMessage(op: Operator, page: number): Promise<BaseMessageOptions> {
    const baseInfo = op.bases[page].condition;
    const base = op.bases[page].skill;

    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);
    const thumbnailPath = paths.aceshipImageUrl + `/ui/infrastructure/skill/${base.skillIcon}.png`;
    const thumbnail = new AttachmentBuilder(thumbnailPath);

    const authorField = buildAuthorField(op);
    const title = `${base.buffName} - ${gameConsts.eliteLevels[baseInfo.cond.phase]} Lv${baseInfo.cond.level}`;
    const description = removeStyleTags(base.description);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(title)
        .setThumbnail(`attachment://${cleanFilename(base.skillIcon)}.png`)
        .setDescription(description);

    return { embeds: [embed], files: [avatar, thumbnail] };
}
export async function buildCcMessage(stage: CCStage, page: number): Promise<BaseMessageOptions> {
    const stageInfo = stage.const;
    const stageData = stage.levels;

    const title = `${stageInfo.location} - ${stageInfo.name}`;
    const description = removeStyleTags(stageInfo.description);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setDescription(description);

    const enemyFields = await buildStageEnemyFields(stageData);
    embed.addFields(enemyFields);

    const imageButton = new ButtonBuilder()
        .setCustomId(`ccඞ${stage.const.name.toLowerCase()}ඞ0`)
        .setLabel('Preview')
        .setStyle(ButtonStyle.Primary);
    const diagramButton = new ButtonBuilder()
        .setCustomId(`ccඞ${stage.const.name.toLowerCase()}ඞ1`)
        .setLabel('Diagram')
        .setStyle(ButtonStyle.Primary);
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(imageButton, diagramButton);

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
export async function buildCcSelectMessage(season: string): Promise<BaseMessageOptions> {
    const ccSelector = new StringSelectMenuBuilder()
        .setCustomId(`ccඞselect`)
        .setPlaceholder('Select a stage!');
    const componentRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(ccSelector);

    const names: string = gameConsts.ccSeasons[season];
    for (const name of names) {
        ccSelector.addOptions(new StringSelectMenuOptionBuilder()
            .setLabel(name)
            .setValue(name.toLowerCase())
        );
    }

    return { content: `Please select a stage from CC#${season} below:`, components: [componentRow] };
}
export async function buildCostMessage(op: Operator, page: number): Promise<BaseMessageOptions> {
    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);

    const { embed, thumbnail } = await buildCostEmbed(op, page);

    const eliteButton = new ButtonBuilder()
        .setCustomId(`costඞ${op.id}ඞ0`)
        .setLabel('Promotions')
        .setStyle(ButtonStyle.Primary);
    const skillButton = new ButtonBuilder()
        .setCustomId(`costඞ${op.id}ඞ1`)
        .setLabel('Skills')
        .setStyle(ButtonStyle.Primary);
    const masteryButton = new ButtonBuilder()
        .setCustomId(`costඞ${op.id}ඞ2`)
        .setLabel('Masteries')
        .setStyle(ButtonStyle.Primary);
    const moduleButton = new ButtonBuilder()
        .setCustomId(`costඞ${op.id}ඞ3`)
        .setLabel('Modules')
        .setStyle(ButtonStyle.Primary);
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(eliteButton, skillButton, masteryButton, moduleButton);

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

    switch (page) {
        default:
        case 0: {
            eliteButton.setDisabled(true);
            break;
        }
        case 1: {
            skillButton.setDisabled(true);
            break;
        }
        case 2: {
            masteryButton.setDisabled(true);
            break;
        }
        case 3: {
            moduleButton.setDisabled(true);
            break;
        }
    }

    return { embeds: [embed], files: [avatar, thumbnail], components: [buttonRow] };
}
export async function buildDefineMessage(definition: Definition): Promise<BaseMessageOptions> {
    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(definition.termName)
        .setDescription(removeStyleTags(definition.description));

    return { embeds: [embed] };
}
export async function buildDefineListMessage(): Promise<BaseMessageOptions> {
    let statusDescription = '', effectDescription = '', groupDescription = '';
    const dataArr = await getAllDefinitions();
    for (const term of dataArr) {
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
        .setTitle('In-Game Terms and Groups')
        .addFields(
            { name: 'Status Effects', value: statusDescription, inline: true },
            { name: 'Base Effects', value: effectDescription, inline: true },
            { name: 'Base Groups', value: groupDescription, inline: true }
        );

    return { embeds: [embed] };
}
export async function buildEnemyMessage(enemy: Enemy, level: number): Promise<BaseMessageOptions> {
    const enemyInfo = enemy.excel;
    const enemyData = enemy.levels.Value[level].enemyData;
    const baseData = enemy.levels.Value[0].enemyData;

    const thumbnailPath = paths.aceshipImageUrl + `/enemy/${enemyInfo.enemyId}.png`;
    const thumbnail = new AttachmentBuilder(thumbnailPath);

    const title = `${enemyInfo.enemyIndex} - ${enemyInfo.name}`;
    const description = `${removeStyleTags(enemyInfo.description)}\n\n${removeStyleTags(enemyInfo.ability)}`;

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
export async function buildEventListMessage(index: number): Promise<BaseMessageOptions> {
    const eventCount = 6;

    let eventArr = [];
    const dataArr = await getAllEvents();
    for (const event of dataArr) {
        const skipLoginArr = ['LOGIN_ONLY', 'CHECKIN_ONLY', 'FLOAT_PARADE', 'PRAY_ONLY', 'GRID_GACHA_V2', 'GRID_GACHA']; // Skip login events
        if (skipLoginArr.includes(event.type)) continue;
        eventArr.push(event);
    }
    eventArr.sort((first: GameEvent, second: GameEvent) => second.startTime - first.startTime); // Sort by descending start time

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle('In-Game Events')
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
    const componentRow = new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton);

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
export async function buildItemMessage(item: Item): Promise<BaseMessageOptions> {
    const description = item.data.description !== null ? `${item.data.usage}\n\n${item.data.description}` : item.data.usage;

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(item.data.name)
        .setDescription(description);

    let stageString = '';
    for (const stageDrop of item.data.stageDropList) {
        const stageId = stageDrop.stageId;
        if (!stageId.includes('main') && !stageId.includes('sub')) continue;

        const stage = await getStageArr({ query: stageId })[0];
        stageString += `${stage.excel.code} - ${gameConsts.itemDropRarities[stageDrop.occPer]}\n`;
    }
    if (stageString !== '') {
        embed.addFields({ name: 'Drop Stages', value: stageString, inline: true });
    }
    if (item.formula !== null && item.formula.costs.length > 0) {
        const formulaString = await buildCostString(item.formula.costs);
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
export async function buildModuleMessage(op: Operator, page: number, level: number): Promise<BaseMessageOptions> {
    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);

    const { embed, thumbnail } = await buildModuleEmbed(op, page, level);

    const lOne = new ButtonBuilder()
        .setCustomId(`moduleඞ${op.id}ඞ${page}ඞ0`)
        .setLabel('Lv1')
        .setStyle(ButtonStyle.Secondary);
    const lTwo = new ButtonBuilder()
        .setCustomId(`moduleඞ${op.id}ඞ${page}ඞ1`)
        .setLabel('Lv2')
        .setStyle(ButtonStyle.Secondary);
    const lThree = new ButtonBuilder()
        .setCustomId(`moduleඞ${op.id}ඞ${page}ඞ2`)
        .setLabel('Lv3')
        .setStyle(ButtonStyle.Secondary);
    const rowOne = new ActionRowBuilder<ButtonBuilder>().addComponents(lOne, lTwo, lThree);

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
export async function buildOperatorMessage(op: Operator): Promise<BaseMessageOptions> {
    const opMax = op.data.phases[op.data.phases.length - 1];

    const thumbnailPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const thumbnail = new AttachmentBuilder(thumbnailPath);

    const authorField = buildAuthorField(op);
    let title = `${op.data.name} - `;
    for (let i = 0; i <= op.data.rarity; i++) {
        title += '★';
    }

    let description = removeStyleTags(op.data.description);
    if (op.data.trait !== null) {
        const candidate = op.data.trait.candidates[op.data.trait.candidates.length - 1];
        if (candidate.overrideDescripton !== null) {
            description = insertBlackboardVariables(candidate.overrideDescripton, candidate.blackboard);
        }
    }
    const descriptionField = { name: `${gameConsts.professions[op.data.profession]} - ${op.archetype}`, value: description };
    const rangeField = await buildRangeField({ range: op.range });

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(authorField.url)
        .setThumbnail(`attachment://${op.id}.png`)
        .addFields(descriptionField, rangeField);

    if (op.data.talents !== null) {
        for (const talent of op.data.talents) {
            const candidate = talent.candidates[talent.candidates.length - 1];
            embed.addFields({ name: `*Talent:* ${candidate.name}`, value: removeStyleTags(candidate.description) });
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
export async function buildParadoxMessage(paradox: Paradox, page: number): Promise<BaseMessageOptions> {
    const stageInfo = paradox.excel;
    const stageData = paradox.levels;
    const op = await getOperator({ query: stageInfo.charId });

    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);

    const authorField = buildAuthorField(op);
    const title = `Paradox Simulation - ${stageInfo.name}`;
    const description = removeStyleTags(stageInfo.description);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(title)
        .setDescription(description);

    const enemyFields = await buildStageEnemyFields(stageData);
    embed.addFields(enemyFields);

    const imageButton = new ButtonBuilder()
        .setCustomId(`paradoxඞ${stageInfo.charId}ඞ0`)
        .setLabel('Preview')
        .setStyle(ButtonStyle.Primary);
    const diagramButton = new ButtonBuilder()
        .setCustomId(`paradoxඞ${stageInfo.charId}ඞ1`)
        .setLabel('Diagram')
        .setStyle(ButtonStyle.Primary);
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(imageButton, diagramButton);

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
export async function buildRecruitMessage(qual: string, value: number, tag: string, select: boolean): Promise<BaseMessageOptions> {
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
    components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(meleeButton, rangedButton, guardButton, medicButton, vanguardButton));
    components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(casterButton, sniperButton, defenderButton, supporterButton, specialistButton));
    components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(healingButton, supportButton, dpsButton, aoeButton, slowButton));
    components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(survivalButton, defenseButton, debuffButton, shiftButton, crowdControlButton));
    components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(nukerButton, summonButton, fastRedeployButton, dpRecoveryButton, robotButton));

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
            const op = await getOperator({ query: String(opId) });
            if (op.recruit % value !== 0) continue;
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
export async function buildRogueRelicMessage(relic: RogueRelic): Promise<BaseMessageOptions> {
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
export async function buildRogueRelicListMessage(theme: number, index: number): Promise<BaseMessageOptions> {
    const rogueTheme = await getRogueTheme({ query: theme.toString(), include: ['name', 'relicDict'] });
    const descriptionLengthLimit = 24;
    const columnCount = 2;

    let descriptionArr = [], i = 0;
    for (const relic of Object.values(rogueTheme.relicDict)) {
        if (!descriptionArr[i]) {
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
        .setTitle(`*${rogueTheme.name}* Relics`)
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
    const componentRow = new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton);

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
export async function buildRogueStageMessage(theme: number, stage: RogueStage, page: number): Promise<BaseMessageOptions> {
    const stageInfo = stage.excel;
    const stageData = stage.levels;
    const isChallenge = stageInfo.difficulty !== 'NORMAL';

    const title = isChallenge ? `Emergency ${stageInfo.code} - ${stageInfo.name}` : `${stageInfo.code} - ${stageInfo.name}`;
    const description = isChallenge ? removeStyleTags(`${stageInfo.description}\n${stageInfo.eliteDesc}`) : removeStyleTags(stageInfo.description);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(`https://awedtan.github.io?level=${stage.excel.id.toLowerCase()}`)
        .setDescription(description);

    const enemyFields = await buildStageEnemyFields(stageData);
    embed.addFields(enemyFields);

    const imageButton = new ButtonBuilder()
        .setCustomId(`rogueඞstageඞ${theme}ඞ${stageInfo.name.toLowerCase()}ඞ${isChallenge}ඞ0`)
        .setLabel('Preview')
        .setStyle(ButtonStyle.Primary);
    const diagramButton = new ButtonBuilder()
        .setCustomId(`rogueඞstageඞ${theme}ඞ${stageInfo.name.toLowerCase()}ඞ${isChallenge}ඞ1`)
        .setLabel('Diagram')
        .setStyle(ButtonStyle.Primary);
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(imageButton, diagramButton);

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
export async function buildRogueVariationMessage(variation: RogueVariation): Promise<BaseMessageOptions> {
    const description = `${variation.desc}\n\n${variation.functionDesc}`;

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(variation.outerName)
        .setDescription(description);

    return { embeds: [embed] };
}
export async function buildRogueVariationListMessage(theme: number): Promise<BaseMessageOptions> {
    const rogueTheme = await getRogueTheme({ query: theme.toString(), include: ['name', 'variationDict'] });

    let description = '';
    for (const variation of Object.values(rogueTheme.variationDict)) {
        description += `${variation.outerName}\n`;
    }

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(`*${rogueTheme.name}* Floor Effects`)
        .setDescription(description);

    return { embeds: [embed] };
}
export async function buildSandboxStageMessage(stage: SandboxStage) {
    const stageInfo = stage.excel;
    const stageData = stage.levels;

    const title = `${stageInfo.code} - ${stageInfo.name}`;
    const description = removeStyleTags(stageInfo.description);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(`https://awedtan.github.io?level=${stage.excel.stageId.toLowerCase()}`)
        .setDescription(description);

    const enemyFields = await buildStageEnemyFields(stageData);
    embed.addFields(enemyFields);

    const diagramFields = buildStageDiagramFields(stageData);
    embed.addFields(diagramFields);

    return { embeds: [embed] };
}
export async function buildSkillMessage(op: Operator, page: number, level: number): Promise<BaseMessageOptions> {
    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);

    const { embed, thumbnail } = await buildSkillEmbed(op, page, level);

    const lOne = new ButtonBuilder()
        .setCustomId(`skillඞ${op.id}ඞ${page}ඞ0`)
        .setLabel('Lv1')
        .setStyle(ButtonStyle.Secondary);
    const lTwo = new ButtonBuilder()
        .setCustomId(`skillඞ${op.id}ඞ${page}ඞ1`)
        .setLabel('Lv2')
        .setStyle(ButtonStyle.Secondary);
    const lThree = new ButtonBuilder()
        .setCustomId(`skillඞ${op.id}ඞ${page}ඞ2`)
        .setLabel('Lv3')
        .setStyle(ButtonStyle.Secondary);
    const lFour = new ButtonBuilder()
        .setCustomId(`skillඞ${op.id}ඞ${page}ඞ3`)
        .setLabel('Lv4')
        .setStyle(ButtonStyle.Secondary);
    const lFive = new ButtonBuilder()
        .setCustomId(`skillඞ${op.id}ඞ${page}ඞ4`)
        .setLabel('Lv5')
        .setStyle(ButtonStyle.Secondary);
    const lSix = new ButtonBuilder()
        .setCustomId(`skillඞ${op.id}ඞ${page}ඞ5`)
        .setLabel('Lv6')
        .setStyle(ButtonStyle.Secondary);
    const lSeven = new ButtonBuilder()
        .setCustomId(`skillඞ${op.id}ඞ${page}ඞ6`)
        .setLabel('Lv7')
        .setStyle(ButtonStyle.Secondary);
    const mOne = new ButtonBuilder()
        .setCustomId(`skillඞ${op.id}ඞ${page}ඞ7`)
        .setLabel('M1')
        .setStyle(ButtonStyle.Danger);
    const mTwo = new ButtonBuilder()
        .setCustomId(`skillඞ${op.id}ඞ${page}ඞ8`)
        .setLabel('M2')
        .setStyle(ButtonStyle.Danger);
    const mThree = new ButtonBuilder()
        .setCustomId(`skillඞ${op.id}ඞ${page}ඞ9`)
        .setLabel('M3')
        .setStyle(ButtonStyle.Danger);
    const rowOne = new ActionRowBuilder<ButtonBuilder>().addComponents(lOne, lTwo, lThree, lFour, lFive);
    const rowTwo = new ActionRowBuilder<ButtonBuilder>().addComponents(lSix, lSeven, mOne, mTwo, mThree);

    const skill = op.skills[page];
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
export async function buildSpineMessage(char: Enemy | Operator, animArr: string[], anim: string, rand: number): Promise<BaseMessageOptions> {
    const type = (char as Operator).id ? 'operator' : 'enemy';
    const id = type === 'operator' ? (char as Operator).id : (char as Enemy).excel.enemyId;

    const avatarPath = paths.aceshipImageUrl + (type === 'operator' ? `/avatars/${id}.png` : `/enemy/${id}.png`);
    const avatar = new AttachmentBuilder(avatarPath);
    const authorField = buildAuthorField(char);

    let gifFile = id + rand + '.gif';
    let gifPath = join(__dirname, 'spine', gifFile);
    if (await fileExists(gifPath)) {
    }
    else if (await fileExists(join(__dirname, 'spine', gifFile.split('_2').join('')))) {
        gifPath = join(__dirname, 'spine', gifFile.split('_2').join(''));
    }
    else if (await fileExists(join(__dirname, 'spine', gifFile.split('sbr').join('sabr')))) {
        gifPath = join(__dirname, 'spine', gifFile.split('sbr').join('sabr'));
    }
    else if (await fileExists(join(__dirname, 'spine', gifFile.split('_2').join('').split('sbr').join('sabr')))) {
        gifPath = join(__dirname, 'spine', gifFile.split('_2').join('').split('sbr').join('sabr'));
    }

    const gif = new AttachmentBuilder(gifPath);

    const animSelector = new StringSelectMenuBuilder()
        .setCustomId(`spineඞ${type}ඞ${id}`)
        .setPlaceholder(anim);
    const componentRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(animSelector);

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
export async function buildStageMessage(stage: Stage, page: number): Promise<BaseMessageOptions> {
    const stageInfo = stage.excel;
    const stageData = stage.levels;
    const isChallenge = stageInfo.diffGroup === 'TOUGH' || stageInfo.difficulty === 'FOUR_STAR'

    const title = isChallenge ? `Challenge ${stageInfo.code} - ${stageInfo.name}` : `${stageInfo.code} - ${stageInfo.name}`;
    const description = removeStyleTags(stageInfo.description);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(`https://awedtan.github.io?level=${stage.excel.stageId.toLowerCase()}`)
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
                regularString += `${(await getItem({ query: item.id })).data.name}\n`;
                break;
            case 3:
                specialString += `${(await getItem({ query: item.id })).data.name}\n`;
                break;
        }
    }

    if (regularString !== '') {
        embed.addFields({ name: 'Regular Drops', value: regularString });
    }
    if (specialString !== '') {
        embed.addFields({ name: 'Special Drops', value: specialString });
    }

    const enemyFields = await buildStageEnemyFields(stageData);
    embed.addFields(enemyFields);

    let stageIndex;
    if (isChallenge)
        stageIndex = (await getToughStageArr({ query: stage.excel.code.toLowerCase() })).findIndex(x => x.excel.stageId === stage.excel.stageId);
    else
        stageIndex = (await getStageArr({ query: stage.excel.code.toLowerCase() })).findIndex(x => x.excel.stageId === stage.excel.stageId)

    const imageButton = new ButtonBuilder()
        .setCustomId(`stageඞ${stage.excel.code.toLowerCase()}ඞ${stageIndex}ඞ${isChallenge}ඞ0`)
        .setLabel('Preview')
        .setStyle(ButtonStyle.Primary);
    const diagramButton = new ButtonBuilder()
        .setCustomId(`stageඞ${stage.excel.code.toLowerCase()}ඞ${stageIndex}ඞ${isChallenge}ඞ1`)
        .setLabel('Diagram')
        .setStyle(ButtonStyle.Primary);
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(imageButton, diagramButton);

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
            embed.setImage(`attachment://${stageInfo.stageId.replace('tough', 'main')}.png`)

            return { content: '', embeds: [embed], files: [image], components: [buttonRow] };
        }
        else if (await urlExists(newPath)) {
            const image = new AttachmentBuilder(newPath);
            embed.setImage(`attachment://${stageInfo.stageId.substring(0, stageInfo.stageId.length - 3)}.png`)

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
export async function buildStageSelectMessage(stageArr: Stage[] | RogueStage[]): Promise<BaseMessageOptions> {
    const stageSelector = new StringSelectMenuBuilder()
        .setCustomId(`stageඞselectඞ${stageArr[0].excel.code.toLowerCase()}`)
        .setPlaceholder('Select a stage!');
    const componentRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(stageSelector);

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

export async function buildInfoMessage(op: Operator, type: number, page: number, level: number): Promise<BaseMessageOptions> {
    const embedArr = [], fileArr = [], rowArr = [];

    const operatorEmbed = await buildOperatorMessage(op);
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
    const typeRow = new ActionRowBuilder<ButtonBuilder>().addComponents(skillButton, moduleButton, artButton, baseButton, costButton);

    if (!op.skills || op.skills.length === 0) {
        skillButton.setStyle(ButtonStyle.Secondary);
        skillButton.setDisabled(true);
    }
    if (!op.modules || op.modules.length === 0) {
        moduleButton.setStyle(ButtonStyle.Secondary);
        moduleButton.setDisabled(true);
    }
    if (!op.skins || op.skins.length === 0) {
        artButton.setStyle(ButtonStyle.Secondary);
        artButton.setDisabled(true);
    }
    if (!op.bases || op.bases.length === 0) {
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

            const skillEmbed = await buildInfoSkillMessage(op, type, page, level);
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
            const skillRow = new ActionRowBuilder<ButtonBuilder>().addComponents(skillOne, skillTwo, skillThree);
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

            const moduleEmbed = await buildInfoModuleMessage(op, type, page, level);
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
            const moduleRow = new ActionRowBuilder<ButtonBuilder>().addComponents(moduleOne, moduleTwo);
            rowArr.push(moduleRow);

            const moduleArr = [moduleOne, moduleTwo];
            for (let i = 0; i < op.modules.length; i++) {
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

            const skinEmbed = await buildInfoArtMessage(op, type, page, level);
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

            for (let i = 0; i < op.bases.length; i++) {
                const baseEmbed = await buildBaseMessage(op, i);
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

            const costEmbed = await buildInfoCostMessage(op, type, page, level);
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
export async function buildInfoSkillMessage(op: Operator, type: number, page: number, level: number): Promise<BaseMessageOptions> {
    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);

    const { embed, thumbnail } = await buildSkillEmbed(op, page, level);

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
    const rowOne = new ActionRowBuilder<ButtonBuilder>().addComponents(lOne, lTwo, lThree, lFour, lFive);
    const rowTwo = new ActionRowBuilder<ButtonBuilder>().addComponents(lSix, lSeven, mOne, mTwo, mThree);

    const skill = op.skills[page];
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
export async function buildInfoModuleMessage(op: Operator, type: number, page: number, level: number): Promise<BaseMessageOptions> {
    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);

    const { embed, thumbnail } = await buildModuleEmbed(op, page, level);

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
    const rowOne = new ActionRowBuilder<ButtonBuilder>().addComponents(lOne, lTwo, lThree);

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
export async function buildInfoArtMessage(op: Operator, type: number, page: number, level: number): Promise<BaseMessageOptions> {
    const skins = op.skins;
    const skin = skins[page];

    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);
    const imagePath = paths.aceshipImageUrl + `/characters/${encodeURIComponent(skin.portraitId)}.png`;
    const image = new AttachmentBuilder(imagePath);

    const { embed, thumbnail } = await buildArtEmbed(op, page);

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
export async function buildInfoCostMessage(op: Operator, type: number, page: number, level: number): Promise<BaseMessageOptions> {
    const avatarPath = paths.aceshipImageUrl + `/avatars/${op.id}.png`;
    const avatar = new AttachmentBuilder(avatarPath);

    const { embed, thumbnail } = await buildCostEmbed(op, page);

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
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(eliteButton, skillButton, masteryButton, moduleButton);

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

    switch (page) {
        default:
        case 0: {
            eliteButton.setDisabled(true);
            break;
        }
        case 1: {
            skillButton.setDisabled(true);
            break;
        }
        case 2: {
            masteryButton.setDisabled(true);
            break;
        }
        case 3: {
            moduleButton.setDisabled(true);
            break;
        }
    }

    return { embeds: [embed], files: [avatar, thumbnail], components: [buttonRow] };
}

function buildAuthorField(char: Enemy | Operator): EmbedAuthorOptions {
    if ((char as Operator).id && (char as Operator).data) {
        const op = (char as Operator);
        const urlName = op.data.name.toLowerCase().split(' the ').join('-').split(/'|,/).join('').split(' ').join('-').split('ë').join('e').split('ł').join('l');// Unholy dumbness
        const authorField = { name: op.data.name, iconURL: `attachment://${op.id}.png`, url: `https://gamepress.gg/arknights/operator/${urlName}` };
        return authorField;
    }
    else if ((char as Enemy).excel) {
        const enem = (char as Enemy);
        const authorField = { name: enem.excel.name, iconURL: `attachment://${enem.excel.enemyId}.png` };
        return authorField;
    }
    return null;
}
async function buildCostString(costs: LevelUpCost[]): Promise<string> {
    let description = '';
    for (const cost of costs) {
        const item = await getItem({ query: cost.id });
        description += `${item.data.name} **x${cost.count}**\n`;
    }
    return description;
}
async function buildRangeField({ range, rangeId }: { range?: GridRange, rangeId?: string }): Promise<EmbedField> {
    if (!range) range = await getRange({ query: rangeId });

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
    return { name: 'Range', value: rangeString, inline: false };
}
function buildStageDiagramFields(stageData: StageData): EmbedField[] {
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

    return [{ name: 'Map', value: mapString, inline: false }, { name: 'Legend', value: legendString, inline: false }];
}
async function buildStageEnemyFields(stageData: StageData): Promise<EmbedField[]> {
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
                waveDict[action.key] = waveDict[action.key] ? waveDict[action.key] + action.count : action.count;
            }
        }
    }

    let enemyString = '', eliteString = '', bossString = '';
    for (const enemyRef of stageData.enemyDbRefs) {
        const enemy = await getEnemy({ query: enemyRef.id });

        if (!enemy) continue;

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

    const fieldArr: EmbedField[] = [];
    if (enemyString !== '') {
        fieldArr.push({ name: 'Enemies', value: enemyString, inline: true });
    }
    if (eliteString !== '') {
        fieldArr.push({ name: 'Elites', value: eliteString, inline: true });
    }
    if (bossString !== '') {
        fieldArr.push({ name: 'Leaders', value: bossString, inline: false });
    }

    return fieldArr;
}

async function buildArtEmbed(op: Operator, page: number): Promise<{ embed: EmbedBuilder, thumbnail: AttachmentBuilder }> {
    const skins = op.skins;
    const skin = skins[page];
    const displaySkin = skin.displaySkin;

    const authorField = buildAuthorField(op);
    const skinName = displaySkin.skinName;
    const skinGroupName = displaySkin.skinGroupName;
    const name = skinName === null ? skinGroupName : `${skinGroupName} - ${skinName}`;

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(`${name}`)
        .setImage(`attachment://${cleanFilename(encodeURIComponent(skin.portraitId))}.png`);

    if (displaySkin.drawerList) {
        let artistString = '';
        for (const drawer of displaySkin.drawerList) {
            artistString += drawer + '\n';
        }
        if (artistString !== '') {
            embed.addFields({ name: displaySkin.drawerList.length > 1 ? 'Artists' : 'Artist', value: artistString });
        }
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

    return { embed, thumbnail };
}
async function buildSkillEmbed(op: Operator, page: number, level: number): Promise<{ embed: EmbedBuilder, thumbnail: AttachmentBuilder }> {
    const skill = op.skills[page];
    const skillLevel = skill.levels[level];

    const thumbnailFilename = skill.iconId === null ? skill.skillId : skill.iconId;
    const thumbnailPath = paths.aceshipImageUrl + `/skills/skill_icon_${thumbnailFilename}.png`;
    const thumbnail = new AttachmentBuilder(thumbnailPath);

    const authorField = buildAuthorField(op);
    const title = `${skillLevel.name} - ${gameConsts.skillLevels[level]}`;
    const spType = gameConsts.spTypes[skillLevel.spData.spType];
    const skillType = gameConsts.skillTypes[skillLevel.skillType];
    let description = `**${spType} - ${skillType}**\n***Cost:* ${skillLevel.spData.spCost} SP - *Initial:* ${skillLevel.spData.initSp} SP`;
    if (skillLevel.duration > 0) {
        description += ` - *Duration:* ${skillLevel.duration} sec`;
    }
    description += `**\n${insertBlackboardVariables(skillLevel.description, skillLevel.blackboard)} `;

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(title)
        .setThumbnail(`attachment://skill_icon_${cleanFilename(thumbnailFilename)}.png`)
        .setDescription(description);

    if (skillLevel.rangeId !== null) {
        const rangeField = await buildRangeField({ rangeId: skillLevel.rangeId });
        embed.addFields(rangeField);
    }

    return { embed, thumbnail };
}
async function buildCostEmbed(op: Operator, page: number): Promise<{ embed: EmbedBuilder, thumbnail: AttachmentBuilder }> {
    const authorField = buildAuthorField(op);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField);

    let thumbnail;
    switch (page) {
        default:
        case 0: {
            const thumbnailPath = paths.aceshipImageUrl + `/items/sprite_exp_card_t4.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);

            embed.setThumbnail(`attachment://sprite_exp_card_t4.png`)
                .setTitle('Elite Upgrade Costs');

            for (let i = 0; i < op.data.phases.length; i++) {
                const phase = op.data.phases[i];
                if (phase.evolveCost === null) continue;

                let phaseDescription = await buildCostString(phase.evolveCost);
                phaseDescription += `LMD **x${gameConsts.evolveGoldCost[op.data.rarity][i - 1]}**\n`;
                embed.addFields({ name: `Elite ${i}`, value: phaseDescription, inline: true });
            }
            break;
        }
        case 1: {
            const thumbnailPath = paths.aceshipImageUrl + `/items/MTL_SKILL2.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);

            embed.setThumbnail(`attachment://MTL_SKILL2.png`)
                .setTitle('Skill Upgrade Costs');

            for (let i = 0; i < op.data.allSkillLvlup.length; i++) {
                const skillDescription = await buildCostString(op.data.allSkillLvlup[i].lvlUpCost);
                if (skillDescription === '') continue;

                embed.addFields({ name: `Level ${i + 2}`, value: skillDescription, inline: true });
            }
            break;
        }
        case 2: {
            const thumbnailPath = paths.aceshipImageUrl + `/items/MTL_SKILL3.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);

            embed.setThumbnail(`attachment://MTL_SKILL3.png`)
                .setTitle('Skill Mastery Costs');

            for (let i = 0; i < op.data.skills.length; i++) {
                const opSkill = op.data.skills[i];
                const skill = op.skills[i];

                embed.addFields({ name: '\u200B', value: `**Skill ${i + 1} - ${skill.levels[0].name}**` });

                for (let i = 0; i < opSkill.levelUpCostCond.length; i++) {
                    const masteryDescription = await buildCostString(opSkill.levelUpCostCond[i].levelUpCost);
                    embed.addFields({ name: `Mastery ${i + 1}`, value: masteryDescription, inline: true });
                }
            }
            break;
        }
        case 3: {
            const thumbnailPath = paths.aceshipImageUrl + `/items/mod_unlock_token.png`;
            thumbnail = new AttachmentBuilder(thumbnailPath);

            embed.setThumbnail(`attachment://mod_unlock_token.png`)
                .setTitle('Module Upgrade Costs');

            for (const module of op.modules) {
                if (module.info.uniEquipId.includes('uniequip_001')) continue;

                embed.addFields({ name: '\u200B', value: `**${module.info.typeIcon.toUpperCase()} - ${module.info.uniEquipName}**` });

                for (const key of Object.keys(module.info.itemCost)) {
                    const moduleDescription = await buildCostString(module.info.itemCost[key]);
                    embed.addFields({ name: `Level ${key}`, value: moduleDescription, inline: true });
                }
            }
            break;
        }
    }

    return { embed, thumbnail };
}
async function buildModuleEmbed(op: Operator, page: number, level: number): Promise<{ embed: EmbedBuilder, thumbnail: AttachmentBuilder }> {
    const module = op.modules[page];
    const moduleLevel = module.data.phases[level];

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
                description += `${insertBlackboardVariables(candidate.additionalDescription, candidate.blackboard)}\n`;
            }
            if (candidate.overrideDescripton !== null) {
                description += `${insertBlackboardVariables(candidate.overrideDescripton, candidate.blackboard)}\n`;
            }
        }
        if (part.addOrOverrideTalentDataBundle.candidates !== null) {
            const candidates = part.addOrOverrideTalentDataBundle.candidates;
            const candidate = candidates[candidates.length - 1];

            if (candidate.name !== null) {
                talentName = candidate.name;
            }
            if (candidate.upgradeDescription !== null) {
                talentDescription += `${insertBlackboardVariables(candidate.upgradeDescription, candidate.blackboard)}\n`;
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

    return { embed, thumbnail };
}