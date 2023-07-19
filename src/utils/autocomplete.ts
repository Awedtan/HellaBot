import { definitionDict, enemyDict, itemDict, operatorDict, stageDict } from "../data";
import { Definition, Enemy, Item, Operator, Stage } from "../types";

export function defineAutocomplete(query: string, callback: (op: Definition) => boolean = () => true) {
    let arr: Definition[] = [];
    for (const define of Object.values(definitionDict)) {
        if (arr.includes(define)) continue;
        arr.push(define);
    }
    const filteredArr = arr.filter(define => define.termName.toLowerCase().includes(query) && callback(define));
    const filteredMap = filteredArr.slice(0, 8).map(define => ({ name: define.termName, value: define.termName }));

    return filteredMap;
}

export function enemyAutocomplete(query: string, callback: (op: Enemy) => boolean = () => true) {
    let arr: Enemy[] = [];
    for (const enemy of Object.values(enemyDict)) {
        if (arr.includes(enemy)) continue;
        arr.push(enemy);
    }
    const matchQuery = (enemy: Enemy) => enemy.excel.name.toLowerCase().includes(query) || enemy.excel.enemyIndex.toLowerCase().includes(query);
    const filteredArr = arr.filter(enemy => matchQuery(enemy) && callback(enemy));
    const filteredMap = filteredArr.slice(0, 8).map(enemy => ({ name: `${enemy.excel.enemyIndex} - ${enemy.excel.name}`, value: enemy.excel.enemyId }));

    return filteredMap;
}

export function itemAutocomplete(query: string, callback: (op: Item) => boolean = () => true) {
    let arr: Item[] = [];
    for (const item of Object.values(itemDict)) {
        if (arr.includes(item)) continue;
        arr.push(item);
    }
    const filteredArr = arr.filter(item => item.data.name.toLowerCase().includes(query) && callback(item));
    const filteredMap = filteredArr.slice(0, 8).map(item => ({ name: item.data.name, value: item.data.name }));

    return filteredMap;
}

export function operatorAutocomplete(query: string, callback: (op: Operator) => boolean = () => true) {
    let arr: Operator[] = [];
    for (const op of Object.values(operatorDict)) {
        if (arr.includes(op)) continue;
        arr.push(op);
    }
    const filteredArr = arr.filter(op => op.data.name.toLowerCase().includes(query) && callback(op));
    const filteredMap = filteredArr.slice(0, 8).map(op => ({ name: op.data.name, value: op.data.name }));

    return filteredMap;
}

export function stageAutocomplete(query: string, callback: (op: Stage) => boolean = () => true) {
    let arr: Stage[] = [];
    for (const stageArr of Object.values(stageDict)) {
        for (const stage of stageArr) {
            if (arr.includes(stage)) continue;
            arr.push(stage);
        }
    }
    const matchQuery = (stage: Stage) => stage.excel.name.toLowerCase().includes(query) || stage.excel.code.toLowerCase().includes(query);
    const filteredArr = arr.filter(stage => matchQuery(stage) && callback(stage));
    const filteredMap = filteredArr.slice(0, 8).map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.stageId }));

    return filteredMap;
}