import { ActionRowBuilder, AttachmentBuilder, BaseMessageOptions, ButtonBuilder, ButtonStyle, EmbedAuthorOptions, EmbedBuilder, EmbedField, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import type { Blackboard, CCStage, Definition, Enemy, GameEvent, GridRange, Item, LevelUpCost, Operator, Paradox, RogueRelic, RogueStage, RogueVariation, SandboxStage, Stage, StageData } from "hella-types";
import { join } from 'path';
import { globalCommands } from '../structures/HellaBot';
import { getAllDefinitions, getAllEnemies, getAllEvents, getAllItems, getAllOperators, getItem, getOperator, getRange, getRogueTheme, getStageArr, getToughStageArr } from './api';
const { embedColour, paths, gameConsts } = require('../constants');

const cleanFilename = (text: string) => text.split(/%|[#\+]|&|\[|\]/).join(''); // Remove special characters that discord doesn't like (%, #, etc.)
const urlExists = async (url: string) => (await fetch(url)).status === 200;
const createCustomId = (...args: (string | number | boolean)[]): string => args.join('ඞ').toLowerCase();
function removeStyleTags(text: string) {
    if (!text) return '';
    const regex = /<.[a-z]{2,5}?\.[^<]+>|<\/[^<]*>|<color=[^>]+>/;
    text = text.split(regex).join('');
    return text;
}
function insertBlackboard(text: string, blackboard: Blackboard[]) {
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

    if (textArr.join('') === '') return null;

    for (let i = 0; i < textArr.length; i++) {
        if (chunkIsVariable(textArr[i], blackboard)) {
            textArr[i] = formatVariable(textArr[i], blackboard);
        }
    }

    return textArr.join('').split('-`').join('`-').split('+`').join('`+');
}
const blankChar = '\u200B';

export async function buildArtMessage(op: Operator, page: number): Promise<BaseMessageOptions> {
    const embed = buildArtEmbed(op, page);

    const rowOne = new ActionRowBuilder();
    const rowTwo = new ActionRowBuilder();
    const components = [];

    for (let i = 0; i < op.skins.length; i++) {
        const skinGroup = op.skins[i].displaySkin.skinGroupName;
        const button = new ButtonBuilder()
            .setCustomId(createCustomId('art', op.id, i))
            .setLabel(skinGroup)
            .setStyle(ButtonStyle.Primary);
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
export async function buildBaseMessage(op: Operator, page: number): Promise<BaseMessageOptions> {
    const baseInfo = op.bases[page].condition;
    const base = op.bases[page].skill;

    const authorField = buildAuthorField(op);
    const title = `${base.buffName} - ${gameConsts.eliteLevels[baseInfo.cond.phase]} Lv${baseInfo.cond.level}`;
    const description = removeStyleTags(base.description);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(title)
        .setThumbnail(paths.aceshipImageUrl + `/ui/infrastructure/skill/${base.skillIcon}.png`)
        .setDescription(description);

    return { embeds: [embed] };
}
export async function buildCcMessage(stage: CCStage, page: number): Promise<BaseMessageOptions> {
    const stageInfo = stage.const;
    const stageData = stage.levels;

    const title = `${stageInfo.location} - ${stageInfo.name}`;
    const description = removeStyleTags(stageInfo.description);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(`${paths.stageViewerUrl}?level=${stage.const.levelId.toLowerCase()}`)
        .setDescription(description);

    embed.addFields(await buildStageEnemyFields(stageData));

    const imageButton = new ButtonBuilder()
        .setCustomId(createCustomId('cc', stage.const.name.toLowerCase(), 0))
        .setLabel('Preview')
        .setStyle(ButtonStyle.Primary);
    const diagramButton = new ButtonBuilder()
        .setCustomId(createCustomId('cc', stage.const.name.toLowerCase(), 1))
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
        const imagePath = paths.myAssetUrl + `/stages/${stageInfo.levelId.split('/')[2]}.png`;
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
export async function buildCcSelectMessage(season: string): Promise<BaseMessageOptions> {
    const ccSelector = new StringSelectMenuBuilder()
        .setCustomId(createCustomId('cc', 'select'))
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
    const embed = await buildCostEmbed(op, page);

    const eliteButton = new ButtonBuilder()
        .setCustomId(createCustomId('costs', op.id, 0))
        .setLabel('Promotions')
        .setStyle(ButtonStyle.Primary);
    const skillButton = new ButtonBuilder()
        .setCustomId(createCustomId('costs', op.id, 1))
        .setLabel('Skills')
        .setStyle(ButtonStyle.Primary);
    const masteryButton = new ButtonBuilder()
        .setCustomId(createCustomId('costs', op.id, 2))
        .setLabel('Masteries')
        .setStyle(ButtonStyle.Primary);
    const moduleButton = new ButtonBuilder()
        .setCustomId(createCustomId('costs', op.id, 3))
        .setLabel('Modules')
        .setStyle(ButtonStyle.Primary);
    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(eliteButton, skillButton, masteryButton, moduleButton);

    if (op.data.skills.length == 0) {
        skillButton.setStyle(ButtonStyle.Secondary);
        skillButton.setDisabled(true);
    }
    if (gameConsts.rarity[op.data.rarity] <= 2) {
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

    return { embeds: [embed], components: [buttonRow] };
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

    const embed = new EmbedBuilder()
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

    const buttonRow = new ActionRowBuilder<ButtonBuilder>();
    for (let i = 0; i < enemyLevels; i++) {
        buttonRow.addComponents(new ButtonBuilder()
            .setCustomId(createCustomId('enemy', enemy.excel.enemyId, i))
            .setLabel(`Level ${i + 1}`)
            .setStyle(ButtonStyle.Primary)
        )
        if (i === level) {
            buttonRow.components[i].setDisabled(true);
        }
    }

    return { embeds: [embed], components: [buttonRow] };
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
        .setCustomId(createCustomId('events', index - 1))
        .setLabel('Newer')
        .setStyle(ButtonStyle.Primary);
    const nextButton = new ButtonBuilder()
        .setCustomId(createCustomId('events', index + 1))
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
export async function buildHelpMessage(name: string): Promise<BaseMessageOptions> {
    const command = globalCommands[name];

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(command.name)
        .setDescription(command.description.join('\n\n'))
        .addFields({ name: 'Usage', value: command.usage.join('\n') });

    return { embeds: [embed] };
}
export async function buildHelpListMessage(): Promise<BaseMessageOptions> {
    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Help Menu');
    embed.addFields({ name: 'Command List', value: Object.values(globalCommands).map(command => `\`${command.data.name}\``).join(', ') });
    embed.addFields({ name: blankChar, value: 'For more information on a specific command, use `/help [command]`' });

    return { embeds: [embed] };
}
export async function buildInfoMessage(op: Operator, type: number, page: number, level: number): Promise<BaseMessageOptions> {
    const embedArr = [], fileArr = [], rowArr = [];
    const getMessageComponents = (message: BaseMessageOptions) => {
        if (message.embeds) embedArr.push(...message.embeds);
        if (message.files) fileArr.push(...message.files);
        if (message.components) rowArr.push(...message.components);
    };

    const embed = buildOperatorEmbed(op);
    embedArr.push(embed);

    const typeLabels = ['Skills', 'Modules', 'Art', 'Base Skills', 'Costs'];
    const typeRow = new ActionRowBuilder<ButtonBuilder>();

    for (let i = 0; i < 5; i++) {
        const button = new ButtonBuilder()
            .setCustomId(createCustomId('info', op.id, i + 1, 0, 0))
            .setLabel(typeLabels[i])
            .setStyle(ButtonStyle.Success);
        if (i + 1 === type)
            button.setCustomId('info_type_current')
                .setDisabled(true);
        typeRow.addComponents(button);
    }
    if (!op.skills || op.skills.length === 0)
        typeRow.components[0].setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
    if (!op.modules || op.modules.length === 0)
        typeRow.components[1].setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
    if (!op.skins || op.skins.length === 0)
        typeRow.components[2].setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
    if (!op.bases || op.bases.length === 0)
        typeRow.components[3].setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
    if (gameConsts.rarity[op.data.rarity] <= 1)
        typeRow.components[4].setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

    switch (type) {
        case 1: {
            getMessageComponents(await buildInfoSkillMessage(op, type, page, level));

            if (op.skills.length <= 1) break;

            const pageRow = new ActionRowBuilder<ButtonBuilder>();
            for (let i = 0; i < op.skills.length; i++) {
                const button = new ButtonBuilder()
                    .setCustomId(createCustomId('info', op.id, type, i, level))
                    .setLabel(`Skill ${i + 1}`)
                    .setStyle(ButtonStyle.Primary);
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

            const pageRow = new ActionRowBuilder<ButtonBuilder>();
            for (let i = 0; i < op.modules.length; i++) {
                const button = new ButtonBuilder()
                    .setCustomId(createCustomId('info', op.id, type, i, level))
                    .setLabel(`Module ${i + 1}`)
                    .setStyle(ButtonStyle.Primary);
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

        const stage = (await getStageArr({ query: stageId, include: ['excel.code'] }))[0];
        stageString += `${stage.excel.code} - ${gameConsts.itemDropRarities[stageDrop.occPer]}\n`;
    }
    if (stageString !== '') {
        embed.addFields({ name: 'Drop Stages', value: stageString, inline: true });
    }
    if (item.formula !== null && item.formula.costs.length > 0) {
        const formulaString = buildCostString(item.formula.costs, await getAllItems({ include: ['data'] }));
        embed.addFields({ name: 'Crafting Formula', value: formulaString, inline: true });
    }
    const imagePath = paths.aceshipImageUrl + `/items/${item.data.iconId}.png`;
    if (await urlExists(imagePath))
        embed.setThumbnail(imagePath);

    return { embeds: [embed] };
}
export async function buildModuleMessage(op: Operator, page: number, level: number): Promise<BaseMessageOptions> {
    const embed = buildModuleEmbed(op, page, level);

    const lOne = new ButtonBuilder()
        .setCustomId(createCustomId('modules', op.id, page, 0))
        .setLabel('Lv1')
        .setStyle(ButtonStyle.Secondary);
    const lTwo = new ButtonBuilder()
        .setCustomId(createCustomId('modules', op.id, page, 1))
        .setLabel('Lv2')
        .setStyle(ButtonStyle.Secondary);
    const lThree = new ButtonBuilder()
        .setCustomId(createCustomId('modules', op.id, page, 2))
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

    return { embeds: [embed], components: [rowOne] };
}
export async function buildParadoxMessage(paradox: Paradox, page: number): Promise<BaseMessageOptions> {
    const stageInfo = paradox.excel;
    const stageData = paradox.levels;
    const op = await getOperator({ query: stageInfo.charId });

    const authorField = buildAuthorField(op);
    const title = `Paradox Simulation - ${stageInfo.name}`;
    const description = removeStyleTags(stageInfo.description);

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(authorField)
        .setTitle(title)
        .setDescription(description);

    embed.addFields(await buildStageEnemyFields(stageData));

    const imageButton = new ButtonBuilder()
        .setCustomId(createCustomId('paradox', stageInfo.charId, 0))
        .setLabel('Preview')
        .setStyle(ButtonStyle.Primary);
    const diagramButton = new ButtonBuilder()
        .setCustomId(createCustomId('paradox', stageInfo.charId, 1))
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
export async function buildRecruitMessage(value: number, tag: string, select: boolean, snowflakes: string[]): Promise<BaseMessageOptions[]> {
    if (select) {
        value *= gameConsts.tagValues[tag];
    }
    else {
        value /= gameConsts.tagValues[tag];
    }

    const button = (id: string, label: string) => {
        return new ButtonBuilder()
            .setCustomId(createCustomId('recruit', value, id, 'select', ...snowflakes))
            .setLabel(label)
            .setStyle(ButtonStyle.Secondary);
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
        .setStyle(ButtonStyle.Danger);

    const qualComponents = [
        new ActionRowBuilder<ButtonBuilder>().addComponents(starterButton, seniorButton, topButton),
        new ActionRowBuilder<ButtonBuilder>().addComponents(meleeButton, rangedButton),
        new ActionRowBuilder<ButtonBuilder>().addComponents(guardButton, medicButton, vanguardButton, casterButton, sniperButton),
        new ActionRowBuilder<ButtonBuilder>().addComponents(defenderButton, supporterButton, specialistButton)
    ];
    const tagComponents = [
        new ActionRowBuilder<ButtonBuilder>().addComponents(healingButton, supportButton, dpsButton, aoeButton, slowButton),
        new ActionRowBuilder<ButtonBuilder>().addComponents(survivalButton, defenseButton, debuffButton, shiftButton, crowdControlButton),
        new ActionRowBuilder<ButtonBuilder>().addComponents(nukerButton, summonButton, fastRedeployButton, dpRecoveryButton, robotButton)
    ];
    const utilComponents = [
        new ActionRowBuilder<ButtonBuilder>().addComponents(deleteButton)
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

    const qualEmbed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Qualification/Position/Class')
    const tagEmbed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Tags')
    const recruitEmbed = new EmbedBuilder()
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
    const opMap: { [key: number]: Operator[] } = getPrimeCombinations(primeArray).reduce((acc, combination) => { acc[combination] = []; return acc; }, {});
    const opList = await getAllOperators({ include: ['id', 'recruit', 'data.rarity', 'data.name'] });
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
export async function buildRogueRelicMessage(relic: RogueRelic): Promise<BaseMessageOptions> {
    const description = `***Cost:* ${relic.value}▲**\n${relic.description !== null ? `${relic.usage}\n\n${relic.description}` : relic.usage}`;

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(relic.name)
        .setDescription(description);

    const imagePath = paths.myAssetUrl + `/rogueitems/${relic.iconId}.png`;
    if (await urlExists(imagePath))
        embed.setThumbnail(imagePath);

    return { embeds: [embed] };
}
export async function buildRogueRelicListMessage(theme: number, index: number): Promise<BaseMessageOptions> {
    const rogueTheme = await getRogueTheme({ query: theme.toString(), include: ['name', 'relicDict'] });
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

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setTitle(`*${rogueTheme.name}* Relics`)
        .setDescription(`**Page ${index + 1} of ${Math.ceil(descriptionArr.length / columnCount)}**`);

    for (let i = index * columnCount; i < index * columnCount + columnCount && i < descriptionArr.length; i++) {
        embed.addFields({ name: blankChar, value: descriptionArr[i].string, inline: true });
    }

    const prevButton = new ButtonBuilder()
        .setCustomId(createCustomId(`is${theme + 2}`, 'relic', index - 1))
        .setLabel('Previous')
        .setStyle(ButtonStyle.Primary);
    const nextButton = new ButtonBuilder()
        .setCustomId(createCustomId(`is${theme + 2}`, 'relic', index + 1))
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
        .setURL(`${paths.stageViewerUrl}?level=${stage.excel.id.toLowerCase()}`)
        .setDescription(description);

    embed.addFields(await buildStageEnemyFields(stageData));

    const imageButton = new ButtonBuilder()
        .setCustomId(createCustomId(`is${theme + 2}`, 'stage', isChallenge, stageInfo.name, 0))
        .setLabel('Preview')
        .setStyle(ButtonStyle.Primary);
    const diagramButton = new ButtonBuilder()
        .setCustomId(createCustomId(`is${theme + 2}`, 'stage', isChallenge, stageInfo.name, 1))
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
export async function buildRogueVariationMessage(variation: RogueVariation): Promise<BaseMessageOptions> {
    const description = `${variation.functionDesc}\n\n${variation.desc}`;

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
        .setURL(`${paths.stageViewerUrl}?level=${stage.excel.stageId.toLowerCase()}`)
        .setDescription(description);

    embed.addFields(await buildStageEnemyFields(stageData));
    embed.addFields(buildStageDiagramFields(stageData));

    return { embeds: [embed] };
}
export async function buildSkillMessage(op: Operator, page: number, level: number): Promise<BaseMessageOptions> {
    const embed = await buildSkillEmbed(op, page, level);

    const rowOne = new ActionRowBuilder<ButtonBuilder>();
    const rowTwo = new ActionRowBuilder<ButtonBuilder>();

    for (let i = 0; i < op.skills[page].levels.length; i++) {
        const button = new ButtonBuilder()
            .setCustomId(createCustomId('skills', op.id, page, i))
            .setLabel(gameConsts.skillLevels[i])
            .setStyle(i < 7 ? ButtonStyle.Secondary : ButtonStyle.Danger);
        if (i === level) {
            button.setDisabled(true);
        }
        if (i < 5) rowOne.addComponents(button);
        else rowTwo.addComponents(button);
    }

    return { embeds: [embed], components: [rowOne, rowTwo] };
}
export async function buildSpineEnemyMessage(gifFile: string, enemy: Enemy, animArr: string[], anim: string, rand: number): Promise<BaseMessageOptions> {
    const id = enemy.excel.enemyId;

    const authorField = buildAuthorField(enemy);

    const gifPath = join(__dirname, 'spine', gifFile);
    const gif = new AttachmentBuilder(gifPath);

    const animSelector = new StringSelectMenuBuilder()
        .setCustomId(createCustomId('spine', 'enemy', id, null, null))
        .setPlaceholder(anim);
    const componentRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(animSelector);

    for (let i = 0; i < Math.min(animArr.length, 25); i++) {
        if (animArr[i] === 'Default') continue; // Default animations are a single frame that lasts forever, they do not work and should not be shown

        animSelector.addOptions(new StringSelectMenuOptionBuilder()
            .setLabel(animArr[i])
            .setValue(animArr[i])
        );
    }

    const embed = new EmbedBuilder()
        .setAuthor(authorField)
        .setImage(`attachment://${cleanFilename(gifFile)}`)
        .setColor(embedColour);

    return { content: '', embeds: [embed], files: [gif], components: [componentRow] };
}
export async function buildSpineOperatorMessage(gifFile: string, op: Operator, skin: string, set: string, direction: string, animArr: string[], anim: string, rand: number): Promise<BaseMessageOptions> {
    const id = op.id;

    const authorField = buildAuthorField(op);

    const gifPath = join(__dirname, 'spine', gifFile);
    const gif = new AttachmentBuilder(gifPath);

    const animSelector = new StringSelectMenuBuilder()
        .setCustomId(createCustomId('spine', 'operator', id, skin, set, direction))
        .setPlaceholder(anim);
    const componentRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(animSelector);

    for (let i = 0; i < Math.min(animArr.length, 25); i++) {
        if (animArr[i] === 'Default') continue; // Default animations are a single frame that lasts forever, they do not work and should not be shown

        animSelector.addOptions(new StringSelectMenuOptionBuilder()
            .setLabel(animArr[i])
            .setValue(animArr[i])
        );
    }

    const embed = new EmbedBuilder()
        .setAuthor(authorField)
        .setImage(`attachment://${cleanFilename(gifFile)}`)
        .setColor(embedColour);

    return { content: '', embeds: [embed], files: [gif], components: [componentRow] };
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
        .setURL(`${paths.stageViewerUrl}?level=${stage.excel.stageId.toLowerCase()}`)
        .setDescription(description);

    let regularString = '', specialString = '';
    for (const item of stageInfo.stageDropInfo.displayDetailRewards) {
        switch (item.dropType) {
            case 'NORMAL':
                regularString += `${(await getItem({ query: item.id })).data.name}\n`;
                break;
            case 'SPECIAL':
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

    embed.addFields(await buildStageEnemyFields(stageData));

    let stageIndex;
    if (isChallenge)
        stageIndex = (await getToughStageArr({ query: stage.excel.code.toLowerCase() })).findIndex(x => x.excel.stageId === stage.excel.stageId);
    else
        stageIndex = (await getStageArr({ query: stage.excel.code.toLowerCase() })).findIndex(x => x.excel.stageId === stage.excel.stageId)

    const imageButton = new ButtonBuilder()
        .setCustomId(createCustomId('stage', stage.excel.code, stageIndex, isChallenge, 0))
        .setLabel('Preview')
        .setStyle(ButtonStyle.Primary);
    const diagramButton = new ButtonBuilder()
        .setCustomId(createCustomId('stage', stage.excel.code, stageIndex, isChallenge, 1))
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
export async function buildStageSelectMessage(stageArr: Stage[] | RogueStage[]): Promise<BaseMessageOptions> {
    const stageSelector = new StringSelectMenuBuilder()
        .setCustomId(createCustomId('stage', 'select', stageArr[0].excel.code))
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

function buildInfoArtMessage(op: Operator, type: number, page: number, level: number): BaseMessageOptions {
    const embed = buildArtEmbed(op, page);

    const rowOne = new ActionRowBuilder<ButtonBuilder>();
    const rowTwo = new ActionRowBuilder<ButtonBuilder>();
    const components = [];

    for (let i = 0; i < op.skins.length; i++) {
        const skinGroup = op.skins[i].displaySkin.skinGroupName;
        const button = new ButtonBuilder()
            .setCustomId(createCustomId('info', op.id, type, i, level, 'skin'))
            .setLabel(skinGroup)
            .setStyle(ButtonStyle.Primary);
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
async function buildInfoCostMessage(op: Operator, type: number, page: number, level: number): Promise<BaseMessageOptions> {
    const embed = await buildCostEmbed(op, page);

    const costLabels = ['Promotions', 'Skills', 'Masteries', 'Modules'];
    const buttonRow = new ActionRowBuilder<ButtonBuilder>();
    for (let i = 0; i < 4; i++) {
        const button = new ButtonBuilder()
            .setCustomId(createCustomId('info', op.id, type, i, level, 'cost'))
            .setLabel(costLabels[i])
            .setStyle(ButtonStyle.Primary);
        if (i === page)
            button.setCustomId('info_page_current')
                .setDisabled(true);
        buttonRow.addComponents(button);
    }
    if (op.data.skills.length == 0)
        buttonRow.components[1].setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
    if (gameConsts.rarity[op.data.rarity] <= 2)
        buttonRow.components[2].setStyle(ButtonStyle.Secondary)
            .setDisabled(true);
    if (op.modules.length == 0)
        buttonRow.components[3].setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

    return { embeds: [embed], components: [buttonRow] };
}
function buildInfoModuleMessage(op: Operator, type: number, page: number, level: number): BaseMessageOptions {
    const embed = buildModuleEmbed(op, page, level);

    const buttonRow = new ActionRowBuilder<ButtonBuilder>();

    for (let i = 0; i < 3; i++) {
        const button = new ButtonBuilder()
            .setCustomId(createCustomId('info', op.id, type, page, i, 'module'))
            .setLabel(gameConsts.skillLevels[i])
            .setStyle(ButtonStyle.Secondary);
        if (i === level)
            button.setCustomId('info_level_current')
                .setDisabled(true);
        buttonRow.addComponents(button);
    }

    return { embeds: [embed], components: [buttonRow] };
}
async function buildInfoSkillMessage(op: Operator, type: number, page: number, level: number): Promise<BaseMessageOptions> {
    const embed = await buildSkillEmbed(op, page, level);

    const rowOne = new ActionRowBuilder<ButtonBuilder>();

    for (let i = 0; i < op.skills[page].levels.length; i++) {
        if (i >= 1 && i <= 5) continue;

        const button = new ButtonBuilder()
            .setCustomId(createCustomId('info', op.id, type, page, i, 'skill'))
            .setLabel(gameConsts.skillLevels[i])
            .setStyle(i < 7 ? ButtonStyle.Secondary : ButtonStyle.Danger);
        if (i === level)
            button.setCustomId('info_level_current')
                .setDisabled(true);
        rowOne.addComponents(button)
    }

    return { embeds: [embed], components: [rowOne] };
}

function buildAuthorField(char: Enemy | Operator): EmbedAuthorOptions {
    if ((char as Operator).id && (char as Operator).data) {
        const op = (char as Operator);
        const urlName = op.data.name.toLowerCase().split(' the ').join('-').split(/'|,/).join('').split(' ').join('-').split('ë').join('e').split('ł').join('l');// Unholy dumbness
        const authorField = { name: op.data.name, iconURL: paths.aceshipImageUrl + `/avatars/${op.id}.png`, url: `https://gamepress.gg/arknights/operator/${urlName}` };
        return authorField;
    }
    else if ((char as Enemy).excel) {
        const enem = (char as Enemy);
        const authorField = { name: enem.excel.name, iconURL: paths.aceshipImageUrl + `/enemy/${enem.excel.enemyId}.png` };
        return authorField;
    }
    return null;
}
function buildCostString(costs: LevelUpCost[], itemArr: Item[]): string {
    let description = '';
    for (const cost of costs) {
        const item = itemArr.find(e => e.data.itemId === cost.id);
        description += `${item.data.name} **x${cost.count}**\n`;
    }
    return description;
}
function buildRangeField(range: GridRange): EmbedField {
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

    const enemyArr = await getAllEnemies({ include: ['excel.enemyId', 'excel.enemyIndex', 'excel.name', 'excel.enemyLevel', 'levels.Value.level'] });
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

function buildArtEmbed(op: Operator, page: number): EmbedBuilder {
    const displaySkin = op.skins[page].displaySkin;

    const embed = new EmbedBuilder()
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
async function buildCostEmbed(op: Operator, page: number): Promise<EmbedBuilder> {
    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(buildAuthorField(op));

    const itemArr = await getAllItems({ include: ['data'] });
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
function buildModuleEmbed(op: Operator, page: number, level: number): EmbedBuilder {
    const module = op.modules[page];

    const embed = new EmbedBuilder()
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
function buildOperatorEmbed(op: Operator): EmbedBuilder {
    const embed = new EmbedBuilder()
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
async function buildSkillEmbed(op: Operator, page: number, level: number): Promise<EmbedBuilder> {
    const skill = op.skills[page];
    const skillLevel = skill.levels[level];

    const description = `**${gameConsts.spTypes[skillLevel.spData.spType]} - ${gameConsts.skillTypes[skillLevel.skillType]}**` +
        `\n***Initial:* ${skillLevel.spData.initSp} SP - *Cost:* ${skillLevel.spData.spCost} SP${(skillLevel.duration && skillLevel.duration > 0) ? ` - *Duration:* ${skillLevel.duration} sec` : ''}**` +
        `\n${insertBlackboard(skillLevel.description, skillLevel.blackboard.concat({ key: 'duration', value: skillLevel.duration }))}`;

    const embed = new EmbedBuilder()
        .setColor(embedColour)
        .setAuthor(buildAuthorField(op))
        .setTitle(`${skillLevel.name} - ${gameConsts.skillLevels[level]}`)
        .setThumbnail(paths.aceshipImageUrl + `/skills/skill_icon_${skill.iconId ?? skill.skillId}.png`)
        .setDescription(description);

    if (skillLevel.rangeId) {
        const range = await getRange({ query: skillLevel.rangeId });
        embed.addFields(buildRangeField(range));
    }

    return embed;
}