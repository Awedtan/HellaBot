const { dataPath } = require('../../paths.json');

import { Enemy, Module, Operator, Range, Skill, Skin, Stage, StageData, StageInfo } from "./types";

const archetypeDict: { [key: string]: string } = {};
const enemyDict: { [key: string]: Enemy } = {};
const moduleDict: { [key: string]: Module } = {};
const operatorDict: { [key: string]: Operator } = {};
const rangeDict: { [key: string]: Range } = {};
const skillDict: { [key: string]: Skill } = {};
const skinDict: { [key: string]: Skin[] } = {};
const stageDict: { [key: string]: Stage } = {};

type SubProf = {
    subProfessionId: string;
    subProfessionName: string;
    subProfessionCatagory: number;
}

module.exports = {
    initializeAll() {
        initArchetypes();
        initEnemies();
        initModules();
        initOperators();
        initRanges();
        initSkills();
        initSkins();
        initStages();
    },
    fetchArchetypes() {
        return archetypeDict;
    },
    fetchEnemies() {
        return enemyDict;
    },
    fetchModules() {
        return moduleDict;
    },
    fetchOperators() {
        return operatorDict;
    },
    fetchRanges() {
        return rangeDict;
    },
    fetchSkills() {
        return skillDict;
    },
    fetchSkins() {
        return skinDict;
    },
    fetchStages() {
        return stageDict;
    }
}

function initArchetypes() {
    const moduleTable: { [key: string]: any } = require(`${dataPath}/excel/uniequip_table.json`);
    const subProfDict: { [key: string]: SubProf } = moduleTable.subProfDict;

    for (const subProf of Object.values(subProfDict)) {
        archetypeDict[subProf.subProfessionId] = subProf.subProfessionName;
    }
}

// Brute force matches between enemy_handbook_table and enemy_database
// Stores data in enemyDict[enemy] = {excel, levels}
//      excel = /excel/enemy_handbook_table.json
//          Contains name, ID, category, description
//      levels = /levels/enemydata/enemy_database.json
//          Contains stats, skills, range
// Unique enemy key is enemyId (enemy_1007_slime)
// Additional keys are name (Originium Slug) and enemyIndex (B1)
function initEnemies() {
    const enemyHandbook: { [key: string]: Enemy['excel'] } = require(`${dataPath}/excel/enemy_handbook_table.json`);
    const enemyDatabase: { [key: string]: Enemy['levels'][] } = require(`${dataPath}/levels/enemydata/enemy_database.json`);
    const enemies = enemyDatabase.enemies;

    for (const excel of Object.values(enemyHandbook)) {
        for (const levels of enemies) {
            try {
                if (levels.Key === excel.enemyId) {
                    const enemyId = excel.enemyId.toLowerCase();
                    enemyDict[enemyId] = { excel: excel, levels: levels };
                    enemyDict[excel.name.toLowerCase()] = enemyDict[enemyId];
                    enemyDict[excel.enemyIndex.toLowerCase()] = enemyDict[enemyId];
                }
            } catch (e) {
                console.log(e);
            }
        }
    }
}

function initModules() {
    const moduleTable: { [key: string]: any } = require(`${dataPath}/excel/uniequip_table.json`);
    const battleDict: { [key: string]: Module['data'] } = require(`${dataPath}/excel/battle_equip_table.json`);

    const equipDict: { [key: string]: Module['info'] } = moduleTable.equipDict;

    for (const module of Object.values(equipDict)) {
        const moduleId = module.uniEquipId.toLowerCase()
        moduleDict[moduleId] = { info: module, data: battleDict[moduleId] };
    }
}

