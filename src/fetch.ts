const { gameConsts, paths } = require('./constants');

import { Base, BaseInfo, CCStage, Definition, Enemy, Item, ManufactFormula, Module, Operator, Paradox, ParadoxInfo, Range, RogueTheme, RogueRelic, RogueStage, RogueStageInfo, RogueVariation, Skill, Skin, Stage, StageData, StageInfo, WorkshopFormula } from "./types";

const archetypeDict: { [key: string]: string } = {};        // Archetype id -> archetype name
const baseDict: { [key: string]: Base } = {};               // Base skill id -> Base object
const ccDict: { [key: string]: CCStage } = {};              // CC stage name -> CCStage object
const definitionDict: { [key: string]: Definition } = {};   // Term name -> Definition object
const enemyDict: { [key: string]: Enemy } = {};             // Enemy id/name/code -> Enemy object
const itemDict: { [key: string]: Item } = {};               // Item id/name -> Item object
const moduleDict: { [key: string]: Module } = {};           // Module id -> Module object
const operatorDict: { [key: string]: Operator } = {};       // Operator id/name -> Operator object
const paradoxDict: { [key: string]: Paradox } = {};         // Operator id -> Paradox object
const rangeDict: { [key: string]: Range } = {};             // Range id -> Range object
const rogueThemeArr: RogueTheme[] = [];                     // IS theme array (0=IS2, 1=IS3)
const skillDict: { [key: string]: Skill } = {};             // Skill id -> Skill object
const skinDict: { [key: string]: Skin[] } = {};             // Operator id -> Skin object array
const stageDict: { [key: string]: Stage[] } = {};           // Stage id/code -> Stage object array
const toughStageDict: { [key: string]: Stage[] } = {};      // Stage code -> Stage object array

