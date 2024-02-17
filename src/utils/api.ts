import { Base, CCStage, Definition, Enemy, GameEvent, GridRange, Item, Module, Operator, Paradox, RogueTheme, SandboxAct, Skill, Skin, Stage } from "hella-types";
const { paths } = require('../constants.json');

export type SingleParams = {
    query: string;
    include?: string[];
    exclude?: string[];
};
type AllParams = {
    limit?: number;
    include?: string[];
    exclude?: string[];
};

class PathBuilder {
    private path: string;
    private queried = false;
    constructor() {
        this.path = paths.apiUrl;
    }
    public route(route: string) {
        this.path += `/${route}`;
        return this;
    }
    private query(query: string) {
        if (!this.queried) {
            this.path += `?${query}`;
            this.queried = true;
        }
        else {
            this.path += `&${query}`;
        }
    }
    public include(include: string[]) {
        include?.forEach(inc => this.query(`include=${inc}`));
        return this;
    }
    public exclude(exclude: string[]) {
        exclude?.forEach(exc => this.query(`exclude=${exc}`));
        return this;
    }
    public limit(limit: number) {
        this.query(`limit=${limit}`);
        return this;
    }
    public toString() {
        return this.path;
    }
}

async function GET({ route, query, limit, include, exclude }: { route: string, query: string, limit?: number, include?: string[], exclude?: string[] }) {
    const path = new PathBuilder().route(route).route(query).include(include).exclude(exclude).limit(limit).toString();
    const response = await fetch(path);
    if (!response.ok) return { value: null };
    return await response.json();
}
async function getSingleResource({ route, query, include, exclude }) {
    return (await GET({ route, query, include, exclude })).value;
}
async function getMultiResource({ route, limit, include, exclude }) {
    return (await GET({ route, query: '', limit, include, exclude })).map(datum => datum.value);
}

