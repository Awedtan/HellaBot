import { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder, StringSelectMenuInteraction } from 'discord.js';
import { promises, unlinkSync } from 'fs';
import { join } from 'path';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteEnemy, autocompleteOperator, autocompleteSkin } from '../utils/autocomplete';
import { buildSpineEnemyMessage, buildSpineOperatorMessage } from '../utils/build';
import * as spineHelper from '../utils/spine/spineHelper';
const { gameConsts } = require('../constants');

const fileExists = async (path: string) => !!(await promises.stat(path).catch(e => false));
const getSkelAnims = skelData => skelData.animations.filter(animation => animation.name !== 'Default').map(animation => animation.name);

async function enemyPageClose(browser, interaction, enemy, animArr, anim, random) {
    await new Promise(r => setTimeout(r, 1000));
    await browser.close();

    const gifFile = join((gameConsts.enemySpineIdOverride[enemy.excel.enemyId] ?? enemy.excel.enemyId) + random + '.gif');
    const gifPath = join(__dirname, '..', 'utils', 'spine', gifFile);
    const spineEmbed = await buildSpineEnemyMessage(gifFile, enemy, animArr, anim, random);
    await interaction.editReply(spineEmbed);

    if (await fileExists(gifPath)) unlinkSync(gifPath);
}
async function operatorPageClose(browser, interaction, op, skin, set, animArr, anim, random) {
    await new Promise(r => setTimeout(r, 1000));
    await browser.close();

    const gifFile = join(skin + random + '.gif');
    const gifPath = join(__dirname, '..', 'utils', 'spine', gifFile);
    const spineEmbed = await buildSpineOperatorMessage(gifFile, op, skin, set, animArr, anim, random);
    await interaction.editReply(spineEmbed);

    if (await fileExists(gifPath)) unlinkSync(gifPath);
}

