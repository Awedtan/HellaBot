import { Base, CCStage, Definition, Enemy, GameEvent, GridRange, Item, Module, Operator, Paradox, RogueStage, RogueTheme, SandboxAct, Skill, Skin, Stage } from "hella-types";
const { paths } = require('../constants.json');

type SingleParams = {
    query: string;
    include?: string[];
    exclude?: string[];
};
type AllParams = {
    limit?: number;
    include?: string[];
    exclude?: string[];
};
type MatchParams = {
    query: string;
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
        if (limit) this.query(`limit=${limit}`);
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
async function getSingle({ route, query, include, exclude }) {
    return (await GET({ route, query, include, exclude })).value;
}
async function getMulti({ route, limit, include, exclude }) {
    return (await GET({ route, query: '', limit, include, exclude })).map(datum => datum.value);
}
async function getMatch({ route, query, limit, include, exclude }) {
    if (query === '') return [];
    const test = (await GET({ route: `${route}/match`, query, limit, include, exclude }));
    return test?.map(datum => datum.value);
}

export async function getArchetype({ query, include, exclude }: SingleParams): Promise<string> {
    const res = await getSingle({ route: 'archetype', query, include, exclude });
    if(res) return res;
    return await getSingle({ route: 'cn/archetype', query, include, exclude });
}
export async function getAllArchetypes({ limit, include, exclude }: AllParams = {}): Promise<string[]> {
    return await getMulti({ route: 'archetype', limit, include, exclude });
}
export async function matchArchetype({ query, limit, include, exclude }: MatchParams): Promise<string[]> {
    return await getMatch({ route: 'archetype', query, limit, include, exclude });
}
export async function getBase({ query, include, exclude }: SingleParams): Promise<Base> {
    return await getSingle({ route: 'base', query, include, exclude });
}
export async function getAllBases({ limit, include, exclude }: AllParams = {}): Promise<Base[]> {
    return await getMulti({ route: 'base', limit, include, exclude });
}
export async function matchBase({ query, limit, include, exclude }: MatchParams): Promise<Base[]> {
    return await getMatch({ route: 'base', query, limit, include, exclude });
}
export async function getCc({ query, include, exclude }: SingleParams): Promise<CCStage> {
    return await getSingle({ route: 'cc', query, include, exclude });
}
export async function getAllCc({ limit, include, exclude }: AllParams = {}): Promise<CCStage[]> {
    return await getMulti({ route: 'cc', limit, include, exclude });
}
export async function matchCc({ query, limit, include, exclude }: MatchParams): Promise<CCStage[]> {
    return await getMatch({ route: 'cc', query, limit, include, exclude });
}
export async function getDefinition({ query, include, exclude }: SingleParams): Promise<Definition> {
    return await getSingle({ route: 'define', query, include, exclude });
}
export async function getAllDefinitions({ limit, include, exclude }: AllParams = {}): Promise<Definition[]> {
    return await getMulti({ route: 'define', limit, include, exclude });
}
export async function matchDefinition({ query, limit, include, exclude }: MatchParams): Promise<Definition[]> {
    return await getMatch({ route: 'define', query, limit, include, exclude });
}
export async function getEnemy({ query, include, exclude }: SingleParams): Promise<Enemy> {
    return await getSingle({ route: 'enemy', query, include, exclude });
}
export async function getAllEnemies({ limit, include, exclude }: AllParams = {}): Promise<Enemy[]> {
    return await getMulti({ route: 'enemy', limit, include, exclude });
}
export async function matchEnemy({ query, limit, include, exclude }: MatchParams): Promise<Enemy[]> {
    return await getMatch({ route: 'enemy', query, limit, include, exclude });
}
export async function getEvent({ query, include, exclude }: SingleParams): Promise<GameEvent> {
    return await getSingle({ route: 'event', query, include, exclude });
}
export async function getAllEvents({ limit, include, exclude }: AllParams = {}): Promise<GameEvent[]> {
    return await getMulti({ route: 'event', limit, include, exclude });
}
export async function matchEvent({ query, limit, include, exclude }: MatchParams): Promise<GameEvent[]> {
    return await getMatch({ route: 'event', query, limit, include, exclude });
}
export async function getItem({ query, include, exclude }: SingleParams): Promise<Item> {
    return await getSingle({ route: 'item', query, include, exclude });
}
export async function getAllItems({ limit, include, exclude }: AllParams = {}): Promise<Item[]> {
    return await getMulti({ route: 'item', limit, include, exclude });
}
export async function matchItem({ query, limit, include, exclude }: MatchParams): Promise<Item[]> {
    return await getMatch({ route: 'item', query, limit, include, exclude });
}
export async function getModule({ query, include, exclude }: SingleParams): Promise<Module> {
    return await getSingle({ route: 'module', query, include, exclude });
}
export async function getAllModules({ limit, include, exclude }: AllParams = {}): Promise<Module[]> {
    return await getMulti({ route: 'module', limit, include, exclude });
}
export async function matchModule({ query, limit, include, exclude }: MatchParams): Promise<Module[]> {
    return await getMatch({ route: 'module', query, limit, include, exclude });
}
export async function getOperator({ query, include, exclude }: SingleParams): Promise<Operator> {
    const res = await getSingle({ route: 'operator', query, include, exclude });
    if (res) return res;
    return await getSingle({ route: 'cn/operator', query, include, exclude });
}
export async function getAllOperators({ limit, include, exclude }: AllParams = {}): Promise<Operator[]> {
    return await getMulti({ route: 'operator', limit, include, exclude });
}
export async function matchOperator({ query, limit, include, exclude }: MatchParams): Promise<Operator[]> {
    return await getMatch({ route: 'operator', query, limit, include, exclude });
}
export async function getParadox({ query, include, exclude }: SingleParams): Promise<Paradox> {
    return await getSingle({ route: 'paradox', query, include, exclude });
}
export async function getAllParadoxes({ limit, include, exclude }: AllParams = {}): Promise<Paradox[]> {
    return await getMulti({ route: 'paradox', limit, include, exclude });
}
export async function matchParadox({ query, limit, include, exclude }: MatchParams): Promise<Paradox[]> {
    return await getMatch({ route: 'paradox', query, limit, include, exclude });
}
export async function getRange({ query, include, exclude }: SingleParams): Promise<GridRange> {
    return await getSingle({ route: 'range', query, include, exclude });
}
export async function getAllRanges({ limit, include, exclude }: AllParams = {}): Promise<GridRange[]> {
    return await getMulti({ route: 'range', limit, include, exclude });
}
export async function matchRange({ query, limit, include, exclude }: MatchParams): Promise<GridRange[]> {
    return await getMatch({ route: 'range', query, limit, include, exclude });
}
export async function getRogueTheme({ query, include, exclude }: SingleParams): Promise<RogueTheme> {
    return await getSingle({ route: 'rogue', query, include, exclude });
}
export async function getAllRogueThemes({ limit, include, exclude }: AllParams = {}): Promise<RogueTheme[]> {
    return await getMulti({ route: 'rogue', limit, include, exclude });
}
export async function matchRogueTheme({ query, limit, include, exclude }: MatchParams): Promise<RogueTheme[]> {
    return await getMatch({ route: 'rogue', query, limit, include, exclude });
}
export async function getRogueStage(theme: number, { query, include, exclude }: SingleParams): Promise<RogueStage> {
    return await getSingle({ route: `roguestage/${theme}`, query, include, exclude });
}
export async function getAllRogueStages(theme: number, { limit, include, exclude }: AllParams = {}): Promise<RogueStage[]> {
    return await getMulti({ route: `roguestage/${theme}`, limit, include, exclude });
}
export async function matchRogueStage(theme: number, { query, limit, include, exclude }: MatchParams): Promise<RogueStage[]> {
    return await getMatch({ route: `roguestage/${theme}`, query, limit, include, exclude });
}
export async function getRogueToughStage(theme: number, { query, include, exclude }: SingleParams): Promise<RogueStage> {
    return await getSingle({ route: `roguetoughstage/${theme}`, query, include, exclude });
}
export async function getAllRogueToughStages(theme: number, { limit, include, exclude }: AllParams = {}): Promise<RogueStage[]> {
    return await getMulti({ route: `roguetoughstage/${theme}`, limit, include, exclude });
}
export async function matchRogueToughStage(theme: number, { query, limit, include, exclude }: MatchParams): Promise<RogueStage[]> {
    return await getMatch({ route: `roguetoughstage/${theme}`, query, limit, include, exclude });
}
export async function getSandboxAct({ query, include, exclude }: SingleParams): Promise<SandboxAct> {
    return await getSingle({ route: 'sandbox', query, include, exclude });
}
export async function getAllSandboxActs({ limit, include, exclude }: AllParams = {}): Promise<SandboxAct[]> {
    return await getMulti({ route: 'sandbox', limit, include, exclude });
}
export async function matchSandboxAct({ query, limit, include, exclude }: MatchParams): Promise<SandboxAct[]> {
    return await getMatch({ route: 'sandbox', query, limit, include, exclude });
}
export async function getSkill({ query, include, exclude }: SingleParams): Promise<Skill> {
    return await getSingle({ route: 'skill', query, include, exclude });
}
export async function getAllSkills({ limit, include, exclude }: AllParams = {}): Promise<Skill[]> {
    return await getMulti({ route: 'skill', limit, include, exclude });
}
export async function matchSkill({ query, limit, include, exclude }: MatchParams): Promise<Skill[]> {
    return await getMatch({ route: 'skill', query, limit, include, exclude });
}
export async function getSkinArr({ query, include, exclude }: SingleParams): Promise<Skin[]> {
    return await getSingle({ route: 'skin', query, include, exclude });
}
export async function getAllSkinArrs({ limit, include, exclude }: AllParams = {}): Promise<Skin[][]> {
    return await getMulti({ route: 'skin', limit, include, exclude });
}
export async function matchSkinArr({ query, limit, include, exclude }: MatchParams): Promise<Skin[][]> {
    return await getMatch({ route: 'skin', query, limit, include, exclude });
}
export async function getStageArr({ query, include, exclude }: SingleParams): Promise<Stage[]> {
    return await getSingle({ route: 'stage', query, include, exclude });
}
export async function getAllStageArrs({ limit, include, exclude }: AllParams = {}): Promise<Stage[][]> {
    return await getMulti({ route: 'stage', limit, include, exclude });
}
export async function matchStageArr({ query, limit, include, exclude }: MatchParams): Promise<Stage[][]> {
    return await getMatch({ route: 'stage', query, limit, include, exclude });
}
export async function getToughStageArr({ query, include, exclude }: SingleParams): Promise<Stage[]> {
    query = query.split('#').join('');
    return await getSingle({ route: 'toughstage', query, include, exclude });
}
export async function getAllToughStageArrs({ limit, include, exclude }: AllParams = {}): Promise<Stage[][]> {
    return await getMulti({ route: 'toughstage', limit, include, exclude });
}
export async function matchToughStageArr({ query, limit, include, exclude }: MatchParams): Promise<Stage[][]> {
    return await getMatch({ route: 'toughstage', query, limit, include, exclude });
}