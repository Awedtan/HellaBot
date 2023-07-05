const { SlashCommandBuilder } = require('discord.js');
const nodefetch = require('node-fetch');
const fetch = require('../fetch');
const create = require('../create');
const { paths } = require('../constants');

import { Operator } from "../types";
const urlExists = async (url: string) => (await nodefetch(url)).status === 200;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spine')
        .setDescription('Show an operator\'s spine animations')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetch.operators();
        const name = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const op = operatorDict[name];
        const jsonPath = paths.myAssetUrl + `/spinejson/${op.id}.json`;

        if (!await urlExists(jsonPath))
            return await interaction.reply({ content: 'That operator doesn\'t have any spine data yet!', ephemeral: true });

        const spineJson = await (await nodefetch(paths.myAssetUrl + `/spinejson/${op.id}.json`)).json();

        if (spineJson.skeleton.spine !== '3.5.51')
            return await interaction.reply({ content: 'That operator\'s spine data is not yet supported!', ephemeral: true });

        await interaction.deferReply();

        // Default animations are a single frame that lasts forever, they do not work and should not be shown
        const type = Object.keys(spineJson.animations)[0] === 'Default' ? Object.keys(spineJson.animations)[1] : Object.keys(spineJson.animations)[0];
        const { page, browser } = await create.spinePage(op, type);

        page.on('console', async message => {
            if (message.text() === 'done') {
                await new Promise(r => setTimeout(r, 1000));
                await browser.close();

                const spineEmbed = await create.spineEmbed(op, type);
                return await interaction.followUp(spineEmbed);
            }
        }).on('pageerror', async ({ message }) => {
            console.error(message);
            return await interaction.editReply({ content: 'There was an error while generating the animation!' });
        });
    }
};