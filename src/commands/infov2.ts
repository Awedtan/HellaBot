import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import * as api from '../utils/api';
import { autocompleteOperator } from '../utils/autocomplete';
import { buildInfoMessageV2 } from '../utils/build';

export default class InfoCommandV2 {
    data = new SlashCommandBuilder()
        .setName('infov2')
        .setDescription('Show an operator\'s information and attributes')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        ) as SlashCommandBuilder;
    name = 'InfoV2';
    description = ['Show information on an operator, including talents, potentials, stats, skills, and trust bonus. Further information on skills, modules, art, base skills, and material costs can be viewed by clicking their respective buttons.'];
    usage = [
        '`/infov2 [operator]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = await autocompleteOperator({ query: value });
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const op = await api.single('operator', { query: name, exclude: ['paradox'] });

        if (!op)
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        await interaction.deferReply();

        const operatorEmbed = await buildInfoMessageV2(op, 0, 0);
        return await interaction.editReply(operatorEmbed);
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const op = await api.single('operator', { query: idArr[1], exclude: ['paradox'] });
        const page = parseInt(idArr[2]);
        const level = parseInt(idArr[3]);

        const infoEmbed = await buildInfoMessageV2(op, page, level);
        await interaction.update(infoEmbed);
    }
}