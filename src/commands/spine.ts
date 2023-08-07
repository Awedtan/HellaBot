import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { unlinkSync } from 'fs';
import { join } from 'path';
import { Command } from '../structures/Command';
import { Enemy, Operator } from '../types';
import { getEnemy, getOperator } from '../utils/Api';
import { enemyAutocomplete, operatorAutocomplete } from '../utils/Autocomplete';
import { buildSpineMessage } from '../utils/Build';
import * as SpineHelper from '../utils/SpineHelper';

export default class SpineCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('spine')
        .setDescription('Show spine animations')
        .addSubcommand(subcommand =>
            subcommand.setName('operator')
                .setDescription('Show an operator\'s spine animations')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Operator name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('enemy')
                .setDescription('Show an enemy\'s spine animations')
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

        const char = type === 'operator' ? await getOperator({ query: name, include: ['id', 'data'] }) : await getEnemy({ query: name, include: ['excel'] });

        if (!char)
            return await interaction.reply({ content: `That ${type} doesn\'t exist!`, ephemeral: true });

        const id = type === 'operator' ? (char as Operator).id : (char as Enemy).excel.enemyId;
        const skelData = await SpineHelper.loadSkel(type, id);

        if (!skelData)
            return await interaction.reply({ content: 'That operator does\'t have any spine data!', ephemeral: true });

        const animArr = [];
        for (const animation of skelData.animations) {
            if (animation.name === 'Default') continue;
            animArr.push(animation.name);
        }

        await interaction.deferReply();

        const { page, browser, rand } = await SpineHelper.launchPage(type, id, animArr[0]);

        page.on('console', async message => {
            if (message.text() === 'done') {
                await new Promise(r => setTimeout(r, 1000));
                await browser.close();

                const spineEmbed = await buildSpineMessage(char, animArr, animArr[0], rand);
                await interaction.followUp(spineEmbed);
                unlinkSync(join(__dirname, '..', 'utils', 'spine', id + rand + '.gif'));
            }
        }).on('pageerror', async ({ message }) => {
            console.error(`Spine error for ${id}: ` + message);
            return await interaction.editReply({ content: 'There was an error while generating the animation!' });
        });
    }
};