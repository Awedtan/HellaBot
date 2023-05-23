const { baseImagePath, eliteImagePath, enemyImagePath, moduleImagePath, operatorAvatarPath, operatorImagePath, stageImagePath, skillImagePath, skinGroupPath } = require('../../paths.json');
const { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { fetchArchetypes, fetchBases, fetchEnemies, fetchModules, fetchRanges, fetchSkills, fetchSkins } = require('../utils/fetchData');
const { cleanFilename, formatTextBlackboardTags } = require('../utils/utils');
const fs = require('fs');
const path = require('path');

import { Base, BaseInfo, Enemy, Module, Operator, Range, Skill, Skin, Stage } from "./types";

const eliteLevels = ['E0', 'E1', 'E2', 'E3'];
const professions: { [key: string]: string } = { PIONEER: 'Vanguard', WARRIOR: 'Guard', TANK: 'Defender', SNIPER: 'Sniper', CASTER: 'Caster', MEDIC: 'Medic', SUPPORT: 'Supporter', SPECIAL: 'Specialist' };
const skillLevels = ['Lv1', 'Lv2', 'Lv3', 'Lv4', 'Lv5', 'Lv6', 'Lv7', 'M1', 'M2', 'M3'];
const skillTypes = ['Passive', 'Manual Trigger', 'Auto Trigger'];
const spTypes = [undefined, 'Per Second', 'Offensive', undefined, 'Defensive', undefined, undefined, undefined, 'Passive'];
const tileDict = {
    tile_bigforce: { emoji: '💪', name: 'Specialist Tactical Point' },
    tile_corrosion: { emoji: '💔', name: 'Corrosive Ground' },
    tile_deepwater: { emoji: '🔷', name: 'Deep Water Zone' },
    tile_defup: { emoji: '🛡️', name: 'Defensive Rune' },
    tile_end: { emoji: '🟦', name: 'Protection Objective' },
    tile_fence: { emoji: '🟫', name: 'Fence' },
    tile_fence_bound: { emoji: '🟫', name: 'Fence' },
    tile_floor: { emoji: '🟨', name: 'Non-deployable Area' },
    tile_flystart: { emoji: '🔴', name: 'Aerial Unit Incursion Point' },
    tile_forbidden: { emoji: '⬛', name: 'No Entry Zone' },
    tile_gazebo: { emoji: '🔫', name: 'Anti-Air Rune' },
    tile_grass: { emoji: '🌱', name: 'Bush' },
    tile_healing: { emoji: '💟', name: 'Medical Rune' },
    tile_hole: { emoji: '🔳', name: 'Hole' },
    tile_infection: { emoji: '☢️', name: 'Active Originium' },
    tile_rcm_crate: { emoji: '❎', name: 'Recommended Roadblock Point' },
    tile_rcm_operator: { emoji: '❎', name: 'Recommended Deployment Point' },
    tile_road: { emoji: '🟩', name: 'Flat Ground' },
    tile_shallowwater: { emoji: '💧', name: 'Shallow Water Zone' },
    tile_start: { emoji: '🟥', name: 'Incursion Point' },
    tile_telin: { emoji: '🔻', name: 'Tunnel Entry' },
    tile_telout: { emoji: '🔺', name: 'Tunnel Exit' },
    tile_volcano: { emoji: '🔥', name: 'Heat Pump Passage' },
    tile_volspread: { emoji: '🌋', name: 'Lava Crack' },
    tile_wall: { emoji: '⬜', name: 'High Ground' },
    tile_defbreak: { emoji: '💔', name: 'Corrosive Ground' },
    tile_smog: { emoji: '☁️', name: 'Exhaust Grille' },
    tile_yinyang_road: { emoji: '☯️', name: 'Mark of Hui and Ming (Road)' },
    tile_yinyang_wall: { emoji: '☯️', name: 'Mark of Hui and Ming (Wall)' },
    tile_yinyang_switch: { emoji: '☯️', name: 'Mark of Dusk and Dawn' },
    tile_poison: { emoji: '☠️', name: 'Gas Spray' },
    tile_deepsea: { emoji: '🔷', name: 'Deep Water Zone' },
    tile_icestr: { emoji: '🧊', name: 'Icy Surface' },
    tile_icetur_lb: { emoji: '🧊', name: 'Icy Corner' },
    tile_icetur_lt: { emoji: '🧊', name: 'Icy Corner' },
    tile_icetur_rb: { emoji: '🧊', name: 'Icy Corner' },
    tile_icetur_rt: { emoji: '🧊', name: 'Icy Corner' },
    tile_magic_circle: { emoji: '✨', name: 'Activated "Resonator"' },
    tile_magic_circle_h: { emoji: '✨', name: 'Activated "Resonator"' },
    tile_aircraft: { emoji: '🛫', name: 'Aircraft' },
    tile_creep: { emoji: '🟩', name: 'Flat Ground (Nethersea Brand)' },
    tile_creepf: { emoji: '🟫', name: 'Non-deployable Area (Nethersea Brand)' },
    tile_empty: { emoji: '🔳', name: 'Empty' },
    tile_volcano_emp: { emoji: '🔥', name: 'Heat Pump Passage' },
};

module.exports = {
    authorField(op: Operator) {
        const urlName = op.data.name.toLowerCase().split(' the ').join('-').split('\'').join('').split(' ').join('-').split('ë').join('e').split('ł').join('l');
        const authorField = { name: op.data.name, iconURL: `attachment://${op.id}.png`, url: `https://gamepress.gg/arknights/operator/${urlName}` };
        return authorField;
    },
    baseEmbed(base: Base, baseInfo: BaseInfo, op: Operator) {
        const baseCond = baseInfo.cond;

        const avatarPath = path.join(__dirname, '../../', operatorAvatarPath, `${op.id}.png`);
        const imagePath = path.join(__dirname, '../../', baseImagePath, `${base.skillIcon}.png`);
        const avatar = new AttachmentBuilder(avatarPath);
        const image = new AttachmentBuilder(imagePath);

        const name = `${base.buffName} - ${eliteLevels[baseCond.phase]} Lv${baseCond.level}`;
        const authorField = this.authorField(op);
        const description = formatTextBlackboardTags(base.description, []);

        const embed = new EmbedBuilder()
            .setColor(0xebca60)
            .setAuthor(authorField)
            .setTitle(name)
            .setThumbnail(`attachment://${cleanFilename(base.skillIcon)}.png`)
            .setDescription(description);

        return { embeds: [embed], files: [image, avatar], components: [] };

    },
    enemyEmbed(enemy: Enemy) {
        const enemyInfo = enemy.excel;
        const enemyData = enemy.levels.Value[0].enemyData;

        const imagePath = path.join(__dirname, '../../', enemyImagePath, `${enemyInfo.enemyId}.png`);
        const image = new AttachmentBuilder(imagePath);

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

        if (op.data.skills.length == 0) {
            skillsButton.setStyle(ButtonStyle.Secondary);
            skillsButton.setDisabled(true);
        }
        if (op.modules.length == 0) {
            modulesButton.setStyle(ButtonStyle.Secondary);
            modulesButton.setDisabled(true);
        }

        switch (currentType) {
            case 0:
                break;
            case 1:
                skillsButton.setDisabled(true);

                const skills = op.data.skills;

                if (skills.length === 0) break;

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

                break;
            case 2:
                modulesButton.setDisabled(true);

                const modules = op.modules;

                if (modules === null) break;

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

                break;
            case 3:
                artButton.setDisabled(true);

                const skinEmbed = this.skinEmbed(op, currentPage);

                for (const embed of skinEmbed.embeds) {
                    embedArr.push(embed);
                }
                for (const file of skinEmbed.files) {
                    fileArr.push(file);
                }
                for (const componentRow of skinEmbed.components) {
                    componentRows.push(componentRow);
                }

                break;
            case 4:
                baseButton.setDisabled(true);

                for (const baseInfo of op.bases) {
                    const baseDict = fetchBases();
                    const base = baseDict[baseInfo.buffId];
                    const baseEmbed = this.baseEmbed(base, baseInfo, op);

                    for (const embed of baseEmbed.embeds) {
                        embedArr.push(embed);
                    }
                    for (const file of baseEmbed.files) {
                        fileArr.push(file);
                    }
                    for (const componentRow of baseEmbed.components) {
                        componentRows.push(componentRow);
                    }
                }

                break;
        }

        const pageRow = new ActionRowBuilder().addComponents(skillsButton, modulesButton, artButton, baseButton);
        componentRows.push(pageRow);

        return { embeds: embedArr, files: fileArr, components: componentRows };
    },
    moduleEmbed(module: Module, level: number, op: Operator) {
        const moduleInfo = module.info;
        const moduleId = moduleInfo.uniEquipId;
        const moduleLevel = module.data.phases[level];

        const avatarPath = path.join(__dirname, '../../', operatorAvatarPath, `${op.id}.png`);
        const imagePath = path.join(__dirname, '../../', moduleImagePath, `${moduleId}.png`);
        const avatar = new AttachmentBuilder(avatarPath);
        const image = new AttachmentBuilder(imagePath);

        const authorField = this.authorField(op);
        const name = `${moduleInfo.typeIcon.toUpperCase()} ${moduleInfo.uniEquipName} - Lv${level + 1}`;
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
            .setAuthor(authorField)
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

        const avatarPath = path.join(__dirname, '../../', operatorAvatarPath, `${op.id}.png`);
        const avatar = new AttachmentBuilder(avatarPath);

        let name = `${opData.name} - `;
        for (let i = 0; i <= opData.rarity; i++) {
            name += '★';
        }

        let description = formatTextBlackboardTags(opData.description, []);
        if (opData.trait != null) {
            const candidate = opData.trait.candidates[opData.trait.candidates.length - 1];
            if (candidate.overrideDescripton != null) {
                description = formatTextBlackboardTags(candidate.overrideDescripton, candidate.blackboard);
            }
        }

        const embedDescription = `**${professions[opData.profession]} - ${archetypeDict[opData.subProfessionId]}**\n${description}`;
        const rangeField = this.rangeField(opMax.rangeId);

        const embed = new EmbedBuilder()
            .setColor(0xebca60)
            .setTitle(name)
            .setThumbnail(`attachment://${opId}.png`)
            .setURL(this.authorField(op).url)
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
    rangeField(rangeId: string) {
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
    skillEmbed(skill: Skill, level: number, op: Operator) {
        const skillLevel = skill.levels[level];

        const avatarPath = path.join(__dirname, '../../', operatorAvatarPath, `${op.id}.png`);
        const imageFilename = skill.iconId === null ? skill.skillId : skill.iconId;
        const imagePath = path.join(__dirname, '../../', skillImagePath, `skill_icon_${imageFilename}.png`)
        const avatar = new AttachmentBuilder(avatarPath);
        const image = new AttachmentBuilder(imagePath);

        const authorField = this.authorField(op);
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
            .setAuthor(authorField)
            .setTitle(name)
            .setThumbnail(`attachment://skill_icon_${cleanFilename(imageFilename)}.png`)
            .setDescription(embedDescription);

        if (skillLevel.rangeId != null) {
            const rangeField = this.rangeField(skillLevel.rangeId);
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
    skinEmbed(op: Operator, page: number) {
        const skinDict: { [key: string]: Skin[] } = fetchSkins();

        const skins = skinDict[op.id];
        const skin = skins[page];
        const skinsNum = skins.length;

        const displaySkin = skin.displaySkin;
        const portraitId = skin.portraitId;
        const skinGroupId = displaySkin.skinGroupId;

        const avatarPath = path.join(__dirname, '../../', operatorAvatarPath, `${op.id}.png`);
        const imagePath = path.join(__dirname, '../../', operatorImagePath, `${portraitId}.png`);
        const avatar = new AttachmentBuilder(avatarPath);
        const image = new AttachmentBuilder(imagePath);

        const authorField = this.authorField(op);
        const skinName = displaySkin.skinName;
        const skinGroupName = displaySkin.skinGroupName;
        const name = skinName === null ? skinGroupName : `${skinGroupName} - ${skinName}`;

        const embed = new EmbedBuilder()
            .setColor(0xebca60)
            .setAuthor(authorField)
            .setTitle(`${name}`)
            .addFields({ name: `Artist`, value: displaySkin.drawerName })
            .setImage(`attachment://${cleanFilename(portraitId)}.png`);

        let thumbnail;
        switch (skinGroupId) {
            case 'ILLUST_0': {
                const thumbnailPath = path.join(__dirname, '../../', eliteImagePath, '0.png');
                thumbnail = new AttachmentBuilder(thumbnailPath);
                embed.setThumbnail(`attachment://0.png`);
                break;
            }
            case 'ILLUST_1': {
                const thumbnailPath = path.join(__dirname, '../../', eliteImagePath, '1.png');
                thumbnail = new AttachmentBuilder(thumbnailPath);
                embed.setThumbnail(`attachment://1.png`);
                break;
            }
            case 'ILLUST_2': {
                const thumbnailPath = path.join(__dirname, '../../', eliteImagePath, '2.png');
                thumbnail = new AttachmentBuilder(thumbnailPath);
                embed.setThumbnail(`attachment://2.png`);
                break;
            }
            case 'ILLUST_3': {
                const thumbnailPath = path.join(__dirname, '../../', eliteImagePath, '3.png');
                thumbnail = new AttachmentBuilder(thumbnailPath);
                embed.setThumbnail(`attachment://3.png`);
                break;
            }
            default: {
                const thumbnailPath = path.join(__dirname, '../../', skinGroupPath, `${skinGroupId}.png`);
                thumbnail = new AttachmentBuilder(thumbnailPath);
                embed.setThumbnail(`attachment://${skinGroupId.split(/[#\+]/).join('')}.png`);
                break;
            }
        }

        const defaultSkinArr = new ActionRowBuilder();
        const skinArr = new ActionRowBuilder();
        const components = [];

        for (let i = 0; i < skinsNum; i++) {
            const skinGroup = skins[i].displaySkin.skinGroupName;

            const skillButton = new ButtonBuilder()
                .setCustomId(`p${i + 1}`)
                .setLabel(skinGroup)
                .setStyle(ButtonStyle.Primary);
            if (i === page) {
                skillButton.setDisabled(true);
            }

            if (skinGroup === 'Default Outfit') {
                defaultSkinArr.addComponents(skillButton);
                components[0] = defaultSkinArr;
            } else {
                skinArr.addComponents(skillButton);
                components[1] = skinArr;
            }
        }

        return { embeds: [embed], files: [image, avatar, thumbnail], components: components };
    },
    async stageEmbed(stage: Stage, isChallenge: boolean) {
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
            .setTitle(titleString)
            .setImage(`attachment://${stageInfo.stageId}.png`);

        if (enemyString != '') {
            embed.addFields({ name: 'Enemies', value: enemyString, inline: true });
        }
        if (eliteString != '') {
            embed.addFields({ name: 'Elites', value: eliteString, inline: true });
        }
        if (bossString != '') {
            embed.addFields({ name: 'Leaders', value: bossString, inline: false });
        }

        try {
            const imagePath = path.join(__dirname, '../../', stageImagePath, `${stageInfo.stageId}.png`);
            await fs.promises.access(imagePath);

            const image = new AttachmentBuilder(imagePath);
            return { embeds: [embed], files: [image] };
        } catch (e) {
            const mapData = stageData.mapData;
            const map = mapData.map;
            const tiles = mapData.tiles;

            let mapString = '', legendString = '';

            for (let i = 0; i < map.length; i++) {
                for (let j = 0; j < map[0].length; j++) {
                    const tileKey = tiles[map[i][j]].tileKey;
                    const tile = tileDict[tileKey];
                    mapString += tile.emoji;

                    if (legendString.includes(tile.name)) continue;

                    legendString += `${tile.emoji} - ${tile.name}\n`;
                }
                mapString += '\n';
            }

            embed.addFields({ name: 'Map', value: mapString }, { name: 'Legend', value: legendString });

            return { embeds: [embed] };
        }
    }
}