export default class SpineCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('spine')
        .setDescription('Render spine animations')
        .addSubcommand(subcommand =>
            subcommand.setName('operator')
                .setDescription('Render an operator\'s spine animations')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Operator name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option.setName('skin')
                        .setDescription('Operator skin')
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option.setName('set')
                        .setDescription('Operator animation set')
                        .addChoices(
                            { name: 'front', value: 'front' },
                            { name: 'back', value: 'back' },
                            { name: 'base', value: 'build' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('enemy')
                .setDescription('Render an enemy\'s spine animations')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Enemy name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ) as SlashCommandBuilder;
    name = 'Spine';
    description = [
        'Render an operator or enemy\'s spine animations and send it as a GIF.',
        '`operator`: render an operator\'s spine animations. The `[skin]` and `[set]` fields are optional. If not specified, the values `default` and `front` will be used, respectively.',
        '`enemy`: render an enemy\'s spine animations.'
    ];
    usage = [
        '`/spine operator [operator]`',
        '`/spine operator [operator] [skin] [set]`',
        '`/spine enemy [enemy]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const type = interaction.options.getSubcommand();
        switch (type) {
            case 'operator': {
                const focused = interaction.options.getFocused(true);
                switch (focused.name) {
                    case 'name': {
                        const arr = await autocompleteOperator({ query: focused.value });
                        return await interaction.respond(arr);
                    }
                    case 'skin': {
                        const name = interaction.options.getString('name').toLowerCase();
                        const op = await api.single('operator', { query: name });
                        const arr = await autocompleteSkin(op, { query: focused.value, include: ['id'] });
                        return await interaction.respond(arr);
                    }
                }
            }
            case 'enemy': {
                const value = interaction.options.getFocused().toLowerCase();
                const arr = await autocompleteEnemy({ query: value });
                return await interaction.respond(arr);
            }
        }
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getSubcommand();
        const name = interaction.options.getString('name').toLowerCase();

        switch (type) {
            case 'operator': {
                const skin = interaction.options.getString('skin')?.toLowerCase() ?? 'default';
                const set = interaction.options.getString('set')?.toLowerCase() ?? 'front';
                const op = await api.single('operator', { query: name, include: ['id', 'data', 'skins'] });

                if (!op)
                    return await interaction.reply({ content: `That ${type} doesn\'t exist!`, ephemeral: true });
                if (skin !== 'default' && !op.skins.some(s => s.battleSkin.skinOrPrefabId.toLowerCase() === skin || s.displaySkin.skinName?.toLowerCase() === skin))
                    return await interaction.reply({ content: 'That skin doesn\'t exist!', ephemeral: true });

                const skinId = op.skins.find(s => s.battleSkin.skinOrPrefabId.toLowerCase() === skin || s.displaySkin.skinName?.toLowerCase() === skin)?.battleSkin.skinOrPrefabId.toLowerCase() ?? op.id;
                const skelData = await spineHelper.loadSkel(type, skinId, set);

                if (!skelData)
                    return await interaction.reply({ content: 'There was an error while loading the spine data!', ephemeral: true });

                const animArr = getSkelAnims(skelData);

                if (animArr.length === 0)
                    return await interaction.reply({ content: 'That operator has no animations!', ephemeral: true });

                await interaction.deferReply();

                const { page, browser, random } = await spineHelper.launchPage(type, skinId, set, animArr[0]);
                page.on('console', async message => {
                    if (message.text() === 'done') {
                        await operatorPageClose(browser, interaction, op, skinId, set, animArr, animArr[0], random);
                    }
                }).on('pageerror', async ({ message }) => {
                    await browser.close();
                    console.error(`Spine error for ${skinId}: ` + message);
                    return await interaction.editReply({ content: 'There was an error while generating the animation!' });
                });

                break;
            }
            case 'enemy': {
                const enemy = await api.single('enemy', { query: name, include: ['excel'] });

                if (!enemy)
                    return await interaction.reply({ content: `That ${type} doesn\'t exist!`, ephemeral: true });

                const id = enemy.excel.enemyId;
                const skelData = await spineHelper.loadSkel(type, id, null, null);

                if (!skelData)
                    return await interaction.reply({ content: 'There was an error while loading the spine data!', ephemeral: true });

                const animArr = getSkelAnims(skelData);

                if (animArr.length === 0)
                    return await interaction.reply({ content: 'That enemy has no animations!', ephemeral: true });

                await interaction.deferReply();

                const { page, browser, random } = await spineHelper.launchPage(type, id, null, null, animArr[0]);
                page.on('console', async message => {
                    if (message.text() === 'done') {
                        await enemyPageClose(browser, interaction, enemy, animArr, animArr[0], random);
                    }
                }).on('pageerror', async ({ message }) => {
                    await browser.close();
                    console.error(`Spine error for ${id}: ` + message);
                    return await interaction.editReply({ content: 'There was an error while generating the animation!' });
                });

                break;
            }
        }
    }
    async selectResponse(interaction: StringSelectMenuInteraction<CacheType>, idArr: string[]) {
        const type = idArr[1];
        const id = idArr[2];
        const skin = idArr[3];
        const set = idArr[4];
        const anim = interaction.values[0];

        await interaction.update({ content: `Generating \`${anim}\` gif...`, components: [] });

        switch (type) {
            case 'operator': {
                const op = await api.single('operator', { query: id, include: ['id', 'data', 'skins'] });
                const skelData = await spineHelper.loadSkel(type, skin, set);
                const animArr = getSkelAnims(skelData);
                const { page, browser, random } = await spineHelper.launchPage(type, skin, set, anim);
                page.on('console', async message => {
                    if (message.text() === 'done') {
                        await operatorPageClose(browser, interaction, op, skin, set, animArr, anim, random)
                    }
                }
                ).on('pageerror', async ({ message }) => {
                    await browser.close();
                    console.error(`Spine error for ${id}: ` + message);
                    return await interaction.update({ content: 'There was an error while generating the animation!' });
                });

                break;
            }
            case 'enemy': {
                const enemy = await api.single('enemy', { query: id, include: ['excel'] });
                const skelData = await spineHelper.loadSkel(type, id, null, null);
                const animArr = getSkelAnims(skelData);
                const { page, browser, random } = await spineHelper.launchPage(type, id, null, anim);
                page.on('console', async message => {
                    if (message.text() === 'done') {
                        await enemyPageClose(browser, interaction, enemy, animArr, anim, random);
                    }
                }).on('pageerror', async ({ message }) => {
                    await browser.close();
                    console.error(`Spine error for ${id}: ` + message);
                    return await interaction.update({ content: 'There was an error while generating the animation!' });
                });

                break;
            }
        }
    }
};