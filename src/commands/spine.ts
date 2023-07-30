import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { unlinkSync } from 'fs';
import { join } from 'path';
import { Command } from '../structures/Command';
import { getOperator } from '../utils/Api';
import { operatorAutocomplete } from '../utils/Autocomplete';
import { buildSpineMessage } from '../utils/Build';
import * as SpineHelper from '../utils/SpineHelper';

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
        const arr = await operatorAutocomplete({ query: value, include: ['data.name'] });
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const op = await getOperator({ query: name });

        if (!op)
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const skelData = await SpineHelper.loadSkel(op);

        if (!skelData)
            return await interaction.reply({ content: 'nope', ephemeral: true });

        const animArr = [];
        for (const animation of skelData.animations) {
            if (animation.name === 'Default') continue;
            animArr.push(animation.name);
        }

        await interaction.deferReply();

        const { page, browser, rand } = await SpineHelper.launchPage(op, animArr[0]);

        page.on('console', async message => {
            if (message.text() === 'done') {
                await new Promise(r => setTimeout(r, 1000));
                await browser.close();

                const spineEmbed = await buildSpineMessage(op, animArr, animArr[0], rand);
                await interaction.followUp(spineEmbed);
                unlinkSync(join(__dirname, '..', 'utils', 'spine', op.id + rand + '.gif'));
            }
        }).on('pageerror', async ({ message }) => {
            console.error(`Spine error for ${op.data.name}: ` + message);
            return await interaction.editReply({ content: 'There was an error while generating the animation!' });
        });
    }
};