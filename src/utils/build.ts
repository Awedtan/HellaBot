import * as Djs from 'discord.js';
import type * as T from "hella-types";
import { join } from 'path';
import { globalCommands } from '../structures/HellaBot';
import * as api from './api';
const { embedColour, paths, gameConsts } = require('../constants');

const cleanFilename = (text: string) => text.split(/%|[#\+]|&|\[|\]/).join(''); // Remove special characters that discord doesn't like (%, #, etc.)
const urlExists = async (url: string) => (await fetch(url)).status === 200;
const createCustomId = (...args: (string | number | boolean)[]): string => args.join('ඞ').toLowerCase();
function removeStyleTags(text: string) {
    // cant use something like /<[^>]+>/g since stage hazards are also marked by <>, gotta be specific ¯\_(ツ)_/¯
    const regex = /<.[a-z]{2,5}?\.[^<]+>|<\/[^<]*>|<color=[^>]+>/g;
    return text.replace(regex, '') ?? '';
}
function insertBlackboard(text: string, blackboard: T.Blackboard[]) {
    // Note: check these every so often to see if their skills still display properly
    // silverash s2/s3
    // eyjafjalla s2
    // lin s1
    // tachanka s1/s2
    // mizuki s1
    // mostima s3
    // irene s1
    // utage s2

    const formatVariable = (chunk: string, blackboard: T.Blackboard[]) => {
        // {tag} {tag:0} {tag:0%} {tag:0.0} {tag:0.0%}
        const tag = chunk.split(':')[0].toLowerCase();
        const negative = tag.startsWith('-');
        const key = negative ? tag.slice(1) : tag;
        const variable = blackboard.find(variable => variable.key === key);

        if (!variable) return chunk;

        const value = negative ? -variable.value : variable.value;
        return chunk.charAt(chunk.length - 1) === '%' ? `\`${Math.round(value * 100)}%\`` : `\`${value}\``;
    }

    const textArr = removeStyleTags(text.trim()).split(/{|}/);

    if (textArr.join('') === '') return null;

    for (let i = 0; i < textArr.length; i++) {
        textArr[i] = formatVariable(textArr[i], blackboard);
    }

    return textArr.join('').replaceAll('-`', '`-').replaceAll('+`', '`+');
}
const blankChar = '\u200B';

export async function buildArtMessage(op: T.Operator, page: number): Promise<Djs.BaseMessageOptions> {
    const embed = buildArtEmbed(op, page);

    const rowOne = new Djs.ActionRowBuilder();
    const rowTwo = new Djs.ActionRowBuilder();
    const components = [];

    for (let i = 0; i < op.skins.length; i++) {
        const skinGroup = op.skins[i].displaySkin.skinGroupName;
        const button = new Djs.ButtonBuilder()
            .setCustomId(createCustomId('art', op.id, i))
            .setLabel(skinGroup)
            .setStyle(Djs.ButtonStyle.Primary);
        if (i === page)
            button.setDisabled(true);
        if (op.skins[i].battleSkin.skinOrPrefabId === 'DefaultSkin') {
            rowOne.addComponents(button);
            components[0] = rowOne;
        }
        else {
            rowTwo.addComponents(button);
            components[1] = rowTwo;
        }
    }

    return { embeds: [embed], components: components };
}
export async function buildBaseMessage(op: T.Operator, page: number): Promise<Djs.BaseMessageOptions> {
    const baseInfo = op.bases[page].condition;
    const base = op.bases[page].skill;

    const authorField = buildAuthorField(op);
    const title = `${base.buffName} - ${gameConsts.eliteLevels[baseInfo.cond.phase]} Lv${baseInfo.cond.level}`;
    const description = removeStyleTags(base.description);

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(title)
        .setThumbnail(paths.aceshipImageUrl + `/ui/infrastructure/skill/${base.skillIcon}.png`)
        .setDescription(description);

    return { embeds: [embed] };
}
export async function buildCcMessage(stage: T.CCStage, page: number): Promise<Djs.BaseMessageOptions> {
    const stageInfo = stage.const;
    const stageData = stage.levels;

    const title = `${stageInfo.location} - ${stageInfo.name}`;
    const description = removeStyleTags(stageInfo.description);

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(`${paths.stageViewerUrl}?level=${stage.const.levelId.toLowerCase()}`)
        .setDescription(description);

    embed.addFields(await buildStageEnemyFields(stageData));

    const imageButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('cc', stage.const.name.toLowerCase(), 0))
        .setLabel('Preview')
        .setStyle(Djs.ButtonStyle.Primary);
    const diagramButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('cc', stage.const.name.toLowerCase(), 1))
        .setLabel('Diagram')
        .setStyle(Djs.ButtonStyle.Primary);
    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(imageButton, diagramButton);

    switch (page) {
        case 0:
            imageButton.setDisabled(true);
            break;
        case 1:
            diagramButton.setDisabled(true);
            break;
    }

    if (page === 0) {
        const imagePath = paths.myAssetUrl + `/stages/${stageInfo.levelId.split('/')[stageInfo.levelId.split('/').length - 1]}.png`;
        if (await urlExists(imagePath)) {
            embed.setImage(imagePath)

            return { content: '', embeds: [embed], components: [buttonRow] };
        }
        else {
            embed.addFields(buildStageDiagramFields(stageData));

            return { content: '', embeds: [embed], components: [] };
        }
    }
    else {
        embed.addFields(buildStageDiagramFields(stageData));

        return { content: '', embeds: [embed], components: [buttonRow] };
    }
}
export async function buildCcbMessage(stage: T.CCStage, page: number): Promise<Djs.BaseMessageOptions> {
    const stageInfo = stage.const;
    const stageData = stage.levels;

    const title = `${stageInfo.location} - ${stageInfo.name}`;
    const description = removeStyleTags(stageInfo.description);

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(`${paths.stageViewerUrl}?level=${stage.const.levelId.toLowerCase()}`)
        .setDescription(description);

    embed.addFields(await buildStageEnemyFields(stageData));

    const imageButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('ccb', stage.const.name.toLowerCase(), 0))
        .setLabel('Preview')
        .setStyle(Djs.ButtonStyle.Primary);
    const diagramButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('ccb', stage.const.name.toLowerCase(), 1))
        .setLabel('Diagram')
        .setStyle(Djs.ButtonStyle.Primary);
    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(imageButton, diagramButton);

    switch (page) {
        case 0:
            imageButton.setDisabled(true);
            break;
        case 1:
            diagramButton.setDisabled(true);
            break;
    }

    if (page === 0) {
        const imagePath = paths.myAssetUrl + `/stages/${stageInfo.levelId.replace('level_', '').split('/')[stageInfo.levelId.replace('level_', '').split('/').length - 1]}.png`;
        if (await urlExists(imagePath)) {
            embed.setImage(imagePath)

            return { content: '', embeds: [embed], components: [buttonRow] };
        }
        else {
            embed.addFields(buildStageDiagramFields(stageData));

            return { content: '', embeds: [embed], components: [] };
        }
    }
    else {
        embed.addFields(buildStageDiagramFields(stageData));

        return { content: '', embeds: [embed], components: [buttonRow] };
    }
}
export async function buildCcSelectMessage(season: string): Promise<Djs.BaseMessageOptions> {
    const ccSelector = new Djs.StringSelectMenuBuilder()
        .setCustomId(createCustomId('cc', 'select'))
        .setPlaceholder('Select a stage!');
    const componentRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>().addComponents(ccSelector);

    const names: string = gameConsts.ccSeasons[season];
    for (const name of names) {
        ccSelector.addOptions(new Djs.StringSelectMenuOptionBuilder()
            .setLabel(name)
            .setValue(name.toLowerCase())
        );
    }

    return { content: `Please select a stage from CC#${season} below:`, components: [componentRow] };
}
export async function buildCcbSelectMessage(season: string): Promise<Djs.BaseMessageOptions> {
    const ccbSelector = new Djs.StringSelectMenuBuilder()
        .setCustomId(createCustomId('ccb', 'select'))
        .setPlaceholder('Select a stage!');
    const componentRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>().addComponents(ccbSelector);

    const names: string = gameConsts.ccbSeasons[season];
    for (const name of names) {
        ccbSelector.addOptions(new Djs.StringSelectMenuOptionBuilder()
            .setLabel(name)
            .setValue(name.toLowerCase())
        );
    }

    return { content: `Please select a stage from CCB#${season} below:`, components: [componentRow] };
}
export async function buildCostMessage(op: T.Operator, page: number): Promise<Djs.BaseMessageOptions> {
    const embed = await buildCostEmbed(op, page);

    const eliteButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('costs', op.id, 0))
        .setLabel('Promotions')
        .setStyle(Djs.ButtonStyle.Primary);
    const skillButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('costs', op.id, 1))
        .setLabel('Skills')
        .setStyle(Djs.ButtonStyle.Primary);
    const masteryButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('costs', op.id, 2))
        .setLabel('Masteries')
        .setStyle(Djs.ButtonStyle.Primary);
    const moduleButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('costs', op.id, 3))
        .setLabel('Modules')
        .setStyle(Djs.ButtonStyle.Primary);
    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(eliteButton, skillButton, masteryButton, moduleButton);

    if (op.data.skills.length == 0) {
        skillButton.setStyle(Djs.ButtonStyle.Secondary);
        skillButton.setDisabled(true);
    }
    if (gameConsts.rarity[op.data.rarity] <= 2) {
        masteryButton.setStyle(Djs.ButtonStyle.Secondary);
        masteryButton.setDisabled(true);
    }
    if (op.modules.length == 0) {
        moduleButton.setStyle(Djs.ButtonStyle.Secondary);
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

    return { embeds: [embed], components: [buttonRow] };
}
export async function buildDefineMessage(definition: T.Definition): Promise<Djs.BaseMessageOptions> {
    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(definition.termName)
        .setDescription(removeStyleTags(definition.description));

    return { embeds: [embed] };
}
export async function buildDefineListMessage(): Promise<Djs.BaseMessageOptions> {
    let statusDescription = '', effectDescription = '', groupDescription = '';
    const dataArr = await api.all('define');
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

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('In-Game Terms and Groups')
        .addFields(
            { name: 'Status Effects', value: statusDescription, inline: true },
            { name: 'Base Effects', value: effectDescription, inline: true },
            { name: 'Base Groups', value: groupDescription, inline: true }
        );

    return { embeds: [embed] };
}
export async function buildEnemyMessage(enemy: T.Enemy, level: number): Promise<Djs.BaseMessageOptions> {
    const enemyInfo = enemy.excel;
    const enemyData = enemy.levels.Value[level].enemyData;
    const baseData = enemy.levels.Value[0].enemyData;

    const title = `${enemyInfo.enemyIndex} - ${enemyInfo.name}`;
    const description = removeStyleTags(enemyInfo.description)
        .concat(
            enemyInfo.abilityList.map((ability) => {
                const abilityText = removeStyleTags(ability.text);
                switch (ability.textFormat) {
                    case 'NORMAL':
                        return `\n\n${abilityText}`;
                    case 'SILENCE':
                        return `\n\n${abilityText} (Silenceable)`;
                    case 'TITLE':
                        return `\n\n**${abilityText}**`;
                    default:
                        return '';
                }
            }).join('')
        );

    const hp = enemyData.attributes.maxHp.m_defined ? enemyData.attributes.maxHp.m_value.toString() :
        baseData.attributes.maxHp.m_defined ? baseData.attributes.maxHp.m_value.toString() : '0';
    const atk = enemyData.attributes.atk.m_defined ? enemyData.attributes.atk.m_value.toString() :
        baseData.attributes.atk.m_defined ? baseData.attributes.atk.m_value.toString() : '0';
    const def = enemyData.attributes.def.m_defined ? enemyData.attributes.def.m_value.toString() :
        baseData.attributes.def.m_defined ? baseData.attributes.def.m_value.toString() : '0';
    const res = enemyData.attributes.magicResistance.m_defined ? enemyData.attributes.magicResistance.m_value.toString() :
        baseData.attributes.magicResistance.m_defined ? baseData.attributes.magicResistance.m_value.toString() : '0';
    const weight = enemyData.attributes.massLevel.m_defined ? enemyData.attributes.massLevel.m_value.toString() :
        baseData.attributes.massLevel.m_defined ? baseData.attributes.massLevel.m_value.toString() : '0';
    const life = enemyData.lifePointReduce.m_defined ? enemyData.lifePointReduce.m_value.toString() :
        baseData.lifePointReduce.m_defined ? baseData.lifePointReduce.m_value.toString() : '1';
    const elemDamageRes = enemyData.attributes.epDamageResistance.m_defined ? enemyData.attributes.epDamageResistance.m_value.toString() :
        baseData.attributes.epDamageResistance.m_defined ? baseData.attributes.epDamageResistance.m_value.toString() : '0';
    const elemRes = enemyData.attributes.epResistance.m_defined ? enemyData.attributes.epResistance.m_value.toString() :
        baseData.attributes.epResistance.m_defined ? baseData.attributes.epResistance.m_value.toString() : '0';
    const move = enemyData.attributes.moveSpeed.m_defined ? enemyData.attributes.moveSpeed.m_value.toString() :
        baseData.attributes.moveSpeed.m_defined ? baseData.attributes.moveSpeed.m_value.toString() : '0';
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

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setThumbnail(paths.aceshipImageUrl + `/enemy/${enemyInfo.enemyId}.png`)
        .setDescription(description)
        .addFields(
            { name: '❤️ HP', value: hp, inline: true },
            { name: '⚔️ ATK', value: atk, inline: true },
            { name: '🛡️ DEF', value: def, inline: true },
            { name: '✨ RES', value: res, inline: true },
            { name: '⚖️ Weight', value: weight, inline: true },
            { name: '👟 Move Speed', value: move, inline: true, },
            { name: '💖  Elemental RES', value: elemDamageRes, inline: true },
            { name: '🧿 Elemental Resistance', value: elemRes, inline: true },
            { name: '💔 Life Points', value: life, inline: true },
            { name: 'Silence', value: silence ? '❌' : '✅', inline: true },
            { name: 'Stun', value: stun ? '❌' : '✅', inline: true },
            { name: 'Sleep', value: sleep ? '❌' : '✅', inline: true },
            { name: 'Freeze', value: frozen ? '❌' : '✅', inline: true },
            { name: 'Levitate', value: levitate ? '❌' : '✅', inline: true }
        );

    const enemyLevels = enemy.levels.Value.length;
    if (enemyLevels === 1)
        return { embeds: [embed] };

    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>();
    for (let i = 0; i < enemyLevels; i++) {
        buttonRow.addComponents(new Djs.ButtonBuilder()
            .setCustomId(createCustomId('enemy', enemy.excel.enemyId, i))
            .setLabel(`Level ${i + 1}`)
            .setStyle(Djs.ButtonStyle.Primary)
        )
        if (i === level) {
            buttonRow.components[i].setDisabled(true);
        }
    }

    return { embeds: [embed], components: [buttonRow] };
}
export async function buildEventListMessage(index: number): Promise<Djs.BaseMessageOptions> {
    const eventCount = 6;

    let eventArr = [];
    const dataArr = await api.all('event');
    for (const event of dataArr) {
        const skipLoginArr = ['LOGIN_ONLY', 'CHECKIN_ONLY', 'FLOAT_PARADE', 'PRAY_ONLY', 'GRID_GACHA_V2', 'GRID_GACHA']; // Skip login events
        if (skipLoginArr.includes(event.type)) continue;
        eventArr.push(event);
    }
    eventArr.sort((first: T.GameEvent, second: T.GameEvent) => second.startTime - first.startTime); // Sort by descending start time

    const embed = new Djs.EmbedBuilder()
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

    const prevButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('events', index - 1))
        .setLabel('Newer')
        .setStyle(Djs.ButtonStyle.Primary);
    const nextButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('events', index + 1))
        .setLabel('Older')
        .setStyle(Djs.ButtonStyle.Primary);
    const componentRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(prevButton, nextButton);

    if (index === 0) {
        prevButton.setDisabled(true);
        prevButton.setStyle(Djs.ButtonStyle.Secondary);
    }
    if (index * eventCount + eventCount >= eventArr.length) {
        nextButton.setDisabled(true);
        nextButton.setStyle(Djs.ButtonStyle.Secondary);
    }

    return { embeds: [embed], components: [componentRow] };
}
export async function buildHelpMessage(name: string): Promise<Djs.BaseMessageOptions> {
    const command = globalCommands[name];

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(command.name)
        .setDescription(command.description.join('\n\n'))
        .addFields({ name: 'Usage', value: command.usage.join('\n') });

    return { embeds: [embed] };
}
export async function buildHelpListMessage(): Promise<Djs.BaseMessageOptions> {
    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Help Menu');
    embed.addFields({ name: 'Command List', value: Object.values(globalCommands).map(command => `\`${command.data.name}\``).join(', ') });
    embed.addFields({ name: blankChar, value: 'For more information on a specific command, use `/help [command]`' });

    return { embeds: [embed] };
}
export async function buildInfoMessage(op: T.Operator, type: number, page: number, level: number): Promise<Djs.BaseMessageOptions> {
    const embedArr = [], fileArr = [], rowArr = [];
    const getMessageComponents = (message: Djs.BaseMessageOptions) => {
        if (message.embeds) embedArr.push(...message.embeds);
        if (message.files) fileArr.push(...message.files);
        if (message.components) rowArr.push(...message.components);
    };

    const embed = buildOperatorEmbed(op);
    embedArr.push(embed);

    const typeLabels = ['Skills', 'Modules', 'Art', 'Base Skills', 'Costs'];
    const typeRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>();

    for (let i = 0; i < 5; i++) {
        const button = new Djs.ButtonBuilder()
            .setCustomId(createCustomId('info', op.id, i + 1, 0, 0))
            .setLabel(typeLabels[i])
            .setStyle(Djs.ButtonStyle.Success);
        if (i + 1 === type)
            button.setCustomId('info_type_current')
                .setDisabled(true);
        typeRow.addComponents(button);
    }
    if (!op.skills || op.skills.length === 0)
        typeRow.components[0].setStyle(Djs.ButtonStyle.Secondary)
            .setDisabled(true);
    if (!op.modules || op.modules.length === 0)
        typeRow.components[1].setStyle(Djs.ButtonStyle.Secondary)
            .setDisabled(true);
    if (!op.skins || op.skins.length === 0)
        typeRow.components[2].setStyle(Djs.ButtonStyle.Secondary)
            .setDisabled(true);
    if (!op.bases || op.bases.length === 0)
        typeRow.components[3].setStyle(Djs.ButtonStyle.Secondary)
            .setDisabled(true);
    if (gameConsts.rarity[op.data.rarity] <= 1)
        typeRow.components[4].setStyle(Djs.ButtonStyle.Secondary)
            .setDisabled(true);

    switch (type) {
        case 1: {
            if (level === 0) level = 6;
            getMessageComponents(await buildInfoSkillMessage(op, type, page, level));

            if (op.skills.length <= 1) break;

            const pageRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>();
            for (let i = 0; i < op.skills.length; i++) {
                const button = new Djs.ButtonBuilder()
                    .setCustomId(createCustomId('info', op.id, type, i, level))
                    .setLabel(`Skill ${i + 1}`)
                    .setStyle(Djs.ButtonStyle.Primary);
                if (i === page)
                    button.setCustomId('info_page_current')
                        .setDisabled(true);
                pageRow.addComponents(button);
            }
            rowArr.push(pageRow);
            break;
        }
        case 2: {
            getMessageComponents(buildInfoModuleMessage(op, type, page, level));

            if (op.modules.length <= 1) break;

            const pageRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>();
            for (let i = 0; i < op.modules.length; i++) {
                const button = new Djs.ButtonBuilder()
                    .setCustomId(createCustomId('info', op.id, type, i, level))
                    .setLabel(`Module ${i + 1}`)
                    .setStyle(Djs.ButtonStyle.Primary);
                if (i === page)
                    button.setCustomId('info_page_current')
                        .setDisabled(true);
                pageRow.addComponents(button);
            }
            rowArr.push(pageRow);
            break;
        }
        case 3: {
            getMessageComponents(buildInfoArtMessage(op, type, page, level));
            break;
        }
        case 4: {
            for (let i = 0; i < op.bases.length; i++) {
                getMessageComponents(await buildBaseMessage(op, i));
            }
            break;
        }
        case 5: {
            getMessageComponents(await buildInfoCostMessage(op, type, page, level));
            break;
        }
    }

    rowArr.push(typeRow);

    return { embeds: embedArr, files: fileArr, components: rowArr };
}
export async function buildItemMessage(item: T.Item): Promise<Djs.BaseMessageOptions> {
    const description = item.data.description !== null ? `${item.data.usage}\n\n${item.data.description}` : item.data.usage;

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(item.data.name)
        .setDescription(description);

    let stageString = '';
    for (const stageDrop of item.data.stageDropList) {
        const stageId = stageDrop.stageId;
        if (!stageId.includes('main') && !stageId.includes('sub')) continue;

        const stage = (await api.single('stage', { query: stageId, include: ['excel.code'] }))[0];
        stageString += `${stage.excel.code} - ${gameConsts.itemDropRarities[stageDrop.occPer]}\n`;
    }
    if (stageString !== '') {
        embed.addFields({ name: 'Drop Stages', value: stageString, inline: true });
    }
    if (item.formula !== null && item.formula.costs.length > 0) {
        const formulaString = buildCostString(item.formula.costs, await api.all('item'));
        embed.addFields({ name: 'Crafting Formula', value: formulaString, inline: true });
    }
    const imagePath = paths.aceshipImageUrl + `/items/${item.data.iconId}.png`;
    if (await urlExists(imagePath))
        embed.setThumbnail(imagePath);

    return { embeds: [embed] };
}
export async function buildModuleMessage(op: T.Operator, page: number, level: number): Promise<Djs.BaseMessageOptions> {
    const embed = buildModuleEmbed(op, page, level);

    const lOne = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('modules', op.id, page, 0))
        .setLabel('Lv1')
        .setStyle(Djs.ButtonStyle.Secondary);
    const lTwo = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('modules', op.id, page, 1))
        .setLabel('Lv2')
        .setStyle(Djs.ButtonStyle.Secondary);
    const lThree = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('modules', op.id, page, 2))
        .setLabel('Lv3')
        .setStyle(Djs.ButtonStyle.Secondary);
    const rowOne = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(lOne, lTwo, lThree);

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

    return { embeds: [embed], components: [rowOne] };
}
export async function buildNewMessage() {
    const opName = (op: T.Operator) => `${gameConsts.rarity[op.data.rarity] + 1}★ ${op.data.name}`;

    const opCache = {};
    async function getOp(id: string) {
        if (!opCache[id]) {
            opCache[id] = await api.single('operator', { query: id, include: ['data.rarity', 'data.name'] });
        }
        return opCache[id];
    }

    const aboutInfo = await api.about();
    const date = new Date(aboutInfo.date);
    const newInfo = await api.newEn();

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Newly Updated Game Data')
        .setDescription('Data fetched from: https://github.com/Kengxxiao/ArknightsGameData_YoStar\n' +
            `Latest commit: \`${aboutInfo.hash}\`\n` +
            `Last updated at: \`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.toTimeString().slice(0, 8)}\``);

    const archetypeString = newInfo.archetype
        ?.map(archetype => archetype.value)
        .sort().reverse()
        .join('\n');
    if (archetypeString && archetypeString.length > 0)
        embed.addFields({ name: 'New Archetypes', value: archetypeString });

    const opString = newInfo.operator
        ?.map(op => opName(op.value))
        .sort().reverse()
        .join('\n');
    if (opString && opString.length > 0)
        embed.addFields({ name: 'New Operators', value: opString });

    const skinString = (await Promise.all(newInfo.skin
        ?.filter(skin => skin.value.displaySkin.skinName)
        .map(async skin => {
            const op = await getOp(skin.value.charId);
            return `${opName(op)} - ${skin.value.displaySkin.skinName}`;
        })))
        .sort().reverse()
        .join('\n');
    if (skinString && skinString.length > 0)
        embed.addFields({ name: 'New Skins', value: skinString });

    const moduleString = (await Promise.all(newInfo.module
        ?.filter(module => module.value.data)
        .map(async module => {
            const op = await getOp(module.value.info.charId);
            return `${opName(op)} - ${module.value.info.uniEquipName}`
        })))
        .sort().reverse()
        .join('\n');
    if (moduleString && moduleString.length > 0)
        embed.addFields({ name: 'New Modules', value: moduleString });

    const paradoxString = (await Promise.all(newInfo.paradox
        ?.filter(paradox => paradox.value.levels)
        .map(async paradox => {
            const op = await getOp(paradox.value.excel.charId);
            return `${opName(op)} - ${paradox.value.excel.name}`
        })))
        .sort().reverse()
        .join('\n');
    if (paradoxString && paradoxString.length > 0)
        embed.addFields({ name: 'New Paradox Simulations', value: paradoxString });

    return { embeds: [embed] };
}
export async function buildParadoxMessage(op: T.Operator, page: number): Promise<Djs.BaseMessageOptions> {
    const paradox = op.paradox;
    const stageInfo = paradox.excel;
    const stageData = paradox.levels;

    const authorField = buildAuthorField(op);
    const title = `Paradox Simulation - ${stageInfo.name}`;
    const description = removeStyleTags(stageInfo.description);

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(title)
        .setDescription(description);

    embed.addFields(await buildStageEnemyFields(stageData));

    const imageButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('paradox', stageInfo.charId, 0))
        .setLabel('Preview')
        .setStyle(Djs.ButtonStyle.Primary);
    const diagramButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('paradox', stageInfo.charId, 1))
        .setLabel('Diagram')
        .setStyle(Djs.ButtonStyle.Primary);
    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(imageButton, diagramButton);

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
            embed.setImage(imagePath)

            return { embeds: [embed], components: [buttonRow] };
        }
        else {
            embed.addFields(buildStageDiagramFields(stageData));

            return { embeds: [embed] };
        }
    }
    else {
        embed.addFields(buildStageDiagramFields(stageData));

        return { embeds: [embed], components: [buttonRow] };
    }
}
export async function buildRecruitMessage(value: number, tag: string, select: boolean, snowflakes: string[]): Promise<Djs.BaseMessageOptions[]> {
    if (select) {
        value *= gameConsts.tagValues[tag];
    }
    else {
        value /= gameConsts.tagValues[tag];
    }

    const button = (id: string, label: string) => {
        return new Djs.ButtonBuilder()
            .setCustomId(createCustomId('recruit', value, id, 'select', ...snowflakes))
            .setLabel(label)
            .setStyle(Djs.ButtonStyle.Secondary);
    }
    const starterButton = button('starter', 'Starter');
    const seniorButton = button('senior', 'Senior Operator');
    const topButton = button('top', 'Top Operator');
    const meleeButton = button('melee', 'Melee');
    const rangedButton = button('ranged', 'Ranged');
    const guardButton = button('guard', 'Guard');
    const medicButton = button('medic', 'Medic');
    const vanguardButton = button('vanguard', 'Vanguard');
    const casterButton = button('caster', 'Caster');
    const sniperButton = button('sniper', 'Sniper');
    const defenderButton = button('defender', 'Defender');
    const supporterButton = button('supporter', 'Supporter');
    const specialistButton = button('specialist', 'Specialist');
    const healingButton = button('healing', 'Healing');
    const supportButton = button('support', 'Support');
    const dpsButton = button('dps', 'DPS');
    const aoeButton = button('aoe', 'AOE');
    const slowButton = button('slow', 'Slow');
    const survivalButton = button('survival', 'Survival');
    const defenseButton = button('defense', 'Defense');
    const debuffButton = button('debuff', 'Debuff');
    const shiftButton = button('shift', 'Shift');
    const crowdControlButton = button('crowd-control', 'Crowd-Control');
    const nukerButton = button('nuker', 'Nuker');
    const summonButton = button('summon', 'Summon');
    const fastRedeployButton = button('fast-redeploy', 'Fast-Redeploy');
    const dpRecoveryButton = button('dp-recovery', 'DP-Recovery');
    const robotButton = button('robot', 'Robot');
    const deleteButton = button('delete', '🗑️ Clear Tags')
        .setDisabled(true)
        .setStyle(Djs.ButtonStyle.Danger);

    const qualComponents = [
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(starterButton, seniorButton, topButton),
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(meleeButton, rangedButton),
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(guardButton, medicButton, vanguardButton, casterButton, sniperButton),
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(defenderButton, supporterButton, specialistButton)
    ];
    const tagComponents = [
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(healingButton, supportButton, dpsButton, aoeButton, slowButton),
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(survivalButton, defenseButton, debuffButton, shiftButton, crowdControlButton),
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(nukerButton, summonButton, fastRedeployButton, dpRecoveryButton, robotButton)
    ];
    const utilComponents = [
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(deleteButton)
    ];

    const components = []; components.push(...qualComponents, ...tagComponents);
    const selectedButtons = [];
    for (const actionRow of components) {
        for (const button of actionRow.components) {
            const buttonTag = button.data.custom_id.split('ඞ')[2];
            const buttonValue = gameConsts.tagValues[buttonTag];
            if (value % buttonValue !== 0) continue;
            selectedButtons.push(button);
        }
    }
    for (const button of selectedButtons) {
        deleteButton.setDisabled(false);
        button.setCustomId(button.data.custom_id.replace('select', 'deselect'));
        button.setStyle(Djs.ButtonStyle.Primary);
    }
    if (selectedButtons.length >= 5) {
        for (const actionRow of components) {
            for (const button of actionRow.components) {
                if (selectedButtons.includes(button)) continue;
                button.setDisabled(true);
            }
        }
    }

    const qualEmbed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Qualification/Position/Class')
    const tagEmbed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Tags')
    const recruitEmbed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Recruitment Calculator');

    // chatgpt prompt: in javascript, i have an array of 1-5 unique prime numbers. write a function to get all possible distinct combinations of prime numbers, where a combination of numbers is their product
    function getPrimeCombinations(primes: number[], currentCombination = [], index = 0, result = []): number[] {
        if (currentCombination.length > 0) {
            const product = currentCombination.reduce((acc, prime) => acc * prime, 1);
            result.push(product);
        }
        for (let i = index; i < primes.length; i++) {
            if (!currentCombination.includes(primes[i])) {
                getPrimeCombinations(primes, [...currentCombination, primes[i]], i, result);
            }
        }
        return result;
    }
    const primeArray = selectedButtons.map(x => gameConsts.tagValues[x.data.custom_id.split('ඞ')[2]]);
    const opMap: { [key: number]: T.Operator[] } = getPrimeCombinations(primeArray).reduce((acc, combination) => { acc[combination] = []; return acc; }, {});
    const opList = await api.all('operator', { include: ['id', 'recruit', 'data.rarity', 'data.name'] })
    for (const key of Object.keys(opMap)) {
        for (const op of opList) {
            if (!gameConsts.recruitPool.includes(op.id)) continue;
            if (op.recruit % parseInt(key) !== 0) continue;
            if (op.recruit % gameConsts.tagValues['top'] === 0 && parseInt(key) % gameConsts.tagValues['top'] !== 0) continue;

            opMap[key].push(op);
        }
    }
    for (const value of Object.values(opMap)) {
        value.sort((a, b) => { return gameConsts.rarity[b.data.rarity] - gameConsts.rarity[a.data.rarity] });
    }

    let sortArr = [];
    for (const key of Object.keys(opMap)) {
        const temp = Object.keys(gameConsts.tagValues).filter((x) => x !== '' && x.slice(0, 4) !== 'TIER' && parseInt(key) % gameConsts.tagValues[x] === 0);
        const tags = selectedButtons.filter(x => temp.includes(x.data.custom_id.split('ඞ')[2])).map(x => x.data.label);
        if (opMap[key].length === 0) continue;
        sortArr.push([tags.join(' + '), opMap[key]]);
    }
    sortArr.sort((a, b) => { // sort tag combos by highest rarity
        const rarity = gameConsts.rarity[b[1][b[1].length - 1].data.rarity] - gameConsts.rarity[a[1][a[1].length - 1].data.rarity];
        if (rarity) return rarity;
        return a[1].length - b[1].length;
    });

    let combCount = 0;
    for (const opArr of sortArr) {
        let opCount = 0, opString = '';
        for (const op of opArr[1]) {
            if (opCount < 12) {
                opString += `${gameConsts.rarity[op.data.rarity] + 1}★ ${op.data.name}\n`;
            }
            opCount++;
        }
        if (combCount < 6) {
            opString = opCount >= 13 ? `${opString}${opCount - 12} more...` : opString;
            recruitEmbed.addFields({ name: opArr[0], value: opString, inline: true });
        }
        combCount++;
    }

    return [{ content: '', embeds: [qualEmbed], components: qualComponents }, { content: '', embeds: [tagEmbed], components: tagComponents }, { content: '', embeds: [recruitEmbed], components: utilComponents }];
}
export async function buildRogueRelicMessage(relic: T.RogueRelic): Promise<Djs.BaseMessageOptions> {
    const description = `***Cost:* ${relic.value}▲**\n${relic.description !== null ? `${relic.usage}\n\n${relic.description}` : relic.usage}`;

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(relic.name)
        .setDescription(description);

    const imagePath = paths.myAssetUrl + `/rogueitems/${relic.iconId}.png`;
    if (await urlExists(imagePath))
        embed.setThumbnail(imagePath);

    return { embeds: [embed] };
}
export async function buildRogueRelicListMessage(theme: number, index: number): Promise<Djs.BaseMessageOptions> {
    const rogueTheme = await api.single('rogue', { query: theme.toString(), include: ['name', 'relicDict'] });
    const descriptionLengthLimit = 24;
    const columnCount = 2;
    let descIndex = -1;
    const descriptionArr = [], ticketArr = [], toolArr = [], totemArr = [], relicArr = [], defaultArr = [];

    const pushDescription = (string: string) => {
        if (!descriptionArr[descIndex]) {
            descriptionArr[descIndex] = { string: '', length: 0 };
        }

        descriptionArr[descIndex].string += string;
        descriptionArr[descIndex].length++;

        if (descriptionArr[descIndex].length > descriptionLengthLimit) {
            descIndex++;
            descriptionArr[descIndex] = { string: '', length: 0 };
        }
    }

    for (const relic of Object.values(rogueTheme.relicDict)) {
        switch (relic.type) {
            case 'RECRUIT_TICKET':
            case 'UPGRADE_TICKET':
                ticketArr.push(relic.name);
                break;
            case 'ACTIVE_TOOL':
                toolArr.push(relic.name);
                break;
            case 'TOTEM':
                totemArr.push(relic.name);
                break;
            case 'RELIC':
                relicArr.push(relic.name);
                break;
            default:
                defaultArr.push(relic.name);
                break;
        }
    }

    if (ticketArr.length > 0) {
        descIndex++;
        pushDescription('**Operator Vouchers**\n\n');
    }
    ticketArr.forEach(relic => pushDescription(`${relic}\n`));
    if (toolArr.length > 0) {
        descIndex++;
        pushDescription('**Tactical Props**\n\n');
    }
    toolArr.forEach(relic => pushDescription(`${relic}\n`));
    if (totemArr.length > 0) {
        descIndex++;
        pushDescription('**Foldartals**\n\n');
    }
    totemArr.forEach(relic => pushDescription(`${relic}\n`));
    if (relicArr.length > 0) {
        descIndex++;
        pushDescription('**Relics**\n\n');
    }
    relicArr.forEach(relic => pushDescription(`${relic}\n`));
    if (defaultArr.length > 0) {
        descIndex++;
        pushDescription('**Miscellaneous**\n\n');
    }
    defaultArr.forEach(relic => pushDescription(`${relic}\n`));

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(`*${rogueTheme.name}* Relics`)
        .setDescription(`**Page ${index + 1} of ${Math.ceil(descriptionArr.length / columnCount)}**`);

    for (let i = index * columnCount; i < index * columnCount + columnCount && i < descriptionArr.length; i++) {
        embed.addFields({ name: blankChar, value: descriptionArr[i].string, inline: true });
    }

    const prevButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId(`is${theme + 2}`, 'relic', index - 1))
        .setLabel('Previous')
        .setStyle(Djs.ButtonStyle.Primary);
    const nextButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId(`is${theme + 2}`, 'relic', index + 1))
        .setLabel('Next')
        .setStyle(Djs.ButtonStyle.Primary);
    const componentRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(prevButton, nextButton);

    if (index === 0) {
        prevButton.setDisabled(true);
        prevButton.setStyle(Djs.ButtonStyle.Secondary);
    }
    if (index * columnCount + columnCount >= descriptionArr.length) {
        nextButton.setDisabled(true);
        nextButton.setStyle(Djs.ButtonStyle.Secondary);
    }

    return { embeds: [embed], components: [componentRow] };
}
export async function buildRogueStageMessage(theme: number, stage: T.RogueStage, page: number): Promise<Djs.BaseMessageOptions> {
    const stageInfo = stage.excel;
    const stageData = stage.levels;
    const isChallenge = stageInfo.difficulty !== 'NORMAL';

    const title = isChallenge ? `Emergency ${stageInfo.code} - ${stageInfo.name}` : `${stageInfo.code} - ${stageInfo.name}`;
    const description = isChallenge ? removeStyleTags(`${stageInfo.description}\n${stageInfo.eliteDesc}`) : removeStyleTags(stageInfo.description);

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(`${paths.stageViewerUrl}?level=${stage.excel.id.toLowerCase()}`)
        .setDescription(description);

    embed.addFields(await buildStageEnemyFields(stageData));

    const imageButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId(`is${theme + 2}`, 'stage', isChallenge, stageInfo.id, 0))
        .setLabel('Preview')
        .setStyle(Djs.ButtonStyle.Primary);
    const diagramButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId(`is${theme + 2}`, 'stage', isChallenge, stageInfo.id, 1))
        .setLabel('Diagram')
        .setStyle(Djs.ButtonStyle.Primary);
    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(imageButton, diagramButton);

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
            embed.setImage(imagePath);
            return { embeds: [embed], components: [buttonRow] };
        }
        else {
            embed.addFields(buildStageDiagramFields(stageData));
            return { embeds: [embed] };
        }
    }
    else {
        embed.addFields(buildStageDiagramFields(stageData));
        return { embeds: [embed], components: [buttonRow] };
    }
}
export async function buildRogueVariationMessage(variation: T.RogueVariation): Promise<Djs.BaseMessageOptions> {
    const description = `${variation.functionDesc}\n\n${variation.desc}`;

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(variation.outerName)
        .setDescription(description);

    return { embeds: [embed] };
}
export async function buildRogueVariationListMessage(theme: number): Promise<Djs.BaseMessageOptions> {
    const rogueTheme = await api.single('rogue', { query: theme.toString(), include: ['name', 'variationDict'] });

    let description = '';
    for (const variation of Object.values(rogueTheme.variationDict)) {
        description += `${variation.outerName}\n`;
    }

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(`*${rogueTheme.name}* Floor Effects`)
        .setDescription(description);

    return { embeds: [embed] };
}
export async function buildSandboxItemMessage(theme: number, item: T.SandboxItem): Promise<Djs.BaseMessageOptions> {
    const items = (await api.single('sandbox', { query: theme.toString(), include: ['itemDict'] })).itemDict;

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(item.data.itemName)
        .setDescription(`${item.data.itemUsage}\n\n${item.data.itemDesc}`);

    if (item.craft) {
        let costString = '';
        for (const [mat, count] of Object.entries(item.craft.materialItems)) {
            costString += `${items[mat].data.itemName} **x${count}**\n`;
        }
        embed.addFields({ name: 'Crafting Formula', value: costString });
    }
    if (item.drink) {
        embed.addFields({ name: 'Energy', value: item.drink.count.toString(), inline: true });
    }
    if (item.food) {
        embed.addFields({ name: 'Normal effect', value: item.food.itemUsage, inline: true });
        embed.addFields({ name: 'Enhanced effect', value: item.food.enhancedUsage, inline: true });
        item.food.recipes.forEach(recipe => {
            let recipeString = '';
            const mats = {};
            recipe.mats.forEach(mat => {
                mats[mat] ? mats[mat]++ : mats[mat] = 1;
            });
            for (const [mat, count] of Object.entries(mats)) {
                recipeString += `${items[mat].data.itemName} **x${count}**\n`;
            }
            embed.addFields({ name: 'Recipe', value: recipeString });
        });
    }

    return { embeds: [embed] };
}
export async function buildSandboxStageMessage(theme: number, stage: T.SandboxStage, page: number): Promise<Djs.BaseMessageOptions> {
    const stageInfo = stage.excel;
    const stageData = stage.levels;

    const title = `${stageInfo.code} - ${stageInfo.name}`;
    const description = removeStyleTags(stageInfo.description);

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(`${paths.stageViewerUrl}?level=${stage.excel.stageId.toLowerCase()}`)
        .setDescription(description);

    embed.addFields(await buildStageEnemyFields(stageData));

    const imageButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId(`ra${theme + 2}`, 'stage', stage.excel.stageId, 0))
        .setLabel('Preview')
        .setStyle(Djs.ButtonStyle.Primary);
    const diagramButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId(`ra${theme + 2}`, 'stage', stage.excel.stageId, 1))
        .setLabel('Diagram')
        .setStyle(Djs.ButtonStyle.Primary);
    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(imageButton, diagramButton);

    switch (page) {
        case 0:
            imageButton.setDisabled(true);
            break;
        case 1:
            diagramButton.setDisabled(true);
            break;
    }

    if (page === 0) {
        const imagePath = paths.myAssetUrl + `/sandboxstages/${stageInfo.stageId}.png`;

        if (await urlExists(imagePath)) {
            embed.setImage(imagePath)
            return { content: '', embeds: [embed], components: [buttonRow] };
        }
        else {
            embed.addFields(buildStageDiagramFields(stageData));
            return { content: '', embeds: [embed], components: [] };
        }
    }
    else {
        embed.addFields(buildStageDiagramFields(stageData));
        return { content: '', embeds: [embed], components: [buttonRow] };
    }
}
export async function buildSkillMessage(op: T.Operator, page: number, level: number): Promise<Djs.BaseMessageOptions> {
    const embed = await buildSkillEmbed(op, page, level);

    const rowOne = new Djs.ActionRowBuilder<Djs.ButtonBuilder>();
    const rowTwo = new Djs.ActionRowBuilder<Djs.ButtonBuilder>();

    for (let i = 0; i < op.skills[page].levels.length; i++) {
        if (i >= 0 && i <= 5) continue;

        const button = new Djs.ButtonBuilder()
            .setCustomId(createCustomId('skills', op.id, page, i))
            .setLabel(gameConsts.skillLevels[i])
            .setStyle(i < 7 ? Djs.ButtonStyle.Secondary : Djs.ButtonStyle.Danger);
        if (i === level) {
            button.setDisabled(true);
        }
        if (i < 5) rowOne.addComponents(button);
        else rowTwo.addComponents(button);
    }

    return { embeds: [embed], components: [rowTwo] };
}
export async function buildSpineEnemyMessage(gifFile: string, enemy: T.Enemy, animArr: string[], anim: string, rand: number): Promise<Djs.BaseMessageOptions> {
    const id = enemy.excel.enemyId;

    const authorField = buildAuthorField(enemy);

    const gifPath = join(__dirname, 'spine', gifFile);
    const gif = new Djs.AttachmentBuilder(gifPath);

    const animSelector = new Djs.StringSelectMenuBuilder()
        .setCustomId(createCustomId('spine', 'enemy', id, null, null))
        .setPlaceholder(anim);
    const componentRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>().addComponents(animSelector);

    for (let i = 0; i < Math.min(animArr.length, 25); i++) {
        if (animArr[i] === 'Default') continue; // Default animations are a single frame that lasts forever, they do not work and should not be shown

        animSelector.addOptions(new Djs.StringSelectMenuOptionBuilder()
            .setLabel(animArr[i])
            .setValue(animArr[i])
        );
    }

    const embed = new Djs.EmbedBuilder()
        .setAuthor(authorField)
        .setImage(`attachment://${cleanFilename(gifFile)}`)
        .setColor(embedColour);

    return { content: '', embeds: [embed], files: [gif], components: [componentRow] };
}
export async function buildSpineOperatorMessage(gifFile: string, op: T.Operator, skin: string, set: string, animArr: string[], anim: string, rand: number): Promise<Djs.BaseMessageOptions> {
    const id = op.id;

    const authorField = buildAuthorField(op);

    const gifPath = join(__dirname, 'spine', gifFile);
    const gif = new Djs.AttachmentBuilder(gifPath);

    const animSelector = new Djs.StringSelectMenuBuilder()
        .setCustomId(createCustomId('spine', 'operator', id, skin, set))
        .setPlaceholder(anim);
    const componentRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>().addComponents(animSelector);

    for (let i = 0; i < Math.min(animArr.length, 25); i++) {
        if (animArr[i] === 'Default') continue; // Default animations are a single frame that lasts forever, they do not work and should not be shown

        animSelector.addOptions(new Djs.StringSelectMenuOptionBuilder()
            .setLabel(animArr[i])
            .setValue(animArr[i])
        );
    }

    const embed = new Djs.EmbedBuilder()
        .setAuthor(authorField)
        .setImage(`attachment://${cleanFilename(gifFile)}`)
        .setColor(embedColour);

    return { content: '', embeds: [embed], files: [gif], components: [componentRow] };
}
export async function buildStageMessage(stage: T.Stage, page: number): Promise<Djs.BaseMessageOptions> {
    const stageInfo = stage.excel;
    const stageData = stage.levels;
    const isChallenge = stageInfo.diffGroup === 'TOUGH' || stageInfo.difficulty === 'FOUR_STAR'

    const title = isChallenge ? `Challenge ${stageInfo.code} - ${stageInfo.name}` : `${stageInfo.code} - ${stageInfo.name}`;
    const description = removeStyleTags(stageInfo.description);

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(`${paths.stageViewerUrl}?level=${stage.excel.stageId.toLowerCase()}`)
        .setDescription(description);

    let regularString = '', specialString = '';
    for (const item of stageInfo.stageDropInfo.displayDetailRewards) {
        switch (item.dropType) {
            case 'NORMAL':
                regularString += `${(await api.single('item', { query: item.id })).data.name}\n`;
                break;
            case 'SPECIAL':
                specialString += `${(await api.single('item', { query: item.id })).data.name}\n`;
                break;
        }
    }
    if (regularString !== '') {
        embed.addFields({ name: 'Regular Drops', value: regularString });
    }
    if (specialString !== '') {
        embed.addFields({ name: 'Special Drops', value: specialString });
    }

    embed.addFields(await buildStageEnemyFields(stageData));

    const stageIndex = isChallenge
        ? (await api.single('toughstage', { query: stage.excel.code.toLowerCase() })).findIndex(x => x.excel.stageId === stage.excel.stageId)
        : (await api.single('stage', { query: stage.excel.code.toLowerCase() })).findIndex(x => x.excel.stageId === stage.excel.stageId)

    const imageButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('stage', stage.excel.code, stageIndex, isChallenge, 0))
        .setLabel('Preview')
        .setStyle(Djs.ButtonStyle.Primary);
    const diagramButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('stage', stage.excel.code, stageIndex, isChallenge, 1))
        .setLabel('Diagram')
        .setStyle(Djs.ButtonStyle.Primary);
    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(imageButton, diagramButton);

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
            embed.setImage(imagePath)
            return { content: '', embeds: [embed], components: [buttonRow] };
        }
        else if (await urlExists(toughPath)) {
            embed.setImage(toughPath)
            return { content: '', embeds: [embed], components: [buttonRow] };
        }
        else if (await urlExists(newPath)) {
            embed.setImage(newPath)
            return { content: '', embeds: [embed], components: [buttonRow] };
        }
        else {
            embed.addFields(buildStageDiagramFields(stageData));
            return { content: '', embeds: [embed], components: [] };
        }
    }
    else {
        embed.addFields(buildStageDiagramFields(stageData));
        return { content: '', embeds: [embed], components: [buttonRow] };
    }
}
export async function buildStageSelectMessage(stageArr: T.Stage[] | T.RogueStage[]): Promise<Djs.BaseMessageOptions> {
    const stageSelector = new Djs.StringSelectMenuBuilder()
        .setCustomId(createCustomId('stage', 'select', stageArr[0].excel.code))
        .setPlaceholder('Select a stage!');
    const componentRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>().addComponents(stageSelector);

    for (let i = 0; i < stageArr.length; i++) {
        const stage = stageArr[i];
        const name = `${stage.excel.code} - ${stage.excel.name}`;

        stageSelector.addOptions(new Djs.StringSelectMenuOptionBuilder()
            .setLabel(name)
            .setValue(`${i}`)
        );
    }

    return { content: 'Multiple stages with that code were found, please select a stage below:', components: [componentRow] };
}

