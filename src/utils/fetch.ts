const { dataPath } = require('../../paths.json');
const { professions, tagValues } = require('../utils/contants');

import { Base, BaseInfo, Definition, Enemy, Module, Operator, Paradox, ParadoxInfo, Range, RogueTheme, RogueRelic, RogueStage, RogueStageInfo, RogueVariation, Skill, Skin, Stage, StageData, StageInfo } from "../types";

const archetypeDict: { [key: string]: string } = {};
const baseDict: { [key: string]: Base } = {};
const enemyDict: { [key: string]: Enemy } = {};
const moduleDict: { [key: string]: Module } = {};
const operatorDict: { [key: string]: Operator } = {};
const paradoxDict: { [key: string]: Paradox } = {};
const rangeDict: { [key: string]: Range } = {};
const skillDict: { [key: string]: Skill } = {};
const skinDict: { [key: string]: Skin[] } = {};
const stageDict: { [key: string]: Stage[] } = {};
const definitionDict: { [key: string]: Definition } = {};
const toughStageDict: { [key: string]: Stage[] } = {};
const rogueThemeArr: RogueTheme[] = [];

type SubProf = {
    subProfessionId: string;
    subProfessionName: string;
    subProfessionCatagory: number;
};

module.exports = {
    initializeAll() {
        initArchetypes();
        initBases();
        initDefinitions();
        initEnemies();
        initModules();
        initParadoxes();
        initRanges();
        initRogueThemes();
        initSkills();
        initSkins();
        initStages();

        initOperators();
    },
    archetypes() {
        return archetypeDict;
    },
    bases() {
        return baseDict;
    },
    definitions() {
        return definitionDict;
    },
    enemies() {
        return enemyDict;
    },
    modules() {
        return moduleDict;
    },
    operators() {
        return operatorDict;
    },
    paradoxes() {
        return paradoxDict;
    },
    ranges() {
        return rangeDict;
    },
    rogueThemes() {
        return rogueThemeArr;
    },
    skills() {
        return skillDict;
    },
    skins() {
        return skinDict;
    },
    stages() {
        return stageDict;
    },
    toughStages() {
        return toughStageDict;
    }
}

function initArchetypes() {
    const moduleTable: { [key: string]: any } = require(`${dataPath}/excel/uniequip_table.json`);
    const subProfDict: { [key: string]: SubProf } = moduleTable.subProfDict;

    for (const subProf of Object.values(subProfDict)) {
        archetypeDict[subProf.subProfessionId] = subProf.subProfessionName;
    }
}

function initBases() {
    const buildingData: { [key: string]: any } = require(`${dataPath}/excel/building_data.json`);
    const buffs: { [key: string]: Base } = buildingData.buffs;

    for (const buff of Object.values(buffs)) {
        baseDict[buff.buffId] = buff;
    }
}

function initDefinitions() {
    const gamedataConsts = require(`${dataPath}/excel/gamedata_const.json`);
    const termDescriptionDict: { [key: string]: Definition } = gamedataConsts.termDescriptionDict;

    for (const definition of Object.values(termDescriptionDict)) {
        definitionDict[definition.termName.toLowerCase()] = definition;
    }
}

function initEnemies() {
    // Brute force matches between enemy_handbook_table and enemy_database
    // Stores data in enemyDict[enemy] = {excel, levels}
    //      excel = /excel/enemy_handbook_table.json
    //          Contains name, ID, category, description
    //      levels = /levels/enemydata/enemy_database.json
    //          Contains stats, skills, range
    // Unique enemy key is enemyId (enemy_1007_slime)
    // Additional keys are name (Originium Slug) and enemyIndex (B1)

    const enemyHandbook: { [key: string]: Enemy['excel'] } = require(`${dataPath}/excel/enemy_handbook_table.json`);
    const enemyDatabase: { [key: string]: Enemy['levels'][] } = require(`${dataPath}/levels/enemydata/enemy_database.json`);
    const enemies = enemyDatabase.enemies;

    for (const excel of Object.values(enemyHandbook)) {
        for (const levels of enemies) {
            if (levels.Key != excel.enemyId) continue;

            const enemyId = excel.enemyId.toLowerCase();
            enemyDict[enemyId] = { excel: excel, levels: levels };
            enemyDict[excel.name.toLowerCase()] = enemyDict[enemyId];
            enemyDict[excel.name.split('\'').join('').toLowerCase()] = enemyDict[enemyId];
            enemyDict[excel.enemyIndex.toLowerCase()] = enemyDict[enemyId];
        }
    }
}

