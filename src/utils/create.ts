const { baseImagePath, eliteImagePath, enemyImagePath, moduleImagePath, operatorAvatarPath, operatorImagePath, stageImagePath, skillImagePath, skinGroupPath } = require('../../paths.json');
const { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const fetch = require('../utils/fetch');
const utils = require('../utils/utils');
const { eliteLevels, professions, qualifications, skillLevels, skillTypes, spTypes, tagValues, tileDict } = require('../utils/contants');

import { Base, BaseInfo, Enemy, Module, Paradox, Operator, Range, RogueStage, Skill, Skin, Stage } from "../types";

const archetypeDict: { [key: string]: string } = fetch.archetypes();
const baseDict: { [key: string]: Base } = fetch.bases();
const enemyDict: { [key: string]: Enemy } = fetch.enemies();
const moduleDict: { [key: string]: Module } = fetch.modules();
const opDict: { [key: string]: Operator } = fetch.operators();
const paradoxDict: { [key: string]: Paradox } = fetch.paradoxes();
const rangeDict: { [key: string]: Range } = fetch.ranges();
const is2Dict: { [key: string]: RogueStage[] } = fetch.rogue1Stages();
const is3Dict: { [key: string]: RogueStage[] } = fetch.rogue2Stages();
const skillDict: { [key: string]: Skill } = fetch.skills();
const skinDict: { [key: string]: Skin[] } = fetch.skins();
const stageDict: { [key: string]: Stage[] } = fetch.stages();
const toughStageDict: { [key: string]: Stage[] } = fetch.toughStages();
const toughIs2Dict: { [key: string]: RogueStage[] } = fetch.toughRogue1Stages();
const toughIs3Dict: { [key: string]: RogueStage[] } = fetch.toughRogue2Stages();

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
        const description = utils.formatText(base.description, []);

        const embed = new EmbedBuilder()
            .setColor(0xebca60)
            .setAuthor(authorField)
            .setTitle(name)
            .setThumbnail(`attachment://${utils.cleanFilename(base.skillIcon)}.png`)
            .setDescription(description);

        return { embeds: [embed], files: [image, avatar] };

    },
    enemyEmbed(enemy: Enemy) {
        const enemyInfo = enemy.excel;
        const enemyData = enemy.levels.Value[0].enemyData;

        const imagePath = path.join(__dirname, '../../', enemyImagePath, `${enemyInfo.enemyId}.png`);
        const image = new AttachmentBuilder(imagePath);

        const title = `${enemyInfo.enemyIndex} - ${enemyInfo.name}`;
        const description = `${utils.formatText(enemyInfo.description, [])}\n\n${utils.formatText(enemyInfo.ability, [])}`;

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
                { name: 'Silence', value: silenceImmune ? '❌' : '✅', inline: true },
                { name: 'Stun', value: stunImmune ? '❌' : '✅', inline: true },
                { name: 'Sleep', value: sleepImmune ? '❌' : '✅', inline: true },
                { name: 'Freeze', value: frozenImmune ? '❌' : '✅', inline: true },
                { name: 'Levitate', value: levitateImmune ? '❌' : '✅', inline: true }
            );

        return { embeds: [embed], files: [image] };
    },
    infoEmbed(op: Operator, type: number, page: number, level: number) {
        const embedArr = [], fileArr = [], componentRows = [];

        const operatorEmbed = this.operatorEmbed(op);

        for (const embed of operatorEmbed.embeds) {
            embedArr.push(embed);
        }
        for (const file of operatorEmbed.files) {
            fileArr.push(file);
        }

        const skillsButton = new ButtonBuilder()
            .setCustomId(`infoඞ${op.id}ඞ1ඞ0ඞ0`)
            .setLabel('Skills')
            .setStyle(ButtonStyle.Success);
        const modulesButton = new ButtonBuilder()
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

        if (op.data.skills.length == 0) {
            skillsButton.setStyle(ButtonStyle.Secondary);
            skillsButton.setDisabled(true);
        }
        if (op.modules.length == 0) {
            modulesButton.setStyle(ButtonStyle.Secondary);
            modulesButton.setDisabled(true);
        }
        if (op.bases.length == 0) {
            baseButton.setStyle(ButtonStyle.Secondary);
            baseButton.setDisabled(true);
        }

        switch (type) {
            case 0:
                break;
            case 1:
                skillsButton.setDisabled(true);

                const skills = op.data.skills;

                if (skills.length === 0) break;

                const skillDict: { [key: string]: Skill } = fetch.skills();
                const skill = skillDict[skills[page].skillId];
                const skillEmbed = this.infoSkillEmbed(op, type, page, level);

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
                    .setCustomId(`info_skill_nonexist1`)
                    .setLabel('Skill 1')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);
                const skillTwo = new ButtonBuilder()
                    .setCustomId(`info_skill_nonexist2`)
                    .setLabel('Skill 2')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);
                const skillThree = new ButtonBuilder()
                    .setCustomId(`info_skill_nonexist3`)
                    .setLabel('Skill 3')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);

                const skillRow = new ActionRowBuilder().addComponents(skillOne, skillTwo, skillThree);
                componentRows.push(skillRow);
                const skillArr = [skillOne, skillTwo, skillThree];

                for (let i = 0; i < skills.length; i++) {
                    skillArr[i].setStyle(ButtonStyle.Primary);
                    if (i != page) {
                        skillArr[i].setCustomId(`infoඞ${op.id}ඞ${type}ඞ${i}ඞ${level}ඞskill`)
                        skillArr[i].setDisabled(false);
                    } else {
                        skillArr[i].setCustomId(`info_skill_current`);
                    }
                }

                break;
            case 2:
                modulesButton.setDisabled(true);

                const modules = op.modules;

                if (modules === null) break;

                const moduleDict: { [key: string]: Module } = fetch.modules();
                const module = moduleDict[modules[page + 1]];
                const moduleEmbed = this.infoModuleEmbed(op, type, page, level);

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
                    .setCustomId(`info_module_nonexist1`)
                    .setLabel('Module 1')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);
                const moduleTwo = new ButtonBuilder()
                    .setCustomId(`info_module_nonexist1`)
                    .setLabel('Module 2')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);

                const moduleRow = new ActionRowBuilder().addComponents(moduleOne, moduleTwo);
                componentRows.push(moduleRow);
                const moduleArr = [moduleOne, moduleTwo];

                for (let i = 0; i < modules.length - 1; i++) {
                    moduleArr[i].setStyle(ButtonStyle.Primary);
                    if (i != page) {
                        moduleArr[i].setCustomId(`infoඞ${op.id}ඞ${type}ඞ${i}ඞ${level}ඞmodule`)
                        moduleArr[i].setDisabled(false);
                    } else {
                        moduleArr[i].setCustomId(`info_module_current`);
                    }
                }

                break;
            case 3:
                artButton.setDisabled(true);

                const skinEmbed = this.infoSkinEmbed(op, type, page, level);

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
                    const baseDict = fetch.bases();
                    const base = baseDict[baseInfo.buffId];
                    const baseEmbed = this.baseEmbed(base, baseInfo, op);

                    for (const embed of baseEmbed.embeds) {
                        embedArr.push(embed);
                    }
                    for (const file of baseEmbed.files) {
                        fileArr.push(file);
                    }
                }

                break;
        }

        const pageRow = new ActionRowBuilder().addComponents(skillsButton, modulesButton, artButton, baseButton);
        componentRows.push(pageRow);

        return { embeds: embedArr, files: fileArr, components: componentRows };
    },
    infoSkillEmbed(op: Operator, type: number, page: number, level: number) {
        const skill = skillDict[op.data.skills[page].skillId];
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

        const description = utils.formatText(skillLevel.description, skillLevel.blackboard);

        let embedDescription = `**${spType} - ${skillType}**\n***Cost:* ${spCost} SP - *Initial:* ${initSp} SP`;
        if (skillDuration > 0) {
            embedDescription += ` - *Duration:* ${skillDuration} sec`;
        }
        embedDescription += `**\n${description} `;

        const embed = new EmbedBuilder()
            .setColor(0xebca60)
            .setAuthor(authorField)
            .setTitle(name)
            .setThumbnail(`attachment://skill_icon_${utils.cleanFilename(imageFilename)}.png`)
            .setDescription(embedDescription);

        if (skillLevel.rangeId != null) {
            const rangeField = this.rangeField(skillLevel.rangeId);
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

        const rowOne = new ActionRowBuilder().addComponents(lOne, lTwo, lThree, lFour, lFive);
        const rowTwo = new ActionRowBuilder().addComponents(lSix, lSeven, mOne, mTwo, mThree);

        return { embeds: [embed], files: [image, avatar], components: [rowOne, rowTwo] };
    },
    infoModuleEmbed(op: Operator, type: number, page: number, level: number) {
        const module = moduleDict[op.modules[page + 1]];
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
                    traitDescription += `${utils.formatText(candidate.additionalDescription, candidate.blackboard)}\n`;
                }
                if (candidate.overrideDescripton != null) {
                    traitDescription += `${utils.formatText(candidate.overrideDescripton, candidate.blackboard)}\n`;
                }
            }
            if (part.addOrOverrideTalentDataBundle.candidates != null) {
                const candidates = part.addOrOverrideTalentDataBundle.candidates;
                const candidate = candidates[candidates.length - 1];

                if (candidate.name != null) {
                    talentName = candidate.name;
                }
                if (candidate.upgradeDescription != null) {
                    talentDescription += `${utils.formatText(candidate.upgradeDescription, candidate.blackboard)}\n`;
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

        const rowOne = new ActionRowBuilder().addComponents(lOne, lTwo, lThree);

        return { embeds: [embed], files: [image, avatar], components: [rowOne] };
    },
    infoSkinEmbed(op: Operator, type: number, page: number, level: number) {
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
        const artistName = displaySkin.drawerName;

        const embed = new EmbedBuilder()
            .setColor(0xebca60)
            .setAuthor(authorField)
            .setTitle(`${name}`)
            .setImage(`attachment://${utils.cleanFilename(portraitId)}.png`);

        if (artistName != null && artistName != '') {
            embed.addFields({ name: `Artist`, value: artistName });
        }

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
                const split = skinGroupId.split('#');
                const newSkinGroupId = `${split[0]}#${split[1]}`;

                const thumbnailPath = path.join(__dirname, '../../', skinGroupPath, `${newSkinGroupId}.png`);
                thumbnail = new AttachmentBuilder(thumbnailPath);
                embed.setThumbnail(`attachment://${newSkinGroupId.split(/[#\+]/).join('')}.png`);
                break;
            }
        }

        const defaultSkinArr = new ActionRowBuilder();
        const skinArr = new ActionRowBuilder();
        const components = [];

        for (let i = 0; i < skinsNum; i++) {
            const skinGroup = skins[i].displaySkin.skinGroupName;

            const skinButton = new ButtonBuilder()
                .setCustomId(`infoඞ${op.id}ඞ${type}ඞ${i}ඞ${level}ඞskin`)
                .setLabel(skinGroup)
                .setStyle(ButtonStyle.Primary);
            if (i === page) {
                skinButton.setCustomId(`info_skin_currentpage`);
                skinButton.setDisabled(true);
            }

            if (skinGroup === 'Default Outfit') {
                defaultSkinArr.addComponents(skinButton);
                components[0] = defaultSkinArr;
            } else {
                skinArr.addComponents(skinButton);
                components[1] = skinArr;
            }
        }

        return { embeds: [embed], files: [image, avatar, thumbnail], components: components };
    },
    moduleEmbed(module: Module, op: Operator, level: number) {
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
                    traitDescription += `${utils.formatText(candidate.additionalDescription, candidate.blackboard)}\n`;
                }
                if (candidate.overrideDescripton != null) {
                    traitDescription += `${utils.formatText(candidate.overrideDescripton, candidate.blackboard)}\n`;
                }
            }
            if (part.addOrOverrideTalentDataBundle.candidates != null) {
                const candidates = part.addOrOverrideTalentDataBundle.candidates;
                const candidate = candidates[candidates.length - 1];

                if (candidate.name != null) {
                    talentName = candidate.name;
                }
                if (candidate.upgradeDescription != null) {
                    talentDescription += `${utils.formatText(candidate.upgradeDescription, candidate.blackboard)}\n`;
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
        const archetypeDict: { [key: string]: string } = fetch.archetypes();

        const opData = op.data;
        const opId = op.id;
        const opMax = opData.phases[opData.phases.length - 1];

        const avatarPath = path.join(__dirname, '../../', operatorAvatarPath, `${op.id}.png`);
        const avatar = new AttachmentBuilder(avatarPath);

        let name = `${opData.name} - `;
        for (let i = 0; i <= opData.rarity; i++) {
            name += '★';
        }

        let description = utils.formatText(opData.description, []);
        if (opData.trait != null) {
            const candidate = opData.trait.candidates[opData.trait.candidates.length - 1];
            if (candidate.overrideDescripton != null) {
                description = utils.formatText(candidate.overrideDescripton, candidate.blackboard);
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

        if (opData.talents != null) {
            for (const talent of opData.talents) {
                const candidate = talent.candidates[talent.candidates.length - 1];
                embed.addFields({ name: `*Talent:* ${candidate.name}`, value: utils.formatText(candidate.description, []) });
            }
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
        if (trustString != '') {
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

        return { embeds: [embed], files: [avatar] };
    },
    async paradoxEmbed(paradox: Paradox) {
        const enemyDict: { [key: string]: Enemy } = fetch.enemies();
        const operatorDict: { [key: string]: Operator } = fetch.operators();

        const stageInfo = paradox.excel;
        const stageData = paradox.levels;
        const stageId = stageInfo.stageId;

        const op = operatorDict[stageInfo.charId];

        const avatarPath = path.join(__dirname, '../../', operatorAvatarPath, `${op.id}.png`);
        const avatar = new AttachmentBuilder(avatarPath);

        const authorField = this.authorField(op);
        const title = `Paradox Simulation - ${stageInfo.name}`;
        const description = utils.formatText(stageInfo.description, []);

        const embed = new EmbedBuilder()
            .setColor(0xebca60)
            .setAuthor(authorField)
            .setTitle(title)
            .setDescription(description);

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
            const imagePath = path.join(__dirname, '../../', stageImagePath, `${stageId}.png`);
            await fs.promises.access(imagePath);
            const image = new AttachmentBuilder(imagePath);

            embed.setImage(`attachment://${stageId}.png`)

            return { embeds: [embed], files: [image, avatar] };
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

            return { embeds: [embed], files: [avatar] };
        }
    },
    rangeField(rangeId: string) {
        const rangeDict: { [key: string]: Range } = fetch.ranges();
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
    recruitEmbed(qual: string, value: number, tag: string, select: boolean) {
        if (tag != '') {
            if (select) {
                value *= tagValues[tag];
            } else {
                value /= tagValues[tag];
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
                const buttonValue = tagValues[buttonTag];

                if (value % buttonValue != 0) continue;

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
            .setColor(0xebca60)
            .setTitle('Recruitment Calculator');

        const { recruitPool } = require('../utils/contants');
        const opArr: Operator[] = [];

        if (selectedButtons.length >= 1) {
            for (const opId of Object.values(recruitPool)) {
                const op = opDict[String(opId)];
                if (op.recruitId % value != 0) continue;
                if (qual != null && qual != 'null' && op.data.rarity != qualifications[qual]) continue;

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
    },
    skillEmbed(skill: Skill, op: Operator, level: number) {
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

        const description = utils.formatText(skillLevel.description, skillLevel.blackboard);

        let embedDescription = `**${spType} - ${skillType}**\n***Cost:* ${spCost} SP - *Initial:* ${initSp} SP`;
        if (skillDuration > 0) {
            embedDescription += ` - *Duration:* ${skillDuration} sec`;
        }
        embedDescription += `**\n${description} `;

        const embed = new EmbedBuilder()
            .setColor(0xebca60)
            .setAuthor(authorField)
            .setTitle(name)
            .setThumbnail(`attachment://skill_icon_${utils.cleanFilename(imageFilename)}.png`)
            .setDescription(embedDescription);

        if (skillLevel.rangeId != null) {
            const rangeField = this.rangeField(skillLevel.rangeId);
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
        const skinDict: { [key: string]: Skin[] } = fetch.skins();

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
        const artistName = displaySkin.drawerName;

        const embed = new EmbedBuilder()
            .setColor(0xebca60)
            .setAuthor(authorField)
            .setTitle(`${name}`)
            .setImage(`attachment://${utils.cleanFilename(portraitId)}.png`);

        if (artistName != null && artistName != '') {
            embed.addFields({ name: `Artist`, value: artistName });
        }

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
                const split = skinGroupId.split('#');
                const newSkinGroupId = `${split[0]}#${split[1]}`;

                const thumbnailPath = path.join(__dirname, '../../', skinGroupPath, `${newSkinGroupId}.png`);
                thumbnail = new AttachmentBuilder(thumbnailPath);
                embed.setThumbnail(`attachment://${newSkinGroupId.split(/[#\+]/).join('')}.png`);
                break;
            }
        }

        const defaultSkinArr = new ActionRowBuilder();
        const skinArr = new ActionRowBuilder();
        const components = [];

        for (let i = 0; i < skinsNum; i++) {
            const skinGroup = skins[i].displaySkin.skinGroupName;

            const skillButton = new ButtonBuilder()
                .setCustomId(`skinඞ${op.id}ඞ${i}`)
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
    async rogueStageEmbed(stage: RogueStage) {
        const enemyDict: { [key: string]: Enemy } = fetch.enemies();

        const stageInfo = stage.excel;
        const stageData = stage.levels;

        const title = stageInfo.difficulty === 'NORMAL' ? `${stageInfo.code} - ${stageInfo.name}` : `Challenge ${stageInfo.code} - ${stageInfo.name}`;
        const description = stageInfo.difficulty === 'NORMAL' ? utils.formatText(stageInfo.description, []) : utils.formatText(`${stageInfo.description}\n${stageInfo.eliteDesc}`, []);

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
            .setTitle(title)
            .setDescription(description)
            .setImage(`attachment://${stageInfo.id}.png`);

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
            const imagePath = path.join(__dirname, '../../', stageImagePath, `${stageInfo.id}.png`);
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

            return { embeds: [embed], files: [] };
        }
    },
    async stageEmbed(stage: Stage) {
        const enemyDict: { [key: string]: Enemy } = fetch.enemies();

        const stageInfo = stage.excel;
        const stageData = stage.levels;
        const stageId = stageInfo.stageId;
        const isChallenge = stageInfo.diffGroup === 'TOUGH' || stageInfo.difficulty === 'CHALLENGE'

        const title = isChallenge ? `Challenge ${stageInfo.code} - ${stageInfo.name}` : `${stageInfo.code} - ${stageInfo.name}`;
        const description = utils.formatText(stageInfo.description, []);

        const embed = new EmbedBuilder()
            .setColor(0xebca60)
            .setTitle(title)
            .setDescription(description);

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
            const imagePath = path.join(__dirname, '../../', stageImagePath, `${stageId}.png`);
            await fs.promises.access(imagePath);
            const image = new AttachmentBuilder(imagePath);

            embed.setImage(`attachment://${stageId}.png`)

            return { embeds: [embed], files: [image] };
        } catch (e) {
            try {
                const mainId = stageId.replace('tough', 'main');
                const imagePath = path.join(__dirname, '../../', stageImagePath, `${mainId}.png`);
                await fs.promises.access(imagePath);
                const image = new AttachmentBuilder(imagePath);

                embed.setImage(`attachment://${mainId}.png`)

                return { embeds: [embed], files: [image] };
            } catch (e) {
                try {
                    const newId = stageId.substring(0, stageId.length - 3);
                    const imagePath = path.join(__dirname, '../../', stageImagePath, `${newId}.png`);
                    await fs.promises.access(imagePath);
                    const image = new AttachmentBuilder(imagePath);

                    embed.setImage(`attachment://${newId}.png`)

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

                    return { embeds: [embed], files: [] };
                }
            }
        }
    },
    stageSelectEmbed(stageArr: Stage[] | RogueStage[]) {
        const stageSelector = new StringSelectMenuBuilder()
            .setCustomId(`stageඞ${stageArr[0].excel.code.toLowerCase()}`)
            .setPlaceholder('Select a stage!');

        for (let i = 0; i < stageArr.length; i++) {
            const stage = stageArr[i];
            const stageInfo = stage.excel;

            const name = `${stageInfo.code} - ${stageInfo.name}`;

            stageSelector.addOptions(new StringSelectMenuOptionBuilder()
                .setLabel(name)
                .setValue(`${i}`)
            );
        }

        const componentRow = new ActionRowBuilder().addComponents(stageSelector);

        return { content: 'Multiple stages with that code were found, please select a stage below:', components: [componentRow] };
    }
}