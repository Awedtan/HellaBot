import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { buildNewMessage } from '../utils/build';

export default class NewCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('new')
        .setDescription('Show newly updated game data') as SlashCommandBuilder;
    name = 'New';
    description = ['Show newly updated game data.'];
    usage = [
        '`/new`'
    ];
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        
        const newEmbed = await buildNewMessage();
        return await interaction.editReply(newEmbed);
    }
}