module.exports = {
    initializeAll() {
        initArchetypes();
        initBases();
        initCC();
        initDefinitions();
        initEnemies();
        initItems();
        initModules();
        initParadoxes();
        initRanges();
        initRogueThemes();
        initSkills();
        initSkins();
        initStages();
        initOperators(); // Ops depend on skills and other stuff, initialize last
    },
    archetypes() {
        return archetypeDict;
    },
    bases() {
        return baseDict;
    },
    cc() {
        return ccDict;
    },
    definitions() {
        return definitionDict;
    },
    enemies() {
        return enemyDict;
    },
    items() {
        return itemDict;
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
    type SubProf = {
        subProfessionId: string;
        subProfessionName: string;
        subProfessionCatagory: number;
    };

    const moduleTable: { [key: string]: any } = require(`${paths.data}/excel/uniequip_table.json`);
    const subProfDict: { [key: string]: SubProf } = moduleTable.subProfDict;

    for (const subProf of Object.values(subProfDict)) {
        archetypeDict[subProf.subProfessionId] = subProf.subProfessionName;
    }
}

function initBases() {
    const buildingData: { [key: string]: any } = require(`${paths.data}/excel/building_data.json`);
    const buffs: { [key: string]: Base } = buildingData.buffs;

    for (const buff of Object.values(buffs)) {
        baseDict[buff.buffId] = buff;
    }
}

function initCC() {
    const ccStages: CCStage['const'][] = gameConsts.ccStages;

    for (const stage of ccStages) {
        const levels: StageData = require(`${paths.data}/levels/obt/rune/${stage.code}.json`);
        ccDict[stage.name.toLowerCase()] = { const: stage, levels: levels };
    }
}

function initDefinitions() {
    const gamedatagameConsts = require(`${paths.data}/excel/gamedata_const.json`);
    const termDescriptionDict: { [key: string]: Definition } = gamedatagameConsts.termDescriptionDict;

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
    // Additional keys are name (originium slug) and enemyIndex (b1)

    const enemyHandbook: { [key: string]: Enemy['excel'] } = require(`${paths.data}/excel/enemy_handbook_table.json`);
    const enemyDatabase: { [key: string]: Enemy['levels'][] } = require(`${paths.data}/levels/enemydata/enemy_database.json`);
    const enemies = enemyDatabase.enemies;

    for (const excel of Object.values(enemyHandbook)) {
        for (const levels of enemies) {
            if (levels.Key !== excel.enemyId) continue; // Brute force matches

            const enemyId = excel.enemyId.toLowerCase();

            enemyDict[enemyId] = { excel: excel, levels: levels }; // Unique identifier
            enemyDict[excel.name.toLowerCase()] = enemyDict[enemyId]; // Name
            enemyDict[excel.name.split('\'').join('').toLowerCase()] = enemyDict[enemyId]; // Name without apostrophes
            enemyDict[excel.enemyIndex.toLowerCase()] = enemyDict[enemyId]; // In-game code

            break;
        }
    }
}

function initItems() {
    const itemTable: { [key: string]: any } = require(`${paths.data}/excel/item_table.json`);
    const buildingData: { [key: string]: any } = require(`${paths.data}/excel/building_data.json`);
    const items: { [key: string]: Item['data'] } = itemTable.items;
    const manufactFormulas: { [key: string]: ManufactFormula } = buildingData.manufactFormulas; // Factory formulas
    const workshopFormulas: { [key: string]: WorkshopFormula } = buildingData.workshopFormulas; // Workshop formulas

    for (const data of Object.values(items)) {
        let formula: ManufactFormula | WorkshopFormula = null;
        if (data.buildingProductList.length > 0) {
            // Factory and workshop formulas can have same id, need to check item craft type
            if (data.buildingProductList[0].roomType === 'MANUFACTURE') {
                formula = manufactFormulas[data.buildingProductList[0].formulaId];
            }
            else if (data.buildingProductList[0].roomType === 'WORKSHOP') {
                formula = workshopFormulas[data.buildingProductList[0].formulaId];
            }
        }

        itemDict[data.itemId] = { data: data, formula: formula }; // Unique identifier
        itemDict[data.name.toLowerCase()] = itemDict[data.itemId]; // Name
        itemDict[data.name.toLowerCase().split('\'').join('')] = itemDict[data.itemId]; // Name without apostrophes
    }
}

function initModules() {
    const moduleTable: { [key: string]: any } = require(`${paths.data}/excel/uniequip_table.json`);
    const equipDict: { [key: string]: Module['info'] } = moduleTable.equipDict;
    const battleDict: { [key: string]: Module['data'] } = require(`${paths.data}/excel/battle_equip_table.json`);

    for (const module of Object.values(equipDict)) {
        const moduleId = module.uniEquipId.toLowerCase();
        moduleDict[moduleId] = { info: module, data: battleDict[moduleId] };
    }
}

function initOperators() {
    const buildingData: { [key: string]: any } = require(`${paths.data}/excel/building_data.json`);
    const operatorTable: { [key: string]: Operator['data'] } = require(`${paths.data}/excel/character_table.json`);
    const moduleTable: { [key: string]: any } = require(`${paths.data}/excel/uniequip_table.json`);
    const patchTable: { [key: string]: any } = require(`${paths.data}/excel/char_patch_table.json`);
    const charBaseBuffs: { [key: string]: any } = buildingData.chars; // Base skills
    const charEquip: { [key: string]: string[] } = moduleTable.charEquip; // Modules
    const patchChars: { [key: string]: Operator['data'] } = patchTable.patchChars; // Guard amiya

    // All ops except guard amiya
    for (const opId of Object.keys(operatorTable)) {
        const opData = operatorTable[opId];
        const opName = opData.name.toLowerCase();
        const opModules = charEquip.hasOwnProperty(opId) ? charEquip[opId] : [];
        const opBases: BaseInfo[] = [];

        if (opData.tagList === null) continue; // Summons and deployables dont have tags, skip them

        if (charBaseBuffs.hasOwnProperty(opId)) {
            for (const buff of charBaseBuffs[opId].buffChar) {
                for (const baseData of buff.buffData) {
                    opBases.push(baseData);
                }
            }
        }

        const positionId = gameConsts.tagValues[opData.position.toLowerCase()];
        const classId = gameConsts.tagValues[gameConsts.professions[opData.profession].toLowerCase()];
        let tagId = 1;
        for (const tag of opData.tagList) {
            tagId *= gameConsts.tagValues[tag.toLowerCase()];
        }
        // Robot is not explicitly defined as a tag, infer from operator description instead
        if (opData.itemDesc !== null && opData.itemDesc.includes('robot')) {
            tagId *= gameConsts.tagValues['robot'];
        }
        const recruitId = positionId * classId * tagId;

        operatorDict[opId] = { id: opId, recruitId: recruitId, modules: opModules, bases: opBases, data: opData }; // Unique identifier
        operatorDict[opName] = operatorDict[opId]; // Name
        operatorDict[opName.split('\'').join('')] = operatorDict[opId]; // Name without apostrophes
    }

    // Guard amiya
    for (const opId of Object.keys(patchChars)) {
        if (opId !== 'char_1001_amiya2') continue; // Just in case someone else is added here and messes stuff up

        const opData = patchChars[opId];
        const opModules = charEquip.hasOwnProperty(opId) ? charEquip[opId] : [];
        const opBases: BaseInfo[] = [];

        if (opData.tagList === null) continue;

        if (charBaseBuffs.hasOwnProperty(opId)) {
            for (const buff of charBaseBuffs[opId].buffChar) {
                for (const baseData of buff.buffData) {
                    opBases.push(baseData);
                }
            }
        }

        const positionId = gameConsts.tagValues[opData.position.toLowerCase()];
        const classId = gameConsts.tagValues[gameConsts.professions[opData.profession].toLowerCase()];
        let tagId = 1;
        for (const tag of opData.tagList) {
            tagId *= gameConsts.tagValues[tag.toLowerCase()];
        }
        if (opData.itemDesc !== null && opData.itemDesc.includes('robot')) {
            tagId *= gameConsts.tagValues['robot'];
        }
        const recruitId = positionId * classId * tagId;

        operatorDict[opId] = { id: opId, recruitId: recruitId, modules: opModules, bases: opBases, data: opData }; // Unique identifier
        operatorDict['amiya guard'] = operatorDict[opId]; // Names
        operatorDict['guard amiya'] = operatorDict[opId];
    }

    // Hardcoded names for funny ops
    operatorDict['mlynar'] = operatorDict['młynar'];
    operatorDict['pozemka'] = operatorDict['pozëmka'];
}

function initParadoxes() {
    const handbookTable: { [key: string]: any } = require(`${paths.data}/excel/handbook_info_table.json`);
    const stages: { [key: string]: ParadoxInfo } = handbookTable.handbookStageData;

    for (const excel of Object.values(stages)) {
        const levelId = excel.levelId.toLowerCase();
        const levels: StageData = require(`${paths.data}/levels/${levelId}.json`);
        paradoxDict[excel.charId] = { excel: excel, levels: levels };
    }
}

function initRanges() {
    const rangeTable: { [key: string]: Range } = require(`${paths.data}/excel/range_table.json`);

    for (const range of Object.values(rangeTable)) {
        rangeDict[range.id.toLowerCase()] = range;
    }
}

function initRogueThemes() {
    const rogueTable: { [key: string]: any } = require(`${paths.data}/excel/roguelike_topic_table.json`);
    const rogueDetails: { [key: string]: any } = rogueTable.details;
    const rogueTopics: { [key: string]: any } = rogueTable.topics;

    for (let i = 0; i < Object.keys(rogueDetails).length; i++) {
        const rogueName = Object.values(rogueTopics)[i].name;
        const rogueTheme = Object.values(rogueDetails)[i];
        const rogueStages: { [key: string]: RogueStageInfo } = rogueTheme.stages;
        const stageDict: { [key: string]: RogueStage } = {};
        const toughStageDict: { [key: string]: RogueStage } = {};
        const rogueRelics: { [key: string]: RogueRelic } = rogueTheme.items;
        const relicDict: { [key: string]: RogueRelic } = {};
        const rogueVariations: { [key: string]: RogueVariation } = rogueTheme.variationData; // Variations are floor effects
        const variationDict: { [key: string]: RogueVariation } = {};

        for (const excel of Object.values(rogueStages)) {
            const levelId = excel.levelId.toLowerCase();
            const stageName = excel.name.toLowerCase();

            if (excel.difficulty === 'FOUR_STAR') {
                const levels: StageData = require(`${paths.data}/levels/${levelId}.json`);
                toughStageDict[stageName] = { excel: excel, levels: levels };
            }
            else if (excel.difficulty === 'NORMAL') {
                const levels = require(`${paths.data}/levels/${levelId}.json`);
                stageDict[stageName] = { excel: excel, levels: levels };
            }
        }

        for (const relic of Object.values(rogueRelics)) {
            if (relic.type === 'BAND' || relic.type == 'CAPSULE') continue; // Bands are squads, capsules are IS2 plays, skip these
            const relicName = relic.name.toLowerCase();
            relicDict[relicName] = relic;
        }

        for (const variation of Object.values(rogueVariations)) {
            variationDict[variation.outerName.toLowerCase()] = variation;
        }

        rogueThemeArr[i] = { name: rogueName, stageDict: stageDict, toughStageDict: toughStageDict, relicDict: relicDict, variationDict: variationDict };
    }
}

function initSkills() {
    const skillTable: { [key: string]: Skill } = require(`${paths.data}/excel/skill_table.json`);

    for (const skill of Object.values(skillTable)) {
        const skillId = skill.skillId.toLowerCase();
        skillDict[skillId] = skill;
    }
}

function initSkins() {
    const skinTable: { [key: string]: any } = require(`${paths.data}/excel/skin_table.json`);
    const charSkins: { [key: string]: Skin } = skinTable.charSkins;

    for (const skin of Object.values(charSkins)) {
        const opId = skin.charId;
        if (!skinDict.hasOwnProperty(opId)) {
            skinDict[opId] = []; // Create an empty array if it's the first skin for that op
        }
        skinDict[opId].push(skin);
    }
}

function initStages() {
    const stageTable: { [key: string]: any } = require(`${paths.data}/excel/stage_table.json`);
    const stages: { [key: string]: StageInfo } = stageTable.stages;

    for (const excel of Object.values(stages)) {
        if (excel.isStoryOnly || excel.stageType === 'GUIDE') continue; // Skip story and cutscene levels

        // Il Siracusano (act21side) levels have _m and _t variants
        // _t variants have their own level file in a separate 'mission' folder, but _m variants share data with normal levels
        // Check for if level is a _m variant, if so get the right level file
        const levelRegex = /\S+_m$/;
        let levelId = excel.levelId.toLowerCase();
        if (levelId.match(levelRegex)) {
            levelId = levelId.substring(0, excel.levelId.length - 2).split('mission/').join('');
        }

        // Skip easy levels cause no one cares, basically the same as normal anyways
        if (levelId.includes('easy_sub') || levelId.includes('easy')) continue;
        // This file is broken for whatever reason, gotta wait for a fix from gamedata repo
        if (levelId === 'activities/act4d0/level_act4d0_05') continue;

        const code = excel.code.toLowerCase();

        if (excel.diffGroup === 'TOUGH' || excel.difficulty === 'FOUR_STAR') {
            if (!toughStageDict.hasOwnProperty(code)) {
                toughStageDict[code] = [];
            }

            const levels: StageData = require(`${paths.data}/levels/${levelId}.json`);
            const stage: Stage = { excel: excel, levels: levels };

            toughStageDict[code].push(stage); // Stage code
        }
        else if (excel.difficulty === 'NORMAL') {
            if (!stageDict.hasOwnProperty(code)) {
                stageDict[code] = []; // Multiple stages can have the same code, so each code maps to an array
            }

            const levels = require(`${paths.data}/levels/${levelId}.json`);
            const stage: Stage = { excel: excel, levels: levels };

            stageDict[excel.stageId] = [stage]; // Unique identifier
            stageDict[code].push(stage); // Stage code
        }
    }
}