function buildInfoArtMessage(op: T.Operator, type: number, page: number, level: number): Djs.BaseMessageOptions {
    const embed = buildArtEmbed(op, page);

    const rowOne = new Djs.ActionRowBuilder<Djs.ButtonBuilder>();
    const rowTwo = new Djs.ActionRowBuilder<Djs.ButtonBuilder>();
    const components = [];

    for (let i = 0; i < op.skins.length; i++) {
        const skinGroup = op.skins[i].displaySkin.skinGroupName;
        const button = new Djs.ButtonBuilder()
            .setCustomId(createCustomId('info', op.id, type, i, level, 'skin'))
            .setLabel(skinGroup)
            .setStyle(Djs.ButtonStyle.Primary);
        if (i === page)
            button.setCustomId(`info_page_current`)
                .setDisabled(true);
        if (op.skins[i].battleSkin.skinOrPrefabId === 'DefaultSkin') {
            rowOne.addComponents(button);
            components[0] = rowOne;
        }
        else {
            rowTwo.addComponents(button);
            components[1] = rowTwo;
        }
    }

    return { embeds: [embed], components: components };
}
async function buildInfoCostMessage(op: T.Operator, type: number, page: number, level: number): Promise<Djs.BaseMessageOptions> {
    const embed = await buildCostEmbed(op, page);

    const costLabels = ['Promotions', 'Skills', 'Masteries', 'Modules'];
    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>();
    for (let i = 0; i < 4; i++) {
        const button = new Djs.ButtonBuilder()
            .setCustomId(createCustomId('info', op.id, type, i, level, 'cost'))
            .setLabel(costLabels[i])
            .setStyle(Djs.ButtonStyle.Primary);
        if (i === page)
            button.setCustomId('info_page_current')
                .setDisabled(true);
        buttonRow.addComponents(button);
    }
    if (op.data.skills.length == 0)
        buttonRow.components[1].setStyle(Djs.ButtonStyle.Secondary)
            .setDisabled(true);
    if (gameConsts.rarity[op.data.rarity] <= 2)
        buttonRow.components[2].setStyle(Djs.ButtonStyle.Secondary)
            .setDisabled(true);
    if (op.modules.length == 0)
        buttonRow.components[3].setStyle(Djs.ButtonStyle.Secondary)
            .setDisabled(true);

    return { embeds: [embed], components: [buttonRow] };
}
function buildInfoModuleMessage(op: T.Operator, type: number, page: number, level: number): Djs.BaseMessageOptions {
    const embed = buildModuleEmbed(op, page, level);

    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>();

    for (let i = 0; i < 3; i++) {
        const button = new Djs.ButtonBuilder()
            .setCustomId(createCustomId('info', op.id, type, page, i, 'module'))
            .setLabel(gameConsts.skillLevels[i])
            .setStyle(Djs.ButtonStyle.Secondary);
        if (i === level)
            button.setCustomId('info_level_current')
                .setDisabled(true);
        buttonRow.addComponents(button);
    }

    return { embeds: [embed], components: [buttonRow] };
}
async function buildInfoSkillMessage(op: T.Operator, type: number, page: number, level: number): Promise<Djs.BaseMessageOptions> {
    const embed = await buildSkillEmbed(op, page, level);

    const rowOne = new Djs.ActionRowBuilder<Djs.ButtonBuilder>();

    for (let i = 0; i < op.skills[page].levels.length; i++) {
        if (i >= 0 && i <= 5) continue;

        const button = new Djs.ButtonBuilder()
            .setCustomId(createCustomId('info', op.id, type, page, i, 'skill'))
            .setLabel(gameConsts.skillLevels[i])
            .setStyle(i < 7 ? Djs.ButtonStyle.Secondary : Djs.ButtonStyle.Danger);
        if (i === level)
            button.setCustomId('info_level_current')
                .setDisabled(true);
        rowOne.addComponents(button)
    }

    return { embeds: [embed], components: [rowOne] };
}

