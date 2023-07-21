const nodefetch = require('node-fetch');

const apiUrl = 'https://blush-lemur-kilt.cyclic.app';

export async function getBase(id: string) {
    const data = await GET('base', id);
    return data.value;
}

export async function getCcStage(name: string) {
    const data = await GET('cc', name);
    return data.value;
}

export async function getDefinition(term: string) {
    const data = await GET('define', term);
    return data.value;
}

export async function getEnemy(name: string) {
    const data = await GET('enemy', name);
    return data.value;
}

export async function getItem(name: string) {
    const data = await GET('item', name);
    return data.value;
}

export async function getModule(name: string) {
    const data = await GET('item', name);
    return data.value;
}

export async function getOperator(name: string) {
    const data = await GET('operator', name);
    return data.value;
}

export async function getParadox(id: string) {
    const data = await GET('paradox', id);
    return data.value;
}

async function GET(route: string, query: string) {
    const data = await (await nodefetch(apiUrl + `/${route}/${query}`)).json();
    return data;
}