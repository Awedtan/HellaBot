import { definitionDict, enemyDict, itemDict, operatorDict, stageDict } from "../data";
import { Definition, Enemy, Item, Operator, Stage } from "../types";

const limit = 6;

export async function defineAutocomplete(query: string, callback: (op: Definition) => boolean = () => true) {
    let arr: Definition[] = [];
    let i = 0;
    for (const define of Object.values(definitionDict)) {
        if (i >= limit) break;
        if (arr.includes(define) || !define.termName.toLowerCase().includes(query) || !await callback(define)) continue;
        arr.push(define);
        i++;
    }
    const mappedArr = arr.slice(0, limit).map(define => ({ name: define.termName, value: define.termName }));

    return mappedArr;
}

export async function enemyAutocomplete(query: string, callback: (op: Enemy) => boolean = () => true) {
    const matchQuery = (enemy: Enemy) => enemy.excel.name.toLowerCase().includes(query) || enemy.excel.enemyIndex.toLowerCase().includes(query);

    let arr: Enemy[] = [];
    let i = 0;
    for (const enemy of Object.values(enemyDict)) {
        if (i >= limit) break;
        if (arr.includes(enemy) || !matchQuery || !await callback(enemy)) continue;
        arr.push(enemy);
        i++;
    }
    const mappedArr = arr.map(enemy => ({ name: `${enemy.excel.enemyIndex} - ${enemy.excel.name}`, value: enemy.excel.enemyId }));

    return mappedArr;
}

export async function itemAutocomplete(query: string, callback: (op: Item) => boolean = () => true) {
    let arr: Item[] = [];
    let i = 0;
    for (const item of Object.values(itemDict)) {
        if (i >= limit) break;
        if (arr.includes(item) || !item.data.name.toLowerCase().includes(query) || !await callback(item)) continue;
        arr.push(item);
        i++;
    }
    const mappedArr = arr.map(item => ({ name: item.data.name, value: item.data.name }));

    return mappedArr;
}

export async function operatorAutocomplete(query: string, callback: (op: Operator) => Promise<Boolean> = async () => true) {
    let arr: Operator[] = [];
    let i = 0;
    for (const op of Object.values(operatorDict)) {
        if (i >= limit) break;
        if (arr.includes(op) || !op.data.name.toLowerCase().includes(query) || !await callback(op)) continue;
        arr.push(op);
        i++;
    }
    const mappedArr = arr.map(op => ({ name: op.data.name, value: op.data.name }));

    return mappedArr;
}

export async function stageAutocomplete(query: string, callback: (op: Stage) => boolean = () => true) {
    const matchQuery = (stage: Stage) => stage.excel.name.toLowerCase().includes(query) || stage.excel.code.toLowerCase().includes(query);

    let arr: Stage[] = [];
    let i = 0;
    for (const stageArr of Object.values(stageDict)) {
        for (const stage of stageArr) {
            if (i >= limit) break;
            if (arr.includes(stage) || !matchQuery(stage) || !await callback(stage)) continue;
            arr.push(stage);
            i++;
        }
    }

    const mappedArr = arr.map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.stageId }));

    return mappedArr;
}