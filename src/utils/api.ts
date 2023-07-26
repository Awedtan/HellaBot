import { Base, CCStage, Definition, Enemy, GameEvent, GridRange, Item, Module, Operator, Paradox, RogueTheme, Skill, Skin, Stage } from "../types";
const fetch = require('node-fetch');

const apiUrl = 'https:/hellabotapi.cyclic.app';

export type SingleParams = {
    query: string;
    include?: string[];
    exclude?: string[];
};
export type AllParams = {
    include?: string[];
    exclude?: string[];
};

export async function getArchetype({ query, include, exclude }: SingleParams): Promise<string> {
    const data = await GET({ route: 'archetype', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllArchetypes({ include, exclude }: AllParams = {}): Promise<string[]> {
    const data = await GET({ route: 'archetype', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

export async function getBase({ query, include, exclude }: SingleParams): Promise<Base> {
    const data = await GET({ route: 'base', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllBases({ include, exclude }: AllParams = {}): Promise<Base[]> {
    const data = await GET({ route: 'base', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

export async function getCcStage({ query, include, exclude }: SingleParams): Promise<CCStage> {
    const data = await GET({ route: 'cc', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllCcStages({ include, exclude }: AllParams = {}): Promise<CCStage[]> {
    const data = await GET({ route: 'cc', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

export async function getDefinition({ query, include, exclude }: SingleParams): Promise<Definition> {
    const data = await GET({ route: 'define', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllDefinitions({ include, exclude }: AllParams = {}): Promise<Definition[]> {
    const data = await GET({ route: 'define', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

export async function getEnemy({ query, include, exclude }: SingleParams): Promise<Enemy> {
    const data = await GET({ route: 'enemy', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllEnemies({ include, exclude }: AllParams = {}): Promise<Enemy[]> {
    const data = await GET({ route: 'enemy', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

export async function getEvent({ query, include, exclude }: SingleParams): Promise<GameEvent> {
    const data = await GET({ route: 'event', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllEvents({ include, exclude }: AllParams = {}): Promise<GameEvent[]> {
    const data = await GET({ route: 'event', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

export async function getItem({ query, include, exclude }: SingleParams): Promise<Item> {
    const data = await GET({ route: 'item', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllItems({ include, exclude }: AllParams = {}): Promise<Item[]> {
    const data = await GET({ route: 'item', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

export async function getModule({ query, include, exclude }: SingleParams): Promise<Module> {
    const data = await GET({ route: 'module', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllModules({ include, exclude }: AllParams = {}): Promise<Module[]> {
    const data = await GET({ route: 'module', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

export async function getOperator({ query, include, exclude }: SingleParams): Promise<Operator> {
    const data = await GET({ route: 'operator', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllOperators({ include, exclude }: AllParams = {}): Promise<Operator[]> {
    const data = await GET({ route: 'operator', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

export async function getParadox({ query, include, exclude }: SingleParams): Promise<Paradox> {
    const data = await GET({ route: 'paradox', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllParadoxes({ include, exclude }: AllParams = {}): Promise<Paradox[]> {
    const data = await GET({ route: 'paradox', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

export async function getRange({ query, include, exclude }: SingleParams): Promise<GridRange> {
    const data = await GET({ route: 'range', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllRanges({ include, exclude }: AllParams = {}): Promise<GridRange[]> {
    const data = await GET({ route: 'range', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

export async function getRogueTheme({ query, include, exclude }: SingleParams): Promise<RogueTheme> {
    const data = await GET({ route: 'rogue', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllRogueThemes({ include, exclude }: AllParams = {}): Promise<RogueTheme[]> {
    const data = await GET({ route: 'rogue', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

export async function getSkill({ query, include, exclude }: SingleParams): Promise<Skill> {
    const data = await GET({ route: 'skill', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllSkills({ include, exclude }: AllParams = {}): Promise<Skill[]> {
    const data = await GET({ route: 'skill', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

export async function getSkinArr({ query, include, exclude }: SingleParams): Promise<Skin[]> {
    const data = await GET({ route: 'skin', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllSkinArrs({ include, exclude }: AllParams = {}): Promise<Skin[][]> {
    const data = await GET({ route: 'skin', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

export async function getStageArr({ query, include, exclude }: SingleParams): Promise<Stage[]> {
    const data = await GET({ route: 'stage', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllStageArrs({ include, exclude }: AllParams = {}): Promise<Stage[][]> {
    const data = await GET({ route: 'stage', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

export async function getToughStageArr({ query, include, exclude }: SingleParams): Promise<Stage[]> {
    const data = await GET({ route: 'toughstage', query: query, include: include, exclude: exclude });
    return data.value;
}
export async function getAllToughStageArrs({ include, exclude }: AllParams = {}): Promise<Stage[][]> {
    const data = await GET({ route: 'toughstage', query: '', include: include, exclude: exclude });
    return data.map(datum => datum.value);
}

async function GET({ route, query, include, exclude }: { route: string, query: string, include?: string[], exclude?: string[] }) {
    let path = `${apiUrl}/${route}/${query}`
    if (include) {
        path += `?include=${include[0]}`;
        for (let i = 1; i < include.length; i++) {
            path += `&include=${include[i]}`;
        }
    }
    else if (exclude) {
        path += `?exclude=${exclude[0]}`;
        for (let i = 1; i < exclude.length; i++) {
            path += `&exclude=${exclude[i]}`;
        }
    }
    console.log(path);
    let response = await fetch(path);

    if (!response.ok) return { value: null };
    return await response.json();
}