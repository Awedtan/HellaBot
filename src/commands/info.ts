import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder, StringSelectMenuInteraction } from 'discord.js';
import * as api from '../utils/api';
import { autocompleteOperator } from '../utils/autocomplete';
import { buildInfoMessage } from '../utils/build';

export default class InfoCommand {
    data = new SlashCommandBuilder()
        .setName('info')
        .setDescription('Show an operator\'s information and attributes')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        ) as SlashCommandBuilder;
    name = 'Info';
    description = ['Show information on an operator, including talents, potentials, stats, skills, and trust bonus. Further information on skills, modules, art, base skills, and material costs can be viewed by clicking their respective buttons.'];
    usage = [
        '`/info [operator]`'
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

        const operatorEmbed = await buildInfoMessage(op, 0, 0);
        return await interaction.editReply(operatorEmbed);
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const op = await api.single('operator', { query: idArr[1] });
        const type = parseInt(idArr[2]);
        const level = parseInt(idArr[3]);

        const infoEmbed = await buildInfoMessage(op, type, level);
        await interaction.update(infoEmbed);
    }
    async selectResponse(interaction: StringSelectMenuInteraction<CacheType>, idArr: string[]) {
        const op = await api.single('operator', { query: idArr[1] });
        const type = idArr[2];
        const level = idArr[3];
        const value = parseInt(interaction.values[0]);

        const infoEmbed = await buildInfoMessage(op, type === 'select' ? value : parseInt(type), level === 'select' ? value : parseInt(level));
        await interaction.update(infoEmbed);
    }
}