function buildAuthorField(char: T.Enemy | T.Operator): Djs.EmbedAuthorOptions {
    if ((char as T.Operator).id && (char as T.Operator).data) {
        const op = (char as T.Operator);
        const urlName = op.data.name.toLowerCase().split(' the ').join('-').split(/'|,/).join('').split(' ').join('-').split('ë').join('e').split('ł').join('l');// Unholy dumbness
        const authorField = { name: op.data.name, iconURL: paths.aceshipImageUrl + `/avatars/${op.id}.png`, url: `https://gamepress.gg/arknights/operator/${urlName}` };
        return authorField;
    }
    else if ((char as T.Enemy).excel) {
        const enem = (char as T.Enemy);
        const authorField = { name: enem.excel.name, iconURL: paths.aceshipImageUrl + `/enemy/${enem.excel.enemyId}.png` };
        return authorField;
    }
    return null;
}
function buildCostString(costs: T.LevelUpCost[], itemArr: T.Item[]): string {
    let description = '';
    for (const cost of costs) {
        const item = itemArr.find(e => e.data.itemId === cost.id);
        description += `${item.data.name} **x${cost.count}**\n`;
    }
    return description;
}
function buildRangeField(range: T.GridRange): Djs.EmbedField {
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
function buildStageDiagramFields(stageData: T.StageData): Djs.EmbedField[] {
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
async function buildStageEnemyFields(stageData: T.StageData): Promise<Djs.EmbedField[]> {
    const waveDict: { [key: string]: number } = {}; // enemyId => enemy quantity
    for (const wave of stageData.waves) { // Count number of enemies in stage, store results in waveDict
        for (const fragment of wave.fragments) {
            for (const action of fragment.actions) {
                if (typeof action.actionType === 'string' && action.actionType === 'SPAWN' || typeof action.actionType === 'number' && action.actionType === 0)
                    waveDict[action.key] = (waveDict[action.key] ?? 0) + action.count;
                // legacy number types:
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
            }
        }
    }

    const enemyArr = await api.all('enemy', { include: ['excel.enemyId', 'excel.enemyIndex', 'excel.name', 'excel.enemyLevel', 'levels.Value.level'] })
    let enemyString = '', eliteString = '', bossString = '';
    for (const enemyRef of stageData.enemyDbRefs) {
        const enemy = enemyArr.find(e => e.excel.enemyId === enemyRef.id);

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

    const fieldArr: Djs.EmbedField[] = [];
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

function buildArtEmbed(op: T.Operator, page: number): Djs.EmbedBuilder {
    const displaySkin = op.skins[page].displaySkin;

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(buildAuthorField(op))
        .setTitle(`${displaySkin.skinGroupName}${displaySkin.skinName ? ` - ${displaySkin.skinName}` : ''}`)
        .setImage(paths.aceshipImageUrl + `/characters/${encodeURIComponent(op.skins[page].portraitId)}.png`);

    switch (displaySkin.skinGroupId) {
        case 'ILLUST_0': {
            embed.setThumbnail(paths.aceshipImageUrl + `/ui/elite/0.png`);
            break;
        }
        case 'ILLUST_1': {
            embed.setThumbnail(paths.aceshipImageUrl + `/ui/elite/1.png`);
            break;
        }
        case 'ILLUST_2': {
            embed.setThumbnail(paths.aceshipImageUrl + `/ui/elite/2.png`);
            break;
        }
        case 'ILLUST_3': {
            embed.setThumbnail(paths.aceshipImageUrl + `/ui/elite/3.png`);
            break;
        }
        default: {
            embed.setThumbnail(paths.myAssetUrl + `/skingroups/${encodeURIComponent(displaySkin.skinGroupId.split('#')[1])}.png`);
            break;
        }
    }

    if (displaySkin.drawerList && displaySkin.drawerList.length > 0) {
        const artistString = displaySkin.drawerList.join('\n');
        embed.addFields({ name: displaySkin.drawerList.length > 1 ? 'Artists' : 'Artist', value: artistString });
    }

    return embed;
}
async function buildCostEmbed(op: T.Operator, page: number): Promise<Djs.EmbedBuilder> {
    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(buildAuthorField(op));

    const itemArr = await api.all('item', { include: ['data'] });
    switch (page) {
        default:
        case 0: {
            embed.setTitle('Promotion Costs')
                .setThumbnail(paths.aceshipImageUrl + `/items/sprite_exp_card_t4.png`);
            for (let i = 0; i < op.data.phases.length; i++) {
                if (op.data.phases[i].evolveCost === null) continue;

                const description = buildCostString(op.data.phases[i].evolveCost, itemArr) + `LMD **x${gameConsts.evolveGoldCost[gameConsts.rarity[op.data.rarity]][i - 1]}**\n`;
                embed.addFields({ name: `Elite ${i}`, value: description, inline: true });
            }
            break;
        }
        case 1: {
            embed.setTitle('Skill Upgrade Costs')
                .setThumbnail(paths.aceshipImageUrl + `/items/MTL_SKILL2.png`);
            for (let i = 0; i < op.data.allSkillLvlup.length; i++) {
                if (op.data.allSkillLvlup[i].lvlUpCost === null) continue;

                const description = buildCostString(op.data.allSkillLvlup[i].lvlUpCost, itemArr);
                embed.addFields({ name: `Level ${i + 2}`, value: description, inline: true });
            }
            break;
        }
        case 2: {
            embed.setTitle('Skill Mastery Costs')
                .setThumbnail(paths.aceshipImageUrl + `/items/MTL_SKILL3.png`);
            for (let i = 0; i < op.data.skills.length; i++) {
                embed.addFields({ name: blankChar, value: `**Skill ${i + 1} - ${op.skills[i].levels[0].name}**` });
                for (let j = 0; j < op.data.skills[i].levelUpCostCond.length; j++) {
                    if (op.data.skills[i].levelUpCostCond[j].levelUpCost === null) continue;

                    const description = buildCostString(op.data.skills[i].levelUpCostCond[j].levelUpCost, itemArr);
                    embed.addFields({ name: `Mastery ${j + 1}`, value: description, inline: true });
                }
            }
            break;
        }
        case 3: {
            embed.setTitle('Module Upgrade Costs')
                .setThumbnail(paths.aceshipImageUrl + `/items/mod_unlock_token.png`);
            for (const module of op.modules) {
                if (module.info.uniEquipId.includes('uniequip_001')) continue;

                embed.addFields({ name: blankChar, value: `**${module.info.typeIcon.toUpperCase()} - ${module.info.uniEquipName}**` });
                for (const key of Object.keys(module.info.itemCost)) {
                    const description = buildCostString(module.info.itemCost[key], itemArr);
                    embed.addFields({ name: `Level ${key}`, value: description, inline: true });
                }
            }
            break;
        }
    }

    return embed;
}
function buildModuleEmbed(op: T.Operator, page: number, level: number): Djs.EmbedBuilder {
    const module = op.modules[page];

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(buildAuthorField(op))
        .setTitle(`${module.info.typeIcon.toUpperCase()} ${module.info.uniEquipName} - Lv${level + 1}`)
        .setThumbnail(paths.aceshipImageUrl + `/equip/icon/${module.info.uniEquipId}.png`);

    let description = '', talentName = null, talentDescription = null;
    for (const part of module.data.phases[level].parts) {
        if (part.overrideTraitDataBundle.candidates) {
            const candidate = part.overrideTraitDataBundle.candidates[part.overrideTraitDataBundle.candidates.length - 1];
            if (candidate.additionalDescription) {
                description += `${insertBlackboard(candidate.additionalDescription, candidate.blackboard)}\n`;
            }
            if (candidate.overrideDescripton) {
                description += `${insertBlackboard(candidate.overrideDescripton, candidate.blackboard)}\n`;
            }
        }
        if (part.addOrOverrideTalentDataBundle.candidates) {
            const candidate = part.addOrOverrideTalentDataBundle.candidates[part.addOrOverrideTalentDataBundle.candidates.length - 1];
            talentName = candidate.name ?? talentName;
            talentDescription = insertBlackboard(candidate.upgradeDescription, candidate.blackboard) ?? talentDescription;
        }
    }
    embed.setDescription(description);
    if (talentName && talentDescription) {
        embed.addFields({ name: talentName, value: talentDescription });
    }

    const statDescription = module.data.phases[level].attributeBlackboard.map(attribute => `${attribute.key.toUpperCase()} ${attribute.value > 0 ? '+' : ''}${attribute.value}`).join('\n');
    embed.addFields({ name: `Stats`, value: statDescription });

    return embed;
}
function buildOperatorEmbed(op: T.Operator): Djs.EmbedBuilder {
    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(`${op.data.name} - ${'★'.repeat(gameConsts.rarity[op.data.rarity] + 1)}`)
        .setURL(buildAuthorField(op).url)
        .setThumbnail(paths.aceshipImageUrl + `/avatars/${op.id}.png`);

    let description = removeStyleTags(op.data.description);
    if (op.data.trait !== null) {
        const candidate = op.data.trait.candidates[op.data.trait.candidates.length - 1];
        if (candidate.overrideDescripton !== null) {
            description = insertBlackboard(candidate.overrideDescripton, candidate.blackboard);
        }
    }
    embed.addFields({ name: `${gameConsts.professions[op.data.profession]} - ${op.archetype}`, value: description });
    embed.addFields(buildRangeField(op.range));
    if (op.data.talents) {
        for (const talent of op.data.talents) {
            const candidate = talent.candidates[talent.candidates.length - 1];
            embed.addFields({ name: `*${candidate.name}*`, value: removeStyleTags(candidate.description) });
        }
    }
    if (op.data.potentialRanks && op.data.potentialRanks.length > 0) {
        const potentialString = op.data.potentialRanks.map(potential => potential.description).join('\n');
        embed.addFields({ name: 'Potentials', value: potentialString, inline: true });
    }
    const trustString = Object.entries(op.data.favorKeyFrames[1].data)
        .filter(([key, bonus]) => bonus)
        .map(([key, bonus]) => `${key.toUpperCase()} +${bonus}`)
        .join('\n');
    if (trustString !== '') {
        embed.addFields({ name: 'Trust Bonus', value: trustString, inline: true });
    }

    const maxStats = op.data.phases[op.data.phases.length - 1].attributesKeyFrames[1].data;
    const hp = maxStats.maxHp.toString();
    const atk = maxStats.atk.toString();
    const def = maxStats.def.toString();
    const res = maxStats.magicResistance.toString();
    const dpCost = maxStats.cost.toString();
    const block = maxStats.blockCnt.toString();
    const redeploy = maxStats.respawnTime.toString();
    const atkInterval = maxStats.baseAttackTime.toString();
    embed.addFields(
        { name: blankChar, value: '**Max Stats**' },
        { name: '❤️ HP', value: hp, inline: true },
        { name: '⚔️ ATK', value: atk, inline: true },
        { name: '🛡️ DEF', value: def, inline: true },
        { name: '✨ RES', value: res, inline: true },
        { name: '🏁 DP', value: dpCost, inline: true },
        { name: '✋ Block', value: block, inline: true },
        { name: '⌛ Redeploy Time', value: redeploy, inline: true },
        { name: '⏱️ Attack Interval', value: atkInterval, inline: true },
    );

    return embed;
}
async function buildSkillEmbed(op: T.Operator, page: number, level: number): Promise<Djs.EmbedBuilder> {
    const skill = op.skills[page];
    const skillLevel = skill.levels[level];

    const description = `**${gameConsts.spTypes[skillLevel.spData.spType]} - ${gameConsts.skillTypes[skillLevel.skillType]}**` +
        `\n***Initial:* ${skillLevel.spData.initSp} SP - *Cost:* ${skillLevel.spData.spCost} SP${(skillLevel.duration && skillLevel.duration > 0) ? ` - *Duration:* ${skillLevel.duration} sec` : ''}**` +
        `\n${insertBlackboard(skillLevel.description, skillLevel.blackboard.concat({ key: 'duration', value: skillLevel.duration }))}`;

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(buildAuthorField(op))
        .setTitle(`${skillLevel.name} - ${gameConsts.skillLevels[level]}`)
        .setThumbnail(paths.aceshipImageUrl + `/skills/skill_icon_${skill.iconId ?? skill.skillId}.png`)
        .setDescription(description);

    if (skillLevel.rangeId) {
        const range = await api.single('range', { query: skillLevel.rangeId });
        embed.addFields(buildRangeField(range));
    }

    return embed;
}