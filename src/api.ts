import { Base, CCStage, Definition, Enemy, Item, Module, Operator, Paradox } from "./types";

const nodefetch = require('node-fetch');

const apiUrl = 'https:/hellabotapi.cyclic.app';

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

export async function getEnemy(name: string): Promise<Enemy> {
    const data = await GET('enemy', name);
    return data.value;
}

export async function getItem(name: string): Promise<Item> {
    const data = await GET('item', name);
    return data.value;
}

export async function getModule(name: string): Promise<Module> {
    const data = await GET('item', name);
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

async function GET(route: string, query: string) {
    const data = await (await nodefetch(apiUrl + `/${route}/${query}`)).json();
    return data;
}