import { Base, CCStage, Definition, Enemy, GameEvent, GridRange, Item, Module, Operator, Paradox, RogueTheme, Skill, Skin, Stage } from "./types";
const fetch = require('node-fetch');

const apiUrl = 'https:/hellabotapi.cyclic.app';

export async function getArchetype(id: string): Promise<string> {
    const data = await GET('archetype', id);
    return data.value;
}
export async function getAllArchetypes(): Promise<string[]> {
    const data = await GET('archetype', '');
    return data.map(datum => datum.value);
}

export async function getBase(id: string): Promise<Base> {
    const data = await GET('base', id);
    return data.value;
}
export async function getAllBases(): Promise<Base[]> {
    const data = await GET('base', '');
    return data.map(datum => datum.value);
}

export async function getCcStage(name: string): Promise<CCStage> {
    const data = await GET('cc', name);
    return data.value;
}
export async function getAllCcStages(): Promise<CCStage[]> {
    const data = await GET('cc', '');
    return data.map(datum => datum.value);
}

export async function getDefinition(term: string): Promise<Definition> {
    const data = await GET('define', term);
    return data.value;
}
export async function getAllDefinitions(): Promise<Definition[]> {
    const data = await GET('define', '');
    return data.map(datum => datum.value);
}

export async function getEnemy(name: string): Promise<Enemy> {
    const data = await GET('enemy', name);
    return data.value;
}
export async function getAllEnemies(): Promise<Enemy[]> {
    const data = await GET('enemy', '');
    return data.map(datum => datum.value);
}

export async function getEvent(term: string): Promise<GameEvent> {
    const data = await GET('event', term);
    return data.value;
}
export async function getAllEvents(): Promise<GameEvent[]> {
    const data = await GET('event', '');
    return data.map(datum => datum.value);
}

export async function getItem(name: string): Promise<Item> {
    const data = await GET('item', name);
    return data.value;
}
export async function getAllItems(): Promise<Item[]> {
    const data = await GET('item', '');
    return data.map(datum => datum.value);
}

export async function getModule(name: string): Promise<Module> {
    const data = await GET('module', name);
    return data.value;
}
export async function getAllModules(): Promise<Module[]> {
    const data = await GET('module', '');
    return data.map(datum => datum.value);
}

export async function getOperator(name: string): Promise<Operator> {
    const data = await GET('operator', name);
    return data.value;
}
export async function getAllOperators(): Promise<Operator[]> {
    const data = await GET('operator', '');
    return data.map(datum => datum.value);
}

export async function getParadox(id: string): Promise<Paradox> {
    const data = await GET('paradox', id);
    return data.value;
}
export async function getAllParadoxes(): Promise<Paradox[]> {
    const data = await GET('paradox', '');
    return data.map(datum => datum.value);
}

export async function getRange(id: string): Promise<GridRange> {
    const data = await GET('range', id);
    return data.value;
}
export async function getAllRanges(): Promise<GridRange[]> {
    const data = await GET('range', '');
    return data.map(datum => datum.value);
}

export async function getRogueTheme(index: number): Promise<RogueTheme> {
    const data = await GET('rogue', index.toString());
    return data.value;
}
export async function getAllRogueThemes(): Promise<RogueTheme[]> {
    const data = await GET('rogue', '');
    return data.map(datum => datum.value);
}

export async function getSkill(id: string): Promise<Skill> {
    const data = await GET('skill', id);
    return data.value;
}
export async function getAllSkills(): Promise<Skill[]> {
    const data = await GET('skill', '');
    return data.map(datum => datum.value);
}

export async function getSkinArr(id: string): Promise<Skin[]> {
    const data = await GET('skin', id);
    return data.value;
}
export async function getAllSkinArrs(): Promise<Skin[][]> {
    const data = await GET('skin', '');
    return data.map(datum => datum.value);
}

export async function getStageArr(code: string): Promise<Stage[]> {
    const data = await GET('stage', code);
    return data.value;
}
export async function getAllStageArrs(): Promise<Stage[][]> {
    const data = await GET('stage', '');
    return data.map(datum => datum.value);
}

export async function getToughStageArr(code: string): Promise<Stage[]> {
    const data = await GET('toughstage', code);
    return data.value;
}
export async function getAllToughStageArrs(): Promise<Stage[][]> {
    const data = await GET('toughstage', '');
    return data.map(datum => datum.value);
}

async function GET(route: string, query: string) {
    const response = await fetch(apiUrl + `/${route}/${query}`);
    console.log(`GET/${route}/${query}`);
    if (!response.ok) return { value: null };
    return await response.json();
}