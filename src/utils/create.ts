const { enemyImagePath, moduleImagePath, operatorAvatarPath, skillImagePath, stageImagePath } = require('../../paths.json');
const { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { fetchArchetypes, fetchEnemies, fetchModules, fetchRanges, fetchSkills } = require('../utils/fetchData');
const { formatTextBlackboardTags } = require('../utils/utils');

import { Enemy, Module, Operator, Range, Skill, Stage, StageData, StageInfo } from "./types";

const professions: { [key: string]: string } = {
    PIONEER: 'Vanguard',
    WARRIOR: 'Guard',
    TANK: 'Defender',
    SNIPER: 'Sniper',
    CASTER: 'Caster',
    MEDIC: 'Medic',
    SUPPORT: 'Supporter',
    SPECIAL: 'Specialist'
};
const skillLevels = ['Lv1', 'Lv2', 'Lv3', 'Lv4', 'Lv5', 'Lv6', 'Lv7', 'M1', 'M2', 'M3'];
const skillTypes = ['Passive', 'Manual Trigger', 'Auto Trigger'];
const spTypes = [undefined, 'Per Second', 'Offensive', undefined, 'Defensive', undefined, undefined, undefined, 'Passive'];

module.exports = {
    enemyEmbed(enemy: Enemy) {
        const enemyInfo = enemy.excel;
        const enemyData = enemy.levels.Value[0].enemyData;

        const image = new AttachmentBuilder(`./${enemyImagePath}/${enemyInfo.enemyId}.png`);

        const hp = enemyData.attributes.maxHp.m_value.toString();
        const atk = enemyData.attributes.atk.m_value.toString();
        const def = enemyData.attributes.def.m_value.toString();
        const res = enemyData.attributes.magicResistance.m_value.toString();
        const weight = enemyData.attributes.massLevel.m_value.toString();
        const life = enemyData.lifePointReduce.m_defined ? enemyData.lifePointReduce.m_value.toString() : '1';

        const silenceImmune = enemyData.attributes.silenceImmune.m_defined ? enemyData.attributes.silenceImmune.m_value : false;
        const stunImmune = enemyData.attributes.stunImmune.m_defined ? enemyData.attributes.stunImmune.m_value : false;
        const sleepImmune = enemyData.attributes.sleepImmune.m_defined ? enemyData.attributes.sleepImmune.m_value : false;
        const frozenImmune = enemyData.attributes.frozenImmune.m_defined ? enemyData.attributes.frozenImmune.m_value : false;
        const levitateImmune = enemyData.attributes.levitateImmune.m_defined ? enemyData.attributes.levitateImmune.m_value : false;

        const embed = new EmbedBuilder()
            .setColor(0xebca60)
            .setTitle(`${enemyInfo.enemyIndex} - ${enemyInfo.name}`)
            .setThumbnail(`attachment://${enemyInfo.enemyId}.png`)
            .setDescription(enemyInfo.description)
            .addFields(
                { name: '❤️ HP', value: hp, inline: true },
                { name: '⚔️ ATK', value: atk, inline: true },
                { name: '🛡️ DEF', value: def, inline: true },
                { name: '✨ RES', value: res, inline: true },
                { name: '⚖️ Weight', value: weight, inline: true },
                { name: '💔 Life Points', value: life, inline: true },
                { name: 'Silence', value: silenceImmune ? '❌' : '✅', inline: true },
                { name: 'Stun', value: stunImmune ? '❌' : '✅', inline: true },
                { name: 'Sleep', value: sleepImmune ? '❌' : '✅', inline: true },
                { name: 'Freeze', value: frozenImmune ? '❌' : '✅', inline: true },
                { name: 'Levitate', value: levitateImmune ? '❌' : '✅', inline: true }
            );

        return { embeds: [embed], files: [image] };
    },
    infoEmbed(op: Operator, currentType: number, currentPage: number, currentLevel: number) {
        const embedArr = [], fileArr = [], componentRows = [];

        const operatorEmbed = this.operatorEmbed(op);

        for (const embed of operatorEmbed.embeds) {
            embedArr.push(embed);
        }
        for (const file of operatorEmbed.files) {
            fileArr.push(file);
        }

        const skillsButton = new ButtonBuilder()
            .setCustomId('skills')
            .setLabel('Skills')
            .setStyle(ButtonStyle.Success);
        const modulesButton = new ButtonBuilder()
            .setCustomId('modules')
            .setLabel('Modules')
            .setStyle(ButtonStyle.Success);
        const artButton = new ButtonBuilder()
            .setCustomId('art')
            .setLabel('Art')
            .setStyle(ButtonStyle.Success);
        const baseButton = new ButtonBuilder()
            .setCustomId('base')
            .setLabel('Base Skills')
            .setStyle(ButtonStyle.Success);

        const pageRow = new ActionRowBuilder().addComponents(skillsButton, modulesButton, artButton, baseButton);

        if (op.data.skills.length == 0) {
            skillsButton.setStyle(ButtonStyle.Secondary);
            skillsButton.setDisabled(true);
        }
        if (op.modules == null) {
            modulesButton.setStyle(ButtonStyle.Secondary);
            modulesButton.setDisabled(true);
        }

        switch (currentType) {
            case 0:
                break;
            case 1:
                skillsButton.setDisabled(true);

                const skills = op.data.skills;

                if (skills.length != 0) {
                    const skillDict: { [key: string]: Skill } = fetchSkills();
                    const skill = skillDict[skills[currentPage].skillId];
                    const skillEmbed = this.skillEmbed(skill, currentLevel, op);

                    for (const embed of skillEmbed.embeds) {
                        embedArr.push(embed);
                    }
                    for (const file of skillEmbed.files) {
                        fileArr.push(file);
                    }
                    for (const componentRow of skillEmbed.components) {
                        componentRows.push(componentRow);
                    }

                    const skillOne = new ButtonBuilder()
                        .setCustomId('p1')
                        .setLabel('Skill 1')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true);
                    const skillTwo = new ButtonBuilder()
                        .setCustomId('p2')
                        .setLabel('Skill 2')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true);
                    const skillThree = new ButtonBuilder()
                        .setCustomId('p3')
                        .setLabel('Skill 3')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true);

                    const skillRow = new ActionRowBuilder().addComponents(skillOne, skillTwo, skillThree);
                    componentRows.push(skillRow);
                    const skillArr = [skillOne, skillTwo, skillThree];

                    for (let i = 0; i < skills.length; i++) {
                        skillArr[i].setStyle(ButtonStyle.Primary);
                        if (i != currentPage) {
                            skillArr[i].setDisabled(false);
                        }
                    }
                }
                break;
            case 2:
                modulesButton.setDisabled(true);

                const modules = op.modules;

                if (modules != null) {
                    const moduleDict: { [key: string]: Module } = fetchModules();
                    const module = moduleDict[modules[currentPage + 1]];
                    const moduleEmbed = this.moduleEmbed(module, currentLevel, op);

                    for (const embed of moduleEmbed.embeds) {
                        embedArr.push(embed);
                    }
                    for (const file of moduleEmbed.files) {
                        fileArr.push(file);
                    }
                    for (const componentRow of moduleEmbed.components) {
                        componentRows.push(componentRow);
                    }

                    const moduleOne = new ButtonBuilder()
                        .setCustomId('p1')
                        .setLabel('Module 1')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true);
                    const moduleTwo = new ButtonBuilder()
                        .setCustomId('p2')
                        .setLabel('Module 2')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true);

                    const moduleRow = new ActionRowBuilder().addComponents(moduleOne, moduleTwo);
                    componentRows.push(moduleRow);
                    const moduleArr = [moduleOne, moduleTwo];

                    for (let i = 0; i < modules.length - 1; i++) {
                        moduleArr[i].setStyle(ButtonStyle.Primary);
                        if (i != currentPage) {
                            moduleArr[i].setDisabled(false);
                        }
                    }
                }

                break;
            case 3:
                artButton.setDisabled(true);
                break;
            case 4:
                baseButton.setDisabled(true);
                break;
        }

        componentRows.push(pageRow);

        return { embeds: embedArr, files: fileArr, components: componentRows };
    },
    moduleEmbed(module: Module, level: number, operator: Operator) {
        const moduleInfo = module.info;
        const moduleId = moduleInfo.uniEquipId;
        const moduleLevel = module.data.phases[level];

        const avatar = new AttachmentBuilder(`./${operatorAvatarPath}/${operator.id}.png`);
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
            .setAuthor({ name: operator.data.name, iconURL: `attachment://${operator.id}.png` })
            .setTitle(name)
            .setThumbnail(`attachment://${moduleId}.png`)
            .setDescription(traitDescription);

        if (talentName != '' && talentDescription != '') {
            embed.addFields({ name: `*Talent:* ${talentName}`, value: talentDescription });
        }

        let statDescription = '';
        for (const attribute of moduleLevel.attributeBlackboard) {
            statDescription += `${attribute.key.toUpperCase()} +${attribute.value}\n`;
        }
        embed.addFields({ name: `Stats`, value: statDescription });

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

        return { embeds: [embed], files: [image, avatar], components: [rowOne] };
    },
    operatorEmbed(op: Operator) {
        const archetypeDict: { [key: string]: string } = fetchArchetypes();

        const opData = op.data;
        const opId = op.id;
        const opMax = opData.phases[opData.phases.length - 1];
        const avatar = new AttachmentBuilder(`./${operatorAvatarPath}/${opId}.png`);

        let name = `${opData.name} - `;
        for (let i = -1; i < opData.rarity; i++) {
            name += '★';
        }

        const urlName = opData.name.toLowerCase().split(' the ').join('-').split('\'').join('').split(' ').join('-').split('ë').join('e').split('ł').join('l');

        let description = formatTextBlackboardTags(opData.description, []);
        if (opData.trait != null) {
            const candidate = opData.trait.candidates[opData.trait.candidates.length - 1];
            if (candidate.overrideDescripton != null) {
                description = formatTextBlackboardTags(candidate.overrideDescripton, candidate.blackboard);
            }
        }

        const embedDescription = `**${professions[opData.profession]} - ${archetypeDict[opData.subProfessionId]}**\n${description}`;
        const rangeField = this.rangeEmbedField(opMax.rangeId);

        const embed = new EmbedBuilder()
            .setColor(0xebca60)
            .setTitle(name)
            .setThumbnail(`attachment://${opId}.png`)
            .setURL(`https://gamepress.gg/arknights/operator/${urlName}`)
            .setDescription(embedDescription)
            .addFields(rangeField);

        for (const talent of opData.talents) {
            const candidate = talent.candidates[talent.candidates.length - 1];
            embed.addFields({ name: `*Talent:* ${candidate.name}`, value: formatTextBlackboardTags(candidate.description, []) });
        }

        let potentialString = '';
        for (const potential of opData.potentialRanks) {
            potentialString += `${potential.description}\n`;
        }
        if (potentialString != '') {
            embed.addFields({ name: 'Potentials', value: potentialString, inline: true });
        }

        let trustString = '';
        const trustBonus: { [key: string]: number | boolean } = opData.favorKeyFrames[1].data;
        for (const trustKey of Object.keys(trustBonus)) {
            const trustValue = trustBonus[trustKey];
            if (trustValue != 0 && trustValue != 0.0 && trustValue != false) {
                trustString += `${trustKey.toUpperCase()} +${trustValue}\n`;
            }
        }
        embed.addFields({ name: 'Trust Bonus', value: trustString, inline: true });

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

        return { embeds: [embed], files: [avatar] };
    },
    rangeEmbedField(rangeId: string) {
        const rangeDict: { [key: string]: Range } = fetchRanges();
        const range = rangeDict[rangeId];
        const rangeGrid = range.grids;

        let left = 0, right = 0, top = 0, bottom = 0;
        for (const square of rangeGrid) {
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
        for (const square of rangeGrid) {
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
    },
    skillEmbed(skill: Skill, level: number, operator: Operator) {
        const skillLevel = skill.levels[level];

        const avatar = new AttachmentBuilder(`./${operatorAvatarPath}/${operator.id}.png`);
        const imagePath = skill.iconId === null ? skill.skillId : skill.iconId;
        const image = new AttachmentBuilder(`./${skillImagePath}/skill_icon_${imagePath}.png`);

        const name = `${skillLevel.name} - ${skillLevels[level]}`;
        const spCost = skillLevel.spData.spCost;
        const initSp = skillLevel.spData.initSp;
        const skillDuration = skillLevel.duration;
        const spType = spTypes[skillLevel.spData.spType];
        const skillType = skillTypes[skillLevel.skillType];

        const description = formatTextBlackboardTags(skillLevel.description, skillLevel.blackboard);

        let embedDescription = `**${spType} - ${skillType}**\n***Cost:* ${spCost} SP - *Initial:* ${initSp} SP`;
        if (skillDuration > 0) {
            embedDescription += ` - *Duration:* ${skillDuration} sec`;
        }
        embedDescription += `**\n${description} `;

        const embed = new EmbedBuilder()
            .setColor(0xebca60)
            .setAuthor({ name: operator.data.name, iconURL: `attachment://${operator.id}.png` })
            .setTitle(name)
            .setThumbnail(`attachment://skill_icon_${imagePath.split(/\[|\]/).join('')}.png`)
            .setDescription(embedDescription);

        if (skillLevel.rangeId != null) {
            const rangeField = this.rangeEmbedField(skillLevel.rangeId);
            embed.addFields(rangeField);
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
        const lFour = new ButtonBuilder()
            .setCustomId('l4')
            .setLabel('Lv4')
            .setStyle(ButtonStyle.Secondary);
        const lFive = new ButtonBuilder()
            .setCustomId('l5')
            .setLabel('Lv5')
            .setStyle(ButtonStyle.Secondary);
        const lSix = new ButtonBuilder()
            .setCustomId('l6')
            .setLabel('Lv6')
            .setStyle(ButtonStyle.Secondary);
        const lSeven = new ButtonBuilder()
            .setCustomId('l7')
            .setLabel('Lv7')
            .setStyle(ButtonStyle.Secondary);
        const mOne = new ButtonBuilder()
            .setCustomId('m1')
            .setLabel('M1')
            .setStyle(ButtonStyle.Danger);
        const mTwo = new ButtonBuilder()
            .setCustomId('m2')
            .setLabel('M2')
            .setStyle(ButtonStyle.Danger);
        const mThree = new ButtonBuilder()
            .setCustomId('m3')
            .setLabel('M3')
            .setStyle(ButtonStyle.Danger);

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

        const rowOne = new ActionRowBuilder().addComponents(lOne, lTwo, lThree, lFour, lFive);
        const rowTwo = new ActionRowBuilder().addComponents(lSix, lSeven, mOne, mTwo, mThree);

        return { embeds: [embed], files: [image, avatar], components: [rowOne, rowTwo] };
    },
    stageEmbed(stage: Stage, isChallenge: boolean) {
        const enemyDict: { [key: string]: Enemy } = fetchEnemies();

        const stageInfo = isChallenge ? stage.challenge.excel : stage.normal.excel;
        const stageData = isChallenge ? stage.challenge.levels : stage.normal.levels;

        const titleString = isChallenge ? `Challenge ${stageInfo.code} - ${stageInfo.name}` : `${stageInfo.code} - ${stageInfo.name}`;

        const stageEnemies = stageData.enemyDbRefs;
        let enemyString = '', eliteString = '', bossString = '';

        for (const enemy of stageEnemies) {
            if (enemyDict.hasOwnProperty(enemy.id)) {
                const enemyInfo = enemyDict[enemy.id].excel;
                switch (enemyInfo.enemyLevel) {
                    case ('NORMAL'):
                        enemyString += `${enemyInfo.enemyIndex} - ${enemyInfo.name}\n`;
                        break;
                    case ('ELITE'):
                        eliteString += `${enemyInfo.enemyIndex} - ${enemyInfo.name}\n`;
                        break;
                    case ('BOSS'):
                        bossString += `${enemyInfo.enemyIndex} - ${enemyInfo.name}\n`;
                        break;
                }
            }
        }

        const embed = new EmbedBuilder()
            .setColor(0xebca60)
            .setTitle(titleString);

        if (enemyString != '') {
            embed.addFields({ name: 'Enemies', value: enemyString, inline: true });
        }
        if (eliteString != '') {
            embed.addFields({ name: 'Elites', value: eliteString, inline: true });
        }
        if (bossString != '') {
            embed.addFields({ name: 'Leaders', value: bossString, inline: false });
        }

        // TODO: find some other way of getting stage images
        const image = new AttachmentBuilder(`${stageImagePath}/${stageInfo.stageId}.png`);
        embed.setImage(`attachment://${stageInfo.stageId}.png`);
        return { embeds: [embed], files: [image] };
    }
}