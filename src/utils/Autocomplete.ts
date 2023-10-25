import { CCStage, Definition, Enemy, Item, Operator, RogueRelic, RogueStage, RogueVariation, SandboxStage, Stage } from "../types";
import { SingleParams, getAllDefinitions, getAllEnemies, getAllItems, getAllOperators, getAllStageArrs, getAllToughStageArrs, getRogueTheme, getSandboxAct } from "./Api";
const { gameConsts } = require('../constants');

const limit = 6;

export async function ccAutocomplete(query: string, callback: (e: CCStage['const']) => boolean = () => true) {
    const matchQuery = (stage: CCStage['const']) => stage.name.toLowerCase().includes(query) || stage.location.toLowerCase().includes(query) || stage.levelId.split('/')[2].toLowerCase().includes(query);

    const arr: CCStage['const'][] = [];
    let i = 0;
    const ccStages: CCStage['const'][] = gameConsts.ccStages;
    for (const stage of ccStages) {
        if (i >= limit) break;
        if (arr.includes(stage) || !matchQuery(stage) || !callback(stage)) continue;
        arr.push(stage);
        i++;
    }

    const mappedArr = arr.map(stage => ({ name: `${stage.location} - ${stage.name}`, value: stage.levelId.split('/')[2] }));

    return mappedArr;
}

export async function defineAutocomplete({ query, include, exclude }: SingleParams, callback: (e: Definition) => boolean = () => true) {
    const arr: Definition[] = [];
    let i = 0;
    const definitionArr = await getAllDefinitions({ include, exclude });
    for (const define of definitionArr) {
        if (i >= limit) break;
        if (arr.includes(define) || !define.termName.toLowerCase().includes(query) || !callback(define)) continue;
        arr.push(define);
        i++;
    }
    const mappedArr = arr.slice(0, limit).map(define => ({ name: define.termName, value: define.termName }));

    return mappedArr;
}

export async function enemyAutocomplete({ query, include, exclude }: SingleParams, callback: (e: Enemy) => boolean = () => true) {
    const matchQuery = (enemy: Enemy) => enemy.excel.name.toLowerCase().includes(query) || enemy.excel.enemyIndex.toLowerCase().includes(query);

    const arr: Enemy[] = [];
    let i = 0;
    const enemyArr = await getAllEnemies({ include, exclude });
    for (const enemy of enemyArr) {
        if (i >= limit) break;
        if (arr.includes(enemy) || !matchQuery(enemy) || !callback(enemy)) continue;
        arr.push(enemy);
        i++;
    }
    const mappedArr = arr.map(enemy => ({ name: `${enemy.excel.enemyIndex} - ${enemy.excel.name}`, value: enemy.excel.enemyId }));

    return mappedArr;
}

export async function rogueRelicAutocomplete(theme: number, { query, include, exclude }: SingleParams, callback: (e: RogueRelic) => boolean = () => true) {
    const arr: RogueRelic[] = [];
    let i = 0;
    const rogueTheme = await getRogueTheme({ query: theme.toString(), include, exclude });
    for (const relic of Object.values(rogueTheme.relicDict)) {
        if (i >= limit) break;
        if (arr.includes(relic) || !relic.name.toLowerCase().includes(query) || !callback(relic)) continue;
        arr.push(relic);
        i++;
    }
    const mappedArr = arr.map(relic => ({ name: relic.name, value: relic.name }));

    return mappedArr;
}

export async function rogueStageAutocomplete(theme: number, { query, include, exclude }: SingleParams, callback: (e: RogueStage) => boolean = () => true) {
    const matchQuery = (stage: RogueStage) => stage.excel.name.toLowerCase().includes(query) || stage.excel.code.toLowerCase().includes(query);

    const arr: RogueStage[] = [];
    let i = 0;
    const rogueTheme = await getRogueTheme({ query: theme.toString(), include, exclude });
    for (const stage of Object.values(rogueTheme.stageDict)) {
        if (i >= limit) break;
        if (arr.some(s => s.excel.id === stage.excel.id) || !matchQuery(stage) || !callback(stage)) continue;
        arr.push(stage);
        i++;
    }
    const mappedArr = arr.map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.name }));

    return mappedArr;
}

