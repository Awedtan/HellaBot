const { dataPath } = require('../paths.json');
const enemyHandbook = require(`../${dataPath}/excel/enemy_handbook_table.json`);
const { enemies } = require(`../${dataPath}/levels/enemydata/enemy_database.json`);
const { stages } = require(`../${dataPath}/excel/stage_table.json`);

const enemyDict = {};
const stageDict = {};

module.exports = {
    // Brute force matches between enemy_handbook_table.json and enemy_database.json
    // Stores data in enemyDict[enemy] = {excel, levels}
    //      excel = /excel/enemy_handbook_table.json
    //      levels = /levels/enemydata/enemy_database.json
    // Unique enemy key is enemyId (enemy_1007_slime)
    // Additional keys are name (Originium Slug) and enemyIndex (B1)
    initEnemies() {
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
    },

    fetchEnemies() {
        return enemyDict;
    },

    // Read stage data from stage_table.json and individual stage files
    // Stores data in stageDict[stage] = {excel, levels}
    //      excel = /excel/stage_table.json
    //      levels = /levels/{levelId}.json
    // Unique stage key is name (Collapse)
    // Additional key is code (0-1), note: annihalation stages don't have codes
    // stageId and levelId are inconsistent between chapters, do not use!
    // TODO: add roguelike, sss, anything not stored in stage_table.json
    initStages() {
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
    },

    fetchStages() {
        return stageDict;
    }
}