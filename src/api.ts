import { Base, CCStage, Definition, Enemy, GameEvent, GridRange, Item, Module, Operator, Paradox, RogueTheme, Skill, Skin, Stage } from "./types";

const nodefetch = require('node-fetch');

const apiUrl = 'https:/hellabotapi.cyclic.app';

export async function getArchetype(id: string): Promise<string> {
    const value = await GET('archetype', id);
    return value;
}

export async function getBase(id: string): Promise<Base> {
    const value = await GET('base', id);
    return value;
}

export async function getCcStage(name: string): Promise<CCStage> {
    const value = await GET('cc', name);
    return value;
}

export async function getDefinition(term: string): Promise<Definition> {
    const value = await GET('define', term);
    return value;
}

export async function getAllDefinitions(): Promise<Definition[]> {
    const value = await GET('define', '');
    return value;
}

export async function getEnemy(name: string): Promise<Enemy> {
    const value = await GET('enemy', name);
    return value;
}

export async function getEvent(term: string): Promise<GameEvent> {
    const value = await GET('event', term);
    return value;
}

export async function getAllEvents(): Promise<GameEvent[]> {
    const value = await GET('event', '');
    return value;
}

export async function getItem(name: string): Promise<Item> {
    const value = await GET('item', name);
    return value;
}

export async function getModule(name: string): Promise<Module> {
    const value = await GET('module', name);
    return value;
}

export async function getOperator(name: string): Promise<Operator> {
    const value = await GET('operator', name);
    return value;
}

export async function getParadox(id: string): Promise<Paradox> {
    const value = await GET('paradox', id);
    return value;
}

export async function getRange(id: string): Promise<GridRange> {
    const value = await GET('range', id);
    return value;
}

export async function getRogueTheme(index: number): Promise<RogueTheme> {
    const value = await GET('rogue', index.toString());
    return value;
}

export async function getSkill(id: string): Promise<Skill> {
    const value = await GET('skill', id);
    return value;
}

export async function getSkinArr(id: string): Promise<Skin[]> {
    const value = await GET('skin', id);
    return value;
}

export async function getStageArr(code: string): Promise<Stage[]> {
    const value = await GET('stage', code);
    return value;
}

export async function getToughStageArr(code: string): Promise<Stage[]> {
    const value = await GET('toughstage', code);
    return value;
}

async function GET(route: string, query: string) {
    const data = await (await nodefetch(apiUrl + `/${route}/${query}`)).json();
    if (data === 'Not found') return null;
    return data.value;
}