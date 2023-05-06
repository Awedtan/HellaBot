const { dataPath } = require('../config.json');
const enemyHandbook = require(`../${dataPath}/excel/enemy_handbook_table.json`);
const { enemies } = require(`../${dataPath}/levels/enemydata/enemy_database.json`);
const { stages } = require(`../${dataPath}/excel/stage_table.json`);

const enemyDict = {};
const stageDict = {};

module.exports = {
    initEnemies() {
        for (const enemy of Object.values(enemyHandbook)) {
            for (const enemyData of enemies) {
                try {
                    if (enemyData.Key === enemy.enemyId) {
                        enemyDict[enemy.enemyIndex.toLowerCase()] = { enemy, enemyData };
                        enemyDict[enemy.name.toLowerCase()] = enemyDict[enemy.enemyIndex.toLowerCase()];
                        enemyDict[enemy.enemyId] = enemyDict[enemy.enemyIndex.toLowerCase()];
                    }
                } catch (e) {
                }
            }
        }
    },

    fetchEnemies() {
        return enemyDict;
    },

    initStages() {
        for (const stage of Object.values(stages)) {
            try {
                if (!stage.isStoryOnly) {
                    const levelId = stage.levelId;
                    if (!(stage.code.toLowerCase() in stageDict)) {
                        stageDict[stage.code.toLowerCase()] = { normal: {}, challenge: {} };
                    }
                    if (stage.difficulty === 'NORMAL') {
                        if (levelId.includes('easy_sub')) {
                            const newId = levelId.split('easy_sub').join('sub');
                            const stageData = require(`../${dataPath}/levels/${newId}.json`);
                            stageDict[stage.code.toLowerCase()].normal = { stage, stageData };
                        } else if (levelId.includes('easy')) {
                            const newId = levelId.split('easy').join('main');
                            const stageData = require(`../${dataPath}/levels/${newId}.json`);
                            stageDict[stage.code.toLowerCase()].normal = { stage, stageData };
                        } else {
                            const stageData = require(`../${dataPath}/levels/${levelId}.json`);
                            stageDict[stage.code.toLowerCase()].normal = { stage, stageData };
                        }
                    } else if (stage.difficulty === 'FOUR_STAR') {
                        if (levelId.includes('easy_sub')) {
                            const newId = levelId.split('easy_sub').join('sub');
                            const stageData = require(`../${dataPath}/levels/${newId}.json`);
                            stageDict[stage.code.toLowerCase()].challenge = { stage, stageData };
                        } else if (levelId.includes('easy')) {
                            const newId = levelId.split('easy').join('main');
                            const stageData = require(`../${dataPath}/levels/${newId}.json`);
                            stageDict[stage.code.toLowerCase()].challenge = { stage, stageData };
                        } else {
                            const stageData = require(`../${dataPath}/levels/${levelId}.json`);
                            stageDict[stage.code.toLowerCase()].challenge = { stage, stageData };
                        }
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