function initOperators() {
    const operatorTable: { [key: string]: Operator['data'] } = require(`${dataPath}/excel/character_table.json`);
    const moduleTable: { [key: string]: any } = require(`${dataPath}/excel/uniequip_table.json`);
    const charEquip: { [key: string]: string[] } = moduleTable.charEquip;

    for (const operatorId of Object.keys(operatorTable)) {
        const operatorData = operatorTable[operatorId];
        const operatorName = operatorData.name.toLowerCase();
        const operatorModules = charEquip.hasOwnProperty(operatorId) ? charEquip[operatorId] : null;

        operatorDict[operatorId] = { data: operatorData, id: operatorId, modules: operatorModules };
        if (!operatorDict.hasOwnProperty(operatorName)) {
            operatorDict[operatorName] = operatorDict[operatorId];
            operatorDict[operatorName.split('\'').join('')] = operatorDict[operatorId];
        }
    }

    operatorDict['mlynar'] = operatorDict['młynar'];
    operatorDict['pozemka'] = operatorDict['pozëmka'];
}

function initRanges() {
    const rangeTable: { [key: string]: Range } = require(`${dataPath}/excel/range_table.json`);

    for (const range of Object.values(rangeTable)) {
        rangeDict[range.id.toLowerCase()] = range;
    }
}

function initSkills() {
    const skillTable: { [key: string]: Skill } = require(`${dataPath}/excel/skill_table.json`);

    for (const skill of Object.values(skillTable)) {
        const skillId = skill.skillId.toLowerCase();
        const skillName = skill.levels[0].name.toLowerCase();

        skillDict[skillId] = skill;

        if (!skillDict.hasOwnProperty(skillName)) {
            skillDict[skillName] = skillDict[skillId];

            let newName = ''
            const skillRegex = /[^a-z|0-9|'|\s]/;
            for (const split of skillName.split(skillRegex)) {
                newName += split.trim() + ' ';
            }
            newName = newName.split('\'').join('').trim();
            skillDict[newName] = skillDict[skillId];
        }
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

// Read stage data from stage_table and individual stage files
// Stores data in stageDict[stage] = {excel, levels}
//      excel = /excel/stage_table.json
//          Contains name, code, description, sanity, drops
//      levels = /levels/{levelId}.json
//          Contains layout, pathing, enemy types, enemy waves
// Unique stage key is name (Collapse)
// Additional key is code (0-1), note: annihalation stages don't have codes
// stageId and levelId are inconsistent between chapters, do not use!
// TODO: add roguelike, sss, anything not stored in stage_table.json
function initStages() {
    const stageTable: { [key: string]: any } = require(`${dataPath}/excel/stage_table.json`);
    const stages: { [key: string]: StageInfo } = stageTable.stages;

    for (const excel of Object.values(stages)) {
        try {
            // Skip story and 'guide' levels (whatever those are)
            if (!excel.isStoryOnly && excel.stageType != 'GUIDE') {
                const levelId = excel.levelId.toLowerCase();
                const name = excel.name.toLowerCase();

                // Initialize key if it doesn't exist
                if (!stageDict.hasOwnProperty(name)) {
                    stageDict[name] = { normal: null, challenge: null };
                }

                if (excel.diffGroup === 'TOUGH' || excel.difficulty === 'FOUR_STAR') {
                    const levels: StageData = require(`${dataPath}/levels/${levelId}.json`);
                    stageDict[name].challenge = { excel: excel, levels: levels };
                } else if (excel.difficulty === 'NORMAL') {
                    if (levelId.includes('easy_sub')) { // Not sure if easy levels are all that different, ignore for now
                        // const newId = levelId.split('easy_sub').join('sub');
                        // const levels = require(`../${dataPath}/levels/${newId}.json`);
                        // stageDict[name].normal = { excel: excel, levels: levels };
                    } else if (levelId.includes('easy')) {
                        // const newId = levelId.split('easy').join('main');
                        // const levels = require(`../${dataPath}/levels/${newId}.json`);
                        // stageDict[name].normal = { excel: excel, levels: levels };
                    } else {
                        const levels = require(`${dataPath}/levels/${levelId}.json`);
                        stageDict[name].normal = { excel: excel, levels: levels };
                    }
                }
                if (excel.code != null && !(excel.levelId.includes('camp'))) {
                    stageDict[excel.code.toLowerCase()] = stageDict[name];
                }
            }
        } catch (e) {
            console.log(e);
        }
    }
}