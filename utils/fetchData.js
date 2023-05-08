const { dataPath } = require('../paths.json');

const enemyDict = {};
const operatorDict = {};
const rangeDict = {};
const skillDict = {};
const skinDict = {};
const stageDict = {};

module.exports = {
    initializeAll() {
        initEnemies();
        initStages();
        initRanges();
        initSkills();
        initSkins();
        initOperators();
    },
    fetchEnemies() {
        return enemyDict;
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
    },
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
    const enemyHandbook = require(`../${dataPath}/excel/enemy_handbook_table.json`);
    const { enemies } = require(`../${dataPath}/levels/enemydata/enemy_database.json`);

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

function initOperators() {
    const operatorTable = require(`../${dataPath}/excel/character_table.json`);

    for (const operator of Object.values(operatorTable)) {
        const operatorId = operator.potentialItemId.substring(2);
        operatorDict[operator.name.toLowerCase()] = { operatorData: operator, operatorId: operatorId };
    }
}

function initRanges() {
    const rangeTable = require(`../${dataPath}/excel/range_table.json`);

    for (const range of Object.values(rangeTable)) {
        rangeDict[range.id.toLowerCase()] = range;
    }
}

function initSkills() {
    const skillTable = require(`../${dataPath}/excel/skill_table.json`);

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
    const { charSkins } = require(`../${dataPath}/excel/skin_table.json`);

    for (const skin of Object.values(charSkins)) {
        try {
            if (skin.displaySkin.modelName === null) {
                return;
            }

            const modelName = skin.displaySkin.modelName.toLowerCase();

            if (skinDict[modelName] === undefined) {
                skinDict[modelName] = [];
            }

            skinDict[modelName].push(skin);
        } catch (e) {
            console.log(e);
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
    const { stages } = require(`../${dataPath}/excel/stage_table.json`);

    for (const excel of Object.values(stages)) {
        try {
            // Skip story and 'guide' levels (whatever those are)
            if (!excel.isStoryOnly && excel.stageType != 'GUIDE') {
                const levelId = excel.levelId.toLowerCase();
                const name = excel.name.toLowerCase();

                // Initialize key if it doesn't exist
                if (!stageDict.hasOwnProperty(name)) {
                    stageDict[name] = { normal: {}, challenge: {} };
                }

                if (excel.diffGroup === 'TOUGH' || excel.difficulty === 'FOUR_STAR') {
                    const levels = require(`../${dataPath}/levels/${levelId}.json`);
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
                        const levels = require(`../${dataPath}/levels/${levelId}.json`);
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