export async function getArchetype({ query, include, exclude }: SingleParams): Promise<string> {
    return await getSingleResource({ route: 'archetype', query, include, exclude });
}
export async function getAllArchetypes({ limit, include, exclude }: AllParams = {}): Promise<string[]> {
    return await getMultiResource({ route: 'archetype', limit, include, exclude });
}
export async function getBase({ query, include, exclude }: SingleParams): Promise<Base> {
    return await getSingleResource({ route: 'base', query, include, exclude });
}
export async function getAllBases({ limit, include, exclude }: AllParams = {}): Promise<Base[]> {
    return await getMultiResource({ route: 'base', limit, include, exclude });
}
export async function getCc({ query, include, exclude }: SingleParams): Promise<CCStage> {
    return await getSingleResource({ route: 'cc', query, include, exclude });
}
export async function getAllCc({ limit, include, exclude }: AllParams = {}): Promise<CCStage[]> {
    return await getMultiResource({ route: 'cc', limit, include, exclude });
}
export async function getDefinition({ query, include, exclude }: SingleParams): Promise<Definition> {
    return await getSingleResource({ route: 'define', query, include, exclude });
}
export async function getAllDefinitions({ limit, include, exclude }: AllParams = {}): Promise<Definition[]> {
    return await getMultiResource({ route: 'define', limit, include, exclude });
}
export async function getEnemy({ query, include, exclude }: SingleParams): Promise<Enemy> {
    return await getSingleResource({ route: 'enemy', query, include, exclude });
}
export async function getAllEnemies({ limit, include, exclude }: AllParams = {}): Promise<Enemy[]> {
    return await getMultiResource({ route: 'enemy', limit, include, exclude });
}
export async function getEvent({ query, include, exclude }: SingleParams): Promise<GameEvent> {
    return await getSingleResource({ route: 'event', query, include, exclude });
}
export async function getAllEvents({ limit, include, exclude }: AllParams = {}): Promise<GameEvent[]> {
    return await getMultiResource({ route: 'event', limit, include, exclude });
}
export async function getItem({ query, include, exclude }: SingleParams): Promise<Item> {
    return await getSingleResource({ route: 'item', query, include, exclude });
}
export async function getAllItems({ limit, include, exclude }: AllParams = {}): Promise<Item[]> {
    return await getMultiResource({ route: 'item', limit, include, exclude });
}
export async function getModule({ query, include, exclude }: SingleParams): Promise<Module> {
    return await getSingleResource({ route: 'module', query, include, exclude });
}
export async function getAllModules({ limit, include, exclude }: AllParams = {}): Promise<Module[]> {
    return await getMultiResource({ route: 'module', limit, include, exclude });
}
export async function getOperator({ query, include, exclude }: SingleParams): Promise<Operator> {
    return await getSingleResource({ route: 'operator', query, include, exclude });
}
export async function getAllOperators({ limit, include, exclude }: AllParams = {}): Promise<Operator[]> {
    return await getMultiResource({ route: 'operator', limit, include, exclude });
}
export async function getParadox({ query, include, exclude }: SingleParams): Promise<Paradox> {
    return await getSingleResource({ route: 'paradox', query, include, exclude });
}
export async function getAllParadoxes({ limit, include, exclude }: AllParams = {}): Promise<Paradox[]> {
    return await getMultiResource({ route: 'paradox', limit, include, exclude });
}
export async function getRange({ query, include, exclude }: SingleParams): Promise<GridRange> {
    return await getSingleResource({ route: 'range', query, include, exclude });
}
export async function getAllRanges({ limit, include, exclude }: AllParams = {}): Promise<GridRange[]> {
    return await getMultiResource({ route: 'range', limit, include, exclude });
}
export async function getRogueTheme({ query, include, exclude }: SingleParams): Promise<RogueTheme> {
    return await getSingleResource({ route: 'rogue', query, include, exclude });
}
export async function getAllRogueThemes({ limit, include, exclude }: AllParams = {}): Promise<RogueTheme[]> {
    return await getMultiResource({ route: 'rogue', limit, include, exclude });
}
export async function getSandboxAct({ query, include, exclude }: SingleParams): Promise<SandboxAct> {
    return await getSingleResource({ route: 'sandbox', query, include, exclude });
}
export async function getAllSandboxActs({ limit, include, exclude }: AllParams = {}): Promise<SandboxAct[]> {
    return await getMultiResource({ route: 'sandbox', limit, include, exclude });
}
export async function getSkill({ query, include, exclude }: SingleParams): Promise<Skill> {
    return await getSingleResource({ route: 'skill', query, include, exclude });
}
export async function getAllSkills({ limit, include, exclude }: AllParams = {}): Promise<Skill[]> {
    return await getMultiResource({ route: 'skill', limit, include, exclude });
}
export async function getSkinArr({ query, include, exclude }: SingleParams): Promise<Skin[]> {
    return await getSingleResource({ route: 'skin', query, include, exclude });
}
export async function getAllSkinArrs({ limit, include, exclude }: AllParams = {}): Promise<Skin[][]> {
    return await getMultiResource({ route: 'skin', limit, include, exclude });
}
export async function getStageArr({ query, include, exclude }: SingleParams): Promise<Stage[]> {
    return await getSingleResource({ route: 'stage', query, include, exclude });
}
export async function getAllStageArrs({ limit, include, exclude }: AllParams = {}): Promise<Stage[][]> {
    return await getMultiResource({ route: 'stage', limit, include, exclude });
}
export async function getToughStageArr({ query, include, exclude }: SingleParams): Promise<Stage[]> {
    query = query.split('#').join('');
    return await getSingleResource({ route: 'toughstage', query, include, exclude });
}
export async function getAllToughStageArrs({ limit, include, exclude }: AllParams = {}): Promise<Stage[][]> {
    return await getMultiResource({ route: 'toughstage', limit, include, exclude });
}