import * as T from "hella-types";
const { paths } = require('../constants.json');

type RouteParams = {
    route: string,
    query?: string,
    search?: Record<string, string>,
    limit?: number,
    include?: string[],
    exclude?: string[]
}
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
type SearchParams = {
    search: Record<string, string>;
    limit?: number;
    include?: string[];
    exclude?: string[];
};
type ObjectMap = {
    'archetype': string;
    'base': T.Base;
    'cc': T.CCStage;
    'define': T.Definition;
    'enemy': T.Enemy;
    'event': T.GameEvent;
    'item': T.Item;
    'module': T.Module;
    'operator': T.Operator;
    'paradox': T.Paradox;
    'range': T.GridRange;
    'rogue': T.RogueTheme;
    // 'roguestage': RogueStage;
    // 'roguetoughstage': RogueStage;
    'sandbox': T.SandboxAct;
    'skill': T.Skill;
    'skin': T.Skin;
    'stage': T.Stage[];
    'toughstage': T.Stage[];
};

class PathBuilder {
    private path: string;
    private paramed = false;
    constructor() {
        this.path = paths.apiUrl;
    }
    public route(route: string) {
        this.path += `/${route}`;
        return this;
    }
    public param(field: string, query: string) {
        if (!this.paramed) {
            this.path += `?${field}=${query}`;
            this.paramed = true;
        }
        else {
            this.path += `&${field}=${query}`;
        }
    }
    public include(include: string[]) {
        include?.forEach(inc => this.param('include', inc));
        return this;
    }
    public exclude(exclude: string[]) {
        exclude?.forEach(exc => this.param('exclude', exc));
        return this;
    }
    public limit(limit: number) {
        if (limit) this.param('limit', limit.toString());
        return this;
    }
    public toString() {
        return this.path;
    }
}

async function getSingle({ route, query, include, exclude }: RouteParams) {
    const path = new PathBuilder().route(`${route}/${query}`).include(include).exclude(exclude).toString();
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json()).value;
}

async function getMulti({ route, limit, include, exclude }: RouteParams) {
    const path = new PathBuilder().route(route).limit(limit).include(include).exclude(exclude).toString();
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json()).map(datum => datum.value);
}

async function getMatch({ route, query, limit, include, exclude }: RouteParams) {
    if (query === '') return [];
    const path = new PathBuilder().route(`${route}/match/${query}`).limit(limit).include(include).exclude(exclude).toString();
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json()).map(datum => datum.value);
}

async function getSearch({ route, search, limit, include, exclude }: RouteParams) {
    if (!search) return [];
    const pathB = new PathBuilder().route(`${route}/search`).limit(limit).include(include).exclude(exclude);
    for (const [key, value] of Object.entries(search)) {
        pathB.param(key, value);
    }
    const path = pathB.toString();
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json()).map(datum => datum.value);
}

export async function about() {
    const path = new PathBuilder().route('about').toString();
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json())[0];
}

export async function recent() {
    const path = new PathBuilder().route('new').toString();
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json());
}

export async function single<T extends keyof ObjectMap>(route: T, { query, include, exclude }: SingleParams): Promise<ObjectMap[T]> {
    const res = await getSingle({ route, query, include, exclude });
    if (res) return res as ObjectMap[T];
    return await getSingle({ route: `cn/${route}`, query, include, exclude }) as ObjectMap[T];
}

export async function all<T extends keyof ObjectMap>(route: T, { limit, include, exclude }: AllParams = {}): Promise<ObjectMap[T][]> {
    const res = await getMulti({ route, limit, include, exclude });
    if (res) return res as ObjectMap[T][];
    return await getMulti({ route: `cn/${route}`, limit, include, exclude }) as ObjectMap[T][];
}

export async function match<T extends keyof ObjectMap>(route: T, { query, limit, include, exclude }: MatchParams): Promise<ObjectMap[T][]> {
    const res = await getMatch({ route, query, limit, include, exclude });
    if (res) return res as ObjectMap[T][];
    return await getMatch({ route: `cn/${route}`, query, limit, include, exclude }) as ObjectMap[T][];
}

export async function search<T extends keyof ObjectMap>(route: T, { search, limit, include, exclude }: SearchParams): Promise<ObjectMap[T][]> {
    const res = await getSearch({ route, search, limit, include, exclude });
    if (res) return res as ObjectMap[T][];
    return await getSearch({ route: `cn/${route}`, search, limit, include, exclude }) as ObjectMap[T][];
}

// todo: find some better way of doing this, how to dynamically include all rogue indexes?
export async function matchRogueStage(theme: number, { query, limit, include, exclude }: MatchParams): Promise<T.RogueStage[]> {
    return await getMatch({ route: `roguestage/${theme}`, query, limit, include, exclude });
}

export async function matchRogueToughStage(theme: number, { query, limit, include, exclude }: MatchParams): Promise<T.RogueStage[]> {
    return await getMatch({ route: `roguetoughstage/${theme}`, query, limit, include, exclude });
}