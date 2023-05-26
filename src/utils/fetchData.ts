const { dataPath } = require('../../paths.json');

import { Base, BaseInfo, Enemy, Module, Operator, Paradox, ParadoxInfo, Range, RogueStage, RogueStageInfo, Skill, Skin, Stage, StageData, StageInfo } from "./types";

const archetypeDict: { [key: string]: string } = {};
const baseDict: { [key: string]: Base } = {};
const enemyDict: { [key: string]: Enemy } = {};
const moduleDict: { [key: string]: Module } = {};
const operatorDict: { [key: string]: Operator } = {};
const paradoxDict: { [key: string]: Paradox } = {};
const rangeDict: { [key: string]: Range } = {};
const rogue1StageDict: { [key: string]: RogueStage[] } = {};
const rogue2StageDict: { [key: string]: RogueStage[] } = {};
const skillDict: { [key: string]: Skill } = {};
const skinDict: { [key: string]: Skin[] } = {};
const stageDict: { [key: string]: Stage[] } = {};
const toughStageDict: { [key: string]: Stage[] } = {};
const toughRogue1StageDict: { [key: string]: RogueStage[] } = {};
const toughRogue2StageDict: { [key: string]: RogueStage[] } = {};

const tagValues: { [key: string]: number } = { // prime number method for shits and giggles
    starter: 2,
    'senior operator': 3,
    'top operator': 5,
    melee: 7,
    ranged: 11,
    guard: 13,
    medic: 17,
    vanguard: 19,
    caster: 23,
    sniper: 29,
    defender: 31,
    supporter: 37,
    specialist: 41,
    healing: 43,
    support: 47,
    dps: 53,
    aoe: 59,
    slow: 61,
    survival: 67,
    defense: 71,
    debuff: 73,
    shift: 79,
    'crowd control': 83,
    nuker: 89,
    summon: 97,
    'fast-redeploy': 101,
    'dp-recovery': 103,
    robot: 107
};
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

type SubProf = {
    subProfessionId: string;
    subProfessionName: string;
    subProfessionCatagory: number;
}

module.exports = {
    initializeAll() {
        initArchetypes();
        initBases();
        initEnemies();
        initModules();
        initParadoxes();
        initRanges();
        initSkills();
        initSkins();
        initRogueStages();
        initStages();

        initOperators();
    },
    fetchArchetypes() {
        return archetypeDict;
    },
    fetchBases() {
        return baseDict;
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
    fetchParadoxes() {
        return paradoxDict;
    },
    fetchRanges() {
        return rangeDict;
    },
    fetchRogue1Stages() {
        return rogue1StageDict;
    },
    fetchRogue2Stages() {
        return rogue2StageDict;
    },
    fetchSkills() {
        return skillDict;
    },
    fetchSkins() {
        return skinDict;
    },
    fetchStages() {
        return stageDict;
    },
    fetchToughRogue1Stages() {
        return toughRogue1StageDict;
    },
    fetchToughRogue2Stages() {
        return toughRogue2StageDict;
    },
    fetchToughStages() {
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
        let tagId = 1;
        for (const tag of opData.tagList) {
            tagId *= tagValues[tag.toLowerCase()];
        }
        const classId = tagValues[professions[opData.profession].toLowerCase()];

        const recruitId = positionId * tagId * classId;

        operatorDict[opId] = { id: opId, recruitId: recruitId, modules: opModules, bases: opBases, data: opData };

        if (operatorDict.hasOwnProperty(opName)) continue;

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
            console.log(e);
        }
    }
}

function initRanges() {
    const rangeTable: { [key: string]: Range } = require(`${dataPath}/excel/range_table.json`);

    for (const range of Object.values(rangeTable)) {
        rangeDict[range.id.toLowerCase()] = range;
    }
}

function initRogueStages() {
    const rogueTable: { [key: string]: any } = require(`${dataPath}/excel/roguelike_topic_table.json`);
    const rogueDetails: { [key: string]: any } = rogueTable.details;

    const rogue1Stages: { [key: string]: RogueStageInfo } = rogueDetails.rogue_1.stages;
    for (const excel of Object.values(rogue1Stages)) {
        try {
            const levelId = excel.levelId.toLowerCase();
            const name = excel.name.toLowerCase();

            if (excel.difficulty === 'FOUR_STAR') {
                if (!toughRogue1StageDict.hasOwnProperty(name)) {
                    toughRogue1StageDict[name] = [];
                }

                const levels: StageData = require(`${dataPath}/levels/${levelId}.json`);
                const stage: RogueStage = { excel: excel, levels: levels };

                toughRogue1StageDict[name].push(stage);
            } else if (excel.difficulty === 'NORMAL') {
                if (!rogue1StageDict.hasOwnProperty(name)) {
                    rogue1StageDict[name] = [];
                }

                const levels = require(`${dataPath}/levels/${levelId}.json`);
                const stage: RogueStage = { excel: excel, levels: levels };

                rogue1StageDict[name].push(stage);
            }
        } catch (e) {
            console.log(e);
        }
    }

    const rogue2Stages: { [key: string]: RogueStageInfo } = rogueDetails.rogue_2.stages;
    for (const excel of Object.values(rogue2Stages)) {
        try {
            const levelId = excel.levelId.toLowerCase();
            const name = excel.name.toLowerCase();

            if (excel.difficulty === 'FOUR_STAR') {
                if (!toughRogue2StageDict.hasOwnProperty(name)) {
                    toughRogue2StageDict[name] = [];
                }

                const levels: StageData = require(`${dataPath}/levels/${levelId}.json`);
                const stage: RogueStage = { excel: excel, levels: levels };

                toughRogue2StageDict[name].push(stage);
            } else if (excel.difficulty === 'NORMAL') {
                if (!rogue2StageDict.hasOwnProperty(name)) {
                    rogue2StageDict[name] = [];
                }

                const levels = require(`${dataPath}/levels/${levelId}.json`);
                const stage: RogueStage = { excel: excel, levels: levels };

                rogue2StageDict[name].push(stage);
            }
        } catch (e) {
            console.log(e);
        }
    }
}

function initSkills() {
    const skillTable: { [key: string]: Skill } = require(`${dataPath}/excel/skill_table.json`);

    for (const skill of Object.values(skillTable)) {
        const skillId = skill.skillId.toLowerCase();
        const skillName = skill.levels[0].name.toLowerCase();

        skillDict[skillId] = skill;

        if (skillDict.hasOwnProperty(skillName)) continue;

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
            } else if (excel.difficulty === 'NORMAL') {
                if (!stageDict.hasOwnProperty(code)) {
                    stageDict[code] = [];
                }

                const levels = require(`${dataPath}/levels/${levelId}.json`);
                const stage: Stage = { excel: excel, levels: levels };

                stageDict[code].push(stage);
            }
        } catch (e) {
            console.log(e);
        }
    }
}