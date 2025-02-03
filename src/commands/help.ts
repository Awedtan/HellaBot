import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import { globalCommands } from '../structures/HellaBot';
import { buildHelpListMessage, buildHelpMessage } from '../utils/build';

export default class HelpCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show help info')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Command name')
                // .addChoices(
                //     ...Object.values(globalCommands).map(command => { return { name: command.data.name, value: command.data.name } })
                // )
        ) as SlashCommandBuilder;
    name = 'Help';
    description = ['Show information on commands. If no command is specified, show a list of all commands.'];
    usage = [
        '`/help`',
        '`/help [command]`'
    ];
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('command')?.toLowerCase();

        await interaction.deferReply();

        const helpEmbed = name ? await buildHelpMessage(name) : await buildHelpListMessage();
        return await interaction.editReply(helpEmbed);
    }
}