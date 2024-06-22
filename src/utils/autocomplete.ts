import * as T from "hella-types";
import * as api from "./api";
const { gameConsts } = require('../constants');

type AutocompleteParams = {
    query: string;
    include?: string[];
};
const limit = 6;
const splitMatch = (str: string, query: string) => str.toLowerCase().includes(query.toLowerCase()) || str.toLowerCase().split('\'').join('').includes(query.toLowerCase());

export async function autocompleteCc(query: string, callback: (e: T.CCStage['const']) => boolean = () => true) {
    const matchQuery = (stage: T.CCStage['const']) => splitMatch(stage.name, query) || splitMatch(stage.location, query) || splitMatch(stage.levelId.split('/')[2], query);

    const filteredArr: T.CCStage['const'][] = [];
    const ccStages: T.CCStage['const'][] = gameConsts.ccStages;
    let i = 0;
    for (const stage of ccStages) {
        if (i >= limit) break;
        if (filteredArr.includes(stage) || !matchQuery(stage) || !callback(stage)) continue;
        filteredArr.push(stage);
        i++;
    }

    const mappedArr = filteredArr.map(stage => ({ name: `${stage.location} - ${stage.name}`, value: stage.levelId.split('/')[stage.levelId.split('/').length - 1] }));

    return mappedArr;
}
export async function autocompleteCcb(query: string, callback: (e: T.CCStage['const']) => boolean = () => true) {
    const matchQuery = (stage: T.CCStage['const']) => splitMatch(stage.name, query) || splitMatch(stage.location, query) || splitMatch(stage.levelId.split('/')[2], query);

    const filteredArr: T.CCStage['const'][] = [];
    const ccbStages: T.CCStage['const'][] = gameConsts.ccbStages;
    let i = 0;
    for (const stage of ccbStages) {
        if (i >= limit) break;
        if (filteredArr.includes(stage) || !matchQuery(stage) || !callback(stage)) continue;
        filteredArr.push(stage);
        i++;
    }

    const mappedArr = filteredArr.map(stage => ({ name: `${stage.location} - ${stage.name}`, value: stage.levelId.split('/')[stage.levelId.split('/').length - 1] }));

    return mappedArr;
}
export async function autocompleteDefine({ query, include = [] }: AutocompleteParams, callback: (e: T.Definition) => boolean = () => true) {
    const requiredInclude = ['termName', 'termId'];

    const definitionArr = await api.match('define', { query, include: requiredInclude.concat(include) })
    const filteredArr: T.Definition[] = [];
    let i = 0;
    for (const define of definitionArr) {
        if (i >= limit) break;
        if (filteredArr.includes(define) || !callback(define)) continue;
        filteredArr.push(define);
        i++;
    }
    const mappedArr = filteredArr.slice(0, limit).map(define => ({ name: define.termName, value: define.termId }));

    return mappedArr;
}
export async function autocompleteEnemy({ query, include = [] }: AutocompleteParams, callback: (e: T.Enemy) => boolean = () => true) {
    const requiredInclude = ['excel.name', 'excel.enemyIndex', 'excel.enemyId'];

    const enemyArr = await api.match('enemy', { query, include: requiredInclude.concat(include) });
    const filteredArr: T.Enemy[] = [];
    let i = 0;
    for (const enemy of enemyArr) {
        if (i >= limit) break;
        if (filteredArr.includes(enemy) || !callback(enemy)) continue;
        filteredArr.push(enemy);
        i++;
    }
    const mappedArr = filteredArr.map(enemy => ({ name: `${enemy.excel.enemyIndex} - ${enemy.excel.name}`, value: enemy.excel.enemyId }));

    return mappedArr;
}
export async function autocompleteRogueRelic(theme: number, { query, include = [] }: AutocompleteParams, callback: (e: T.RogueRelic) => boolean = () => true) {
    const matchQuery = (relic: T.RogueRelic) => splitMatch(relic.name, query);
    const requiredInclude = ['relicDict'];

    const rogueTheme = await api.single('rogue', { query: theme.toString(), include: requiredInclude.concat(include) });
    const filteredArr: T.RogueRelic[] = [];
    let i = 0;
    for (const relic of Object.values(rogueTheme.relicDict)) {
        if (i >= limit) break;
        if (filteredArr.includes(relic) || !matchQuery(relic) || !callback(relic)) continue;
        filteredArr.push(relic);
        i++;
    }
    const mappedArr = filteredArr.map(relic => ({ name: relic.name, value: relic.name }));

    return mappedArr;
}
export async function autocompleteRogueStage(theme: number, { query, include = [] }: AutocompleteParams, callback: (e: T.RogueStage) => boolean = () => true) {
    const requiredInclude = ['excel.id', 'excel.code', 'excel.name'];

    const stageArr = await api.matchRogueStage(theme, { query, include: requiredInclude.concat(include) });
    const filteredArr: T.RogueStage[] = [];
    let i = 0;
    for (const stage of stageArr) {
        if (i >= limit) break;
        if (filteredArr.some(s => s.excel.id === stage.excel.id) || !callback(stage)) continue;
        filteredArr.push(stage);
        i++;
    }
    const mappedArr = filteredArr.map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.name }));

    return mappedArr;
}
export async function autocompleteRogueToughStage(theme: number, { query, include = [] }: AutocompleteParams, callback: (e: T.RogueStage) => boolean = () => true) {
    const requiredInclude = ['excel.id', 'excel.code', 'excel.name'];

    const stageArr = await api.matchRogueToughStage(theme, { query, include: requiredInclude.concat(include) });
    const filteredArr: T.RogueStage[] = [];
    let i = 0;
    for (const stage of stageArr) {
        if (i >= limit) break;
        if (filteredArr.some(s => s.excel.id === stage.excel.id) || !callback(stage)) continue;
        filteredArr.push(stage);
        i++;
    }
    const mappedArr = filteredArr.map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.name }));

    return mappedArr;
}
export async function autocompleteRogueVariation(theme: number, { query, include = [] }: AutocompleteParams, callback: (e: T.RogueVariation) => boolean = () => true) {
    const matchQuery = (variation: T.RogueVariation) => splitMatch(variation.outerName, query);
    const requiredInclude = ['variationDict'];

    const rogueTheme = await api.single('rogue', { query: theme.toString(), include: requiredInclude.concat(include) });
    const filteredArr: T.RogueVariation[] = [];
    let i = 0;
    for (const variation of Object.values(rogueTheme.variationDict)) {
        if (i >= limit) break;
        if (filteredArr.includes(variation) || !matchQuery(variation) || !callback(variation)) continue;
        filteredArr.push(variation);
        i++;
    }
    const mappedArr = filteredArr.map(variation => ({ name: variation.outerName, value: variation.outerName }));

    return mappedArr;
}
export async function autocompleteSandboxStage(act: number, { query, include = [] }: AutocompleteParams, callback: (e: T.SandboxStage) => boolean = () => true) {
    const matchQuery = (stage: T.SandboxStage) => splitMatch(stage.excel.name, query) || splitMatch(stage.excel.code, query);
    const requiredInclude = ['stageDict'];

    const sandboxAct = await api.single('sandbox', { query: act.toString(), include: requiredInclude.concat(include) });
    const filteredArr: T.SandboxStage[] = [];
    let i = 0;
    for (const stage of Object.values(sandboxAct.stageDict)) {
        if (i >= limit) break;
        if (filteredArr.some(s => s.excel.name === stage.excel.name) || !matchQuery(stage) || !callback(stage)) continue;
        filteredArr.push(stage);
        i++;
    }
    const mappedArr = filteredArr.map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.name }));

    return mappedArr;
}
export async function autocompleteSkin(op: T.Operator, { query, include = [] }: AutocompleteParams, callback: (e: T.Skin) => boolean = () => true) {
    const matchQuery = (skin: T.Skin) => splitMatch(skin.displaySkin.skinName ?? 'default', query);
    const requiredInclude = ['displaySkin.skinName', 'skinId'];

    const skinArr = await api.search('skin', { search: { 'charId': op.id }, include: requiredInclude.concat(include) });
    if (!skinArr || skinArr.length === 0) return [];
    const filteredArr: T.Skin[] = [];
    let i = 0;
    for (const skin of skinArr) {
        if (i >= limit) break;
        if (filteredArr.some(s => s.displaySkin.skinName === skin.displaySkin.skinName) || !matchQuery(skin) || !callback(skin)) continue;
        filteredArr.push(skin);
        i++;
    }
    const mappedArr = filteredArr.map(skin => ({
        name: skin.displaySkin.skinName ?? 'Default',
        value: skin.displaySkin.skinName ? skin.skinId.split('@').join('_') : 'default'
    }));

    return mappedArr;
}
export async function autocompleteItem({ query, include = [] }: AutocompleteParams, callback: (e: T.Item) => boolean = () => true) {
    const requiredInclude = ['data.name', 'data.itemId'];

    const itemArr = await api.match('item', { query, include: requiredInclude.concat(include) });
    const filteredArr: T.Item[] = [];
    let i = 0;
    for (const item of itemArr) {
        if (i >= limit) break;
        if (filteredArr.includes(item) || !callback(item)) continue;
        filteredArr.push(item);
        i++;
    }
    const mappedArr = filteredArr.map(item => ({ name: item.data.name, value: item.data.itemId }));

    return mappedArr;
}
export async function autocompleteOperator({ query, include = [] }: AutocompleteParams, callback: (e: T.Operator) => Boolean = () => true) {
    const requiredInclude = ['id', 'data.name'];

    const operatorArr = await api.match('operator', { query, include: requiredInclude.concat(include) });
    const filteredArr: T.Operator[] = [];
    let i = 0;
    for (const op of operatorArr) {
        if (i >= limit) break;
        if (filteredArr.includes(op) || !callback(op)) continue;
        filteredArr.push(op);
        i++;
    }
    const mappedArr = filteredArr.map(op => ({ name: op.data.name, value: op.id }));

    return mappedArr;
}
export async function autocompleteStage({ query, include = [] }: AutocompleteParams, callback: (e: T.Stage) => boolean = () => true) {
    const requiredInclude = ['excel.name', 'excel.code', 'excel.stageId'];

    const stageArrArr = await api.match('stage', { query, include: requiredInclude.concat(include) });
    const filteredArr: T.Stage[] = [];
    let i = 0;
    for (const stageArr of stageArrArr) {
        for (const stage of stageArr) {
            if (i >= limit) break;
            if (filteredArr.some(s => s.excel.stageId === stage.excel.stageId) || !callback(stage)) continue;
            filteredArr.push(stage);
            i++;
        }
    }
    const mappedArr = filteredArr.map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.stageId }));

    return mappedArr;
}
export async function autocompleteToughStage({ query, include = [] }: AutocompleteParams, callback: (e: T.Stage) => boolean = () => true) {
    const requiredInclude = ['excel.name', 'excel.code', 'excel.stageId'];

    const stageArrArr = await api.match('stage', { query, include: requiredInclude.concat(include) });
    const filteredArr: T.Stage[] = [];
    let i = 0;
    for (const stageArr of stageArrArr) {
        for (const stage of stageArr) {
            if (i >= limit) break;
            if (filteredArr.some(s => s.excel.stageId === stage.excel.stageId) || !callback(stage)) continue;
            filteredArr.push(stage);
            i++;
        }
    }
    const mappedArr = filteredArr.map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.stageId }));

    return mappedArr;
}