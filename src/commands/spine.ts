import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { unlinkSync } from 'fs';
import { join } from 'path';
import { Command } from '../structures/Command';
import { Enemy, Operator } from '../types';
import { getEnemy, getOperator } from '../utils/Api';
import { enemyAutocomplete, operatorAutocomplete } from '../utils/Autocomplete';
import { buildSpineMessage, fileExists } from '../utils/Build';
import * as SpineHelper from '../utils/SpineHelper';
const { gameConsts } = require('../constants');

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
                    option.setName('direction')
                        .setDescription('Spine direction')
                        .addChoices(
                            { name: 'front', value: 'front' },
                            { name: 'back', value: 'back' }
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
        );
    async autocomplete(interaction: AutocompleteInteraction) {
        const type = interaction.options.getSubcommand();
        switch (type) {
            case 'operator': {
                const value = interaction.options.getFocused().toLowerCase();
                const arr = await operatorAutocomplete({ query: value, include: ['data.name'] });
                return await interaction.respond(arr);
            }
            case 'enemy': {
                const value = interaction.options.getFocused().toLowerCase();
                const arr = await enemyAutocomplete({ query: value, include: ['excel'] });
                return await interaction.respond(arr);
            }
        }
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getSubcommand();
        const name = interaction.options.getString('name').toLowerCase();
        const direction = (interaction.options.getString('direction') ?? 'front').toLowerCase();

        const char = type === 'operator' ? await getOperator({ query: name, include: ['id', 'data'] }) : await getEnemy({ query: name, include: ['excel'] });

        if (!char)
            return await interaction.reply({ content: `That ${type} doesn\'t exist!`, ephemeral: true });

        const id = type === 'operator' ? (char as Operator).id : (char as Enemy).excel.enemyId;
        const skelData = await SpineHelper.loadSkel(type, id, direction);

        if (!skelData)
            return await interaction.reply({ content: 'There was an error while loading the spine data!', ephemeral: true });

        const animArr = [];
        for (const animation of skelData.animations) {
            if (animation.name === 'Default') continue;
            animArr.push(animation.name);
        }

        await interaction.deferReply();

        const { page, browser, rand } = await SpineHelper.launchPage(type, id, direction, animArr[0]);

        page.on('console', async message => {
            if (message.text() === 'done') {
                await new Promise(r => setTimeout(r, 1000));
                await browser.close();

                const spineEmbed = await buildSpineMessage(char, direction, animArr, animArr[0], rand);
                await interaction.followUp(spineEmbed);

                let gifPath = join(__dirname, '..', 'utils', 'spine', id + rand + '.gif');
                if (gameConsts.enemySpineIdOverride[id]) {
                    gifPath = join(__dirname, '..', 'utils', 'spine', gameConsts.enemySpineIdOverride[id] + rand + '.gif');
                }
                if (await fileExists(gifPath)) unlinkSync(gifPath);
            }
        }).on('pageerror', async ({ message }) => {
            await browser.close();
            console.error(`Spine error for ${id}: ` + message);
            return await interaction.editReply({ content: 'There was an error while generating the animation!' });
        });
    }
};