import { Definition, Enemy, Item, Operator, Stage } from "../types";
import { SingleParams, getAllDefinitions, getAllEnemies, getAllItems, getAllOperators, getAllStageArrs } from "./Api";

const limit = 6;

export async function defineAutocomplete({ query, include, exclude }: SingleParams, callback: (op: Definition) => boolean = () => true) {
    let arr: Definition[] = [];
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

export async function enemyAutocomplete({ query, include, exclude }: SingleParams, callback: (op: Enemy) => boolean = () => true) {
    const matchQuery = (enemy: Enemy) => enemy.excel.name.toLowerCase().includes(query) || enemy.excel.enemyIndex.toLowerCase().includes(query);

    let arr: Enemy[] = [];
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

export async function itemAutocomplete({ query, include, exclude }: SingleParams, callback: (op: Item) => boolean = () => true) {
    let arr: Item[] = [];
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

export async function operatorAutocomplete({ query, include, exclude }: SingleParams, callback: (op: Operator) => Boolean = () => true) {
    let arr: Operator[] = [];
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

export async function stageAutocomplete({ query, include, exclude }: SingleParams, callback: (op: Stage) => boolean = () => true) {
    const matchQuery = (stage: Stage) => stage.excel.name.toLowerCase().includes(query) || stage.excel.code.toLowerCase().includes(query);

    let arr: Stage[] = [];
    let i = 0;
    const stageArrArr = await getAllStageArrs({ include, exclude });
    for (const stageArr of stageArrArr) {
        for (const stage of stageArr) {
            if (i >= limit) break;
            if (arr.includes(stage) || !matchQuery(stage) || !callback(stage)) continue;
            arr.push(stage);
            i++;
        }
    }

    const mappedArr = arr.map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.stageId }));

    return mappedArr;
}