import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { getOperator } from '../utils/Api';
import { operatorAutocomplete } from '../utils/Autocomplete';
import { buildInfoMessage } from '../utils/Build';

export default class InfoCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('info')
        .setDescription('Show an operator\'s information and attributes')
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

        await interaction.deferReply();

        const operatorEmbed = await buildInfoMessage(op, 0, 0, 0);
        return await interaction.editReply(operatorEmbed);
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const op = await getOperator({ query: idArr[1] });
        const type = parseInt(idArr[2]);
        const page = parseInt(idArr[3]);
        const level = parseInt(idArr[4]);

        const infoEmbed = await buildInfoMessage(op, type, page, level);
        await interaction.editReply(infoEmbed);
    }
}