export async function rogueToughStageAutocomplete(theme: number, { query, include, exclude }: SingleParams, callback: (e: RogueStage) => boolean = () => true) {
    const matchQuery = (stage: RogueStage) => stage.excel.name.toLowerCase().includes(query) || stage.excel.code.toLowerCase().includes(query);

    const arr: RogueStage[] = [];
    let i = 0;
    const rogueTheme = await getRogueTheme({ query: theme.toString(), include, exclude });
    for (const stage of Object.values(rogueTheme.toughStageDict)) {
        if (i >= limit) break;
        if (arr.some(s => s.excel.id === stage.excel.id) || !matchQuery(stage) || !callback(stage)) continue;
        arr.push(stage);
        i++;
    }
    const mappedArr = arr.map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.name }));

    return mappedArr;
}

export async function rogueVariationAutocomplete(theme: number, { query, include, exclude }: SingleParams, callback: (e: RogueVariation) => boolean = () => true) {
    const arr: RogueVariation[] = [];
    let i = 0;
    const rogueTheme = await getRogueTheme({ query: theme.toString(), include, exclude });
    for (const variation of Object.values(rogueTheme.variationDict)) {
        if (i >= limit) break;
        if (arr.includes(variation) || !variation.outerName.toLowerCase().includes(query) || !callback(variation)) continue;
        arr.push(variation);
        i++;
    }
    const mappedArr = arr.map(variation => ({ name: variation.outerName, value: variation.outerName }));

    return mappedArr;
}

export async function sandboxStageAutocomplete(act: number, { query, include, exclude }: SingleParams, callback: (e: SandboxStage) => boolean = () => true) {
    const matchQuery = (stage: SandboxStage) => stage.excel.name.toLowerCase().includes(query) || stage.excel.code.toLowerCase().includes(query);

    const arr: SandboxStage[] = [];
    let i = 0;
    const sandboxAct = await getSandboxAct({ query: act.toString(), include, exclude });
    for (const stage of Object.values(sandboxAct.stageDict)) {
        if (i >= limit) break;
        if (arr.some(s => s.excel.name === stage.excel.name) || !matchQuery(stage) || !callback(stage)) continue;
        arr.push(stage);
        i++;
    }
    const mappedArr = arr.map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.name }));

    return mappedArr;
}

export async function itemAutocomplete({ query, include, exclude }: SingleParams, callback: (e: Item) => boolean = () => true) {
    const arr: Item[] = [];
    let i = 0;
    const itemArr = await getAllItems({ include, exclude });
    for (const item of itemArr) {
        if (i >= limit) break;
        if (arr.includes(item) || !item.data.name.toLowerCase().includes(query) || !callback(item)) continue;
        arr.push(item);
        i++;
    }
    const mappedArr = arr.map(item => ({ name: item.data.name, value: item.data.name }));

    return mappedArr;
}

export async function operatorAutocomplete({ query, include, exclude }: SingleParams, callback: (e: Operator) => Boolean = () => true) {
    const arr: Operator[] = [];
    let i = 0;
    const operatorArr = await getAllOperators({ include, exclude });
    for (const op of operatorArr) {
        if (i >= limit) break;
        if (arr.includes(op) || !op.data.name.toLowerCase().includes(query) || !callback(op)) continue;
        arr.push(op);
        i++;
    }
    const mappedArr = arr.map(op => ({ name: op.data.name, value: op.data.name }));

    return mappedArr;
}

export async function stageAutocomplete({ query, include, exclude }: SingleParams, callback: (e: Stage) => boolean = () => true) {
    const matchQuery = (stage: Stage) => stage.excel.name.toLowerCase().includes(query) || stage.excel.code.toLowerCase().includes(query);

    const arr: Stage[] = [];
    let i = 0;
    const stageArrArr = await getAllStageArrs({ include, exclude });
    for (const stageArr of stageArrArr) {
        for (const stage of stageArr) {
            if (i >= limit) break;
            if (arr.some(s => s.excel.stageId === stage.excel.stageId) || !matchQuery(stage) || !callback(stage)) continue;
            arr.push(stage);
            i++;
        }
    }
    const mappedArr = arr.map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.stageId }));

    return mappedArr;
}

export async function toughStageAutocomplete({ query, include, exclude }: SingleParams, callback: (e: Stage) => boolean = () => true) {
    const matchQuery = (stage: Stage) => stage.excel.name.toLowerCase().includes(query) || stage.excel.code.toLowerCase().includes(query);

    const arr: Stage[] = [];
    let i = 0;
    const stageArrArr = await getAllToughStageArrs({ include, exclude });
    for (const stageArr of stageArrArr) {
        for (const stage of stageArr) {
            if (i >= limit) break;
            if (arr.some(s => s.excel.stageId === stage.excel.stageId) || !matchQuery(stage) || !callback(stage)) continue;
            arr.push(stage);
            i++;
        }
    }
    const mappedArr = arr.map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.stageId }));

    return mappedArr;
}