function initModules() {
    const moduleTable: { [key: string]: any } = require(`${dataPath}/excel/uniequip_table.json`);
    const equipDict: { [key: string]: Module['info'] } = moduleTable.equipDict;
    const battleDict: { [key: string]: Module['data'] } = require(`${dataPath}/excel/battle_equip_table.json`);

    for (const module of Object.values(equipDict)) {
        const moduleId = module.uniEquipId.toLowerCase()
        moduleDict[moduleId] = { info: module, data: battleDict[moduleId] };
    }
}

function initOperators() {
    const buildingData: { [key: string]: any } = require(`${dataPath}/excel/building_data.json`);
    const operatorTable: { [key: string]: Operator['data'] } = require(`${dataPath}/excel/character_table.json`);
    const moduleTable: { [key: string]: any } = require(`${dataPath}/excel/uniequip_table.json`);

    const chars: { [key: string]: any } = buildingData.chars;
    const charEquip: { [key: string]: string[] } = moduleTable.charEquip;

    for (const opId of Object.keys(operatorTable)) {
        const opData = operatorTable[opId];
        const opName = opData.name.toLowerCase();
        const opModules = charEquip.hasOwnProperty(opId) ? charEquip[opId] : [];
        const opBases: BaseInfo[] = [];

        if (opData.tagList === null) continue;

        if (chars.hasOwnProperty(opId)) {
            for (const buff of chars[opId].buffChar) {
                for (const baseData of buff.buffData) {
                    opBases.push(baseData);
                }
            }
        }

        const positionId = tagValues[opData.position.toLowerCase()];
        const classId = tagValues[professions[opData.profession].toLowerCase()];
        let tagId = 1;
        for (const tag of opData.tagList) {
            tagId *= tagValues[tag.toLowerCase()];
        }
        if (opData.itemDesc != null && opData.itemDesc.includes('robot')) {
            tagId *= tagValues['robot'];
        }

        const recruitId = positionId * classId * tagId;

        operatorDict[opId] = { id: opId, recruitId: recruitId, modules: opModules, bases: opBases, data: opData };
        operatorDict[opName] = operatorDict[opId];
        operatorDict[opName.split('\'').join('')] = operatorDict[opId];
    }

    operatorDict['mlynar'] = operatorDict['młynar'];
    operatorDict['pozemka'] = operatorDict['pozëmka'];
}

function initParadoxes() {
    const handbookTable: { [key: string]: any } = require(`${dataPath}/excel/handbook_info_table.json`);
    const stages: { [key: string]: ParadoxInfo } = handbookTable.handbookStageData;

    for (const excel of Object.values(stages)) {
        try {
            const opId = excel.charId;
            const levelId = excel.levelId.toLowerCase();
            const levels: StageData = require(`${dataPath}/levels/${levelId}.json`);
            const paradox = { excel: excel, levels: levels };

            paradoxDict[opId] = paradox;
        } catch (e) {
            console.error(e);
        }
    }
}

function initRanges() {
    const rangeTable: { [key: string]: Range } = require(`${dataPath}/excel/range_table.json`);

    for (const range of Object.values(rangeTable)) {
        rangeDict[range.id.toLowerCase()] = range;
    }
}

