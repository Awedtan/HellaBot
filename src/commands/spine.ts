import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { unlinkSync } from 'fs';
import { join } from 'path';
import { getOperator } from '../api';
import { Command } from '../structures/Command';
import { operatorAutocomplete } from '../utils/autocomplete';
import { buildSpineMessage, buildSpinePage, urlExists } from '../utils/build';
const nodefetch = require('node-fetch');
const { paths } = require('../constants');

export default class SpineCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('spine')
        .setDescription('Show an operator\'s spine animations')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        );
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = await operatorAutocomplete(value);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();

        const op = await getOperator(name);

        if (!op)
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const jsonPath = paths.myAssetUrl + `/spinejson/${op.id}.json`;

        if (!await urlExists(jsonPath))
            return await interaction.reply({ content: 'That operator doesn\'t have any spine data yet!', ephemeral: true });

        const spineJson = await (await nodefetch(paths.myAssetUrl + `/spinejson/${op.id}.json`)).json();

        if (spineJson.skeleton.spine !== '3.5.51')
            return await interaction.reply({ content: 'That operator\'s spine data is not yet supported!', ephemeral: true });

        await interaction.deferReply();

        // Default animations are a single frame that lasts forever, they do not work and should not be shown
        const type = Object.keys(spineJson.animations)[0] === 'Default' ? Object.keys(spineJson.animations)[1] : Object.keys(spineJson.animations)[0];
        const { page, browser, rand } = await buildSpinePage(op, type);

        page.on('console', async message => {
            if (message.text() === 'done') {
                await new Promise(r => setTimeout(r, 1000));
                await browser.close();

                const spineEmbed = await buildSpineMessage(op, type, rand);
                await interaction.followUp(spineEmbed);
                await unlinkSync(join(__dirname, '..', 'spine', op.id + rand + '.gif'));
            }
        }).on('pageerror', async ({ message }) => {
            console.error(message);
            return await interaction.editReply({ content: 'There was an error while generating the animation!' });
        });
    }
};