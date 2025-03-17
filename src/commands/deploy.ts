import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteDeployable } from '../utils/autocomplete';
import { buildDeployMessage } from '../utils/build';

export default class DeployCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('deploy')
        .setDescription('Show an deployable\'s information and attributes')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Deployable name')
                .setRequired(true)
                .setAutocomplete(true)
        ) as SlashCommandBuilder;
    name = 'Deploy';
    description = ['Show information on a deployable.'];
    usage = [
        '`/deploy [deployable]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = await autocompleteDeployable({ query: value });
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const deploy = await api.single('deployable', { query: name });

        if (!deploy)
            return await interaction.reply({ content: 'That deployable doesn\'t exist!', ephemeral: true });

        await interaction.deferReply();

        const deployEmbed = await buildDeployMessage(deploy, 0, 0, 0);
        return await interaction.editReply(deployEmbed);
    }
    async buttonResponse(interaction: ButtonInteraction, idArr: string[]) {
        const deploy = await api.single('deployable', { query: idArr[1] });
        const type = parseInt(idArr[2]);
        const page = parseInt(idArr[3]);
        const level = parseInt(idArr[4]);

        const deployEmbed = await buildDeployMessage(deploy, type, page, level);
        return await interaction.update(deployEmbed);
    }
}