function initRogueThemes() {
    const rogueTable: { [key: string]: any } = require(`${dataPath}/excel/roguelike_topic_table.json`);
    const rogueDetails: { [key: string]: any } = rogueTable.details;

    for (let i = 0; i < Object.keys(rogueDetails).length; i++) {
        const rogueTopics: { [key: string]: any } = rogueTable.topics;

        const name = Object.values(rogueTopics)[i].name;

        const rogueTheme = Object.values(rogueDetails)[i];
        const rogueStages: { [key: string]: RogueStageInfo } = rogueTheme.stages;
        const stageDict: { [key: string]: RogueStage } = {};
        const toughStageDict: { [key: string]: RogueStage } = {};

        for (const excel of Object.values(rogueStages)) {
            const levelId = excel.levelId.toLowerCase();
            const name = excel.name.toLowerCase();

            if (excel.difficulty === 'FOUR_STAR') {
                const levels: StageData = require(`${dataPath}/levels/${levelId}.json`);
                const stage: RogueStage = { excel: excel, levels: levels };

                toughStageDict[name] = stage;
            }
            else if (excel.difficulty === 'NORMAL') {
                const levels = require(`${dataPath}/levels/${levelId}.json`);
                const stage: RogueStage = { excel: excel, levels: levels };

                stageDict[name] = stage;
            }
        }

        const rogueRelics: { [key: string]: RogueRelic } = rogueTheme.items;
        const relicDict: { [key: string]: RogueRelic } = {};

        for (const relic of Object.values(rogueRelics)) {
            if (relic.type === 'BAND' || relic.type == 'CAPSULE') continue;
            relicDict[relic.name.toLowerCase()] = relic;
        }

        const rogueVariations: { [key: string]: RogueVariation } = rogueTheme.variationData;
        const variationDict: { [key: string]: RogueVariation } = {};

        for (const variation of Object.values(rogueVariations)) {
            variationDict[variation.outerName.toLowerCase()] = variation;
        }

        rogueThemeArr[i] = { name: name, stageDict: stageDict, toughStageDict: toughStageDict, relicDict: relicDict, variationDict: variationDict };
    }
}

function initSkills() {
    const skillTable: { [key: string]: Skill } = require(`${dataPath}/excel/skill_table.json`);

    for (const skill of Object.values(skillTable)) {
        const skillId = skill.skillId.toLowerCase();
        skillDict[skillId] = skill;
    }
}

function initSkins() {
    const skinTable: { [key: string]: any } = require(`${dataPath}/excel/skin_table.json`);
    const charSkins: { [key: string]: Skin } = skinTable.charSkins;
    {
        for (const skin of Object.values(charSkins)) {
            const opId = skin.charId;

            if (!skinDict.hasOwnProperty(opId)) {
                skinDict[opId] = [];
            }
            skinDict[opId].push(skin);
        }
    }
}

function initStages() {
    const stageTable: { [key: string]: any } = require(`${dataPath}/excel/stage_table.json`);
    const stages: { [key: string]: StageInfo } = stageTable.stages;

    for (const excel of Object.values(stages)) {
        try {
            if (excel.isStoryOnly || excel.stageType === 'GUIDE') continue;

            const levelRegex = /\S+_m$/;
            let temp = excel.levelId.toLowerCase();
            if (temp.match(levelRegex)) {
                temp = temp.substring(0, excel.levelId.length - 2).split('mission/').join('');
            }
            const levelId = temp;

            const code = excel.code.toLowerCase();

            if (levelId.includes('easy_sub') || levelId.includes('easy')) continue;
            if (levelId === 'activities/act4d0/level_act4d0_05') continue;

            if (excel.diffGroup === 'TOUGH' || excel.difficulty === 'FOUR_STAR') {
                if (!toughStageDict.hasOwnProperty(code)) {
                    toughStageDict[code] = [];
                }

                const levels: StageData = require(`${dataPath}/levels/${levelId}.json`);
                const stage: Stage = { excel: excel, levels: levels };

                toughStageDict[code].push(stage);
            }
            else if (excel.difficulty === 'NORMAL') {
                if (!stageDict.hasOwnProperty(code)) {
                    stageDict[code] = [];
                }

                const levels = require(`${dataPath}/levels/${levelId}.json`);
                const stage: Stage = { excel: excel, levels: levels };

                stageDict[code].push(stage);
            }
        } catch (e) {
            console.error(e);
        }
    }
}