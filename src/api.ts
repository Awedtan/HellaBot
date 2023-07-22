import { Base, CCStage, Definition, Enemy, GameEvent, GridRange, Item, Module, Operator, Paradox, RogueTheme, Skill, Skin, Stage } from "./types";

const fetch = require('node-fetch');

const apiUrl = 'https:/hellabotapi.cyclic.app';

export async function getArchetype(id: string): Promise<string> {
    const data = await GET('archetype', id);
    return data.value;
}

export async function getBase(id: string): Promise<Base> {
    const data = await GET('base', id);
    return data.value;
}

export async function getCcStage(name: string): Promise<CCStage> {
    const data = await GET('cc', name);
    return data.value;
}

export async function getDefinition(term: string): Promise<Definition> {
    const data = await GET('define', term);
    return data.value;
}

export async function getAllDefinitions(): Promise<any[]> {
    const data = await GET('define', '');
    return data;
}

export async function getEnemy(name: string): Promise<Enemy> {
    const data = await GET('enemy', name);
    return data.value;
}

export async function getEvent(term: string): Promise<GameEvent> {
    const data = await GET('event', term);
    return data.value;
}

export async function getAllEvents(): Promise<any[]> {
    const data = await GET('event', '');
    return data;
}

export async function getItem(name: string): Promise<Item> {
    const data = await GET('item', name);
    return data.value;
}

export async function getModule(name: string): Promise<Module> {
    const data = await GET('module', name);
    return data.value;
}

export async function getOperator(name: string): Promise<Operator> {
    const data = await GET('operator', name);
    return data.value;
}

export async function getParadox(id: string): Promise<Paradox> {
    const data = await GET('paradox', id);
    return data.value;
}

export async function getRange(id: string): Promise<GridRange> {
    const data = await GET('range', id);
    return data.value;
}

export async function getRogueTheme(index: number): Promise<RogueTheme> {
    const data = await GET('rogue', index.toString());
    return data.value;
}

export async function getSkill(id: string): Promise<Skill> {
    const data = await GET('skill', id);
    return data.value;
}

export async function getSkinArr(id: string): Promise<Skin[]> {
    const data = await GET('skin', id);
    return data.value;
}

export async function getStageArr(code: string): Promise<Stage[]> {
    const data = await GET('stage', code);
    return data.value;
}

export async function getToughStageArr(code: string): Promise<Stage[]> {
    const data = await GET('toughstage', code);
    return data.value;
}

async function GET(route: string, query: string) {
    const response = await fetch(apiUrl + `/${route}/${query}`);
    if (!response.ok) return { value: null };
    return await response.json();
}