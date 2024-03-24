import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../structures/Command';
import CCCommand from './cc'; // replace with the correct path to CCCommand
import BaseCommand from './base';
import ArtCommand from './art';
import CostCommand from './costs';
import DefineCommand from './define';
import EnemyCommand from './enemy';
import EventCommand from './events';
import InfoCommand from './info';
import IS2Command from './is2';
import IS3Command from './is3';
import ItemCommand from './item';
import ModuleCommand from './modules';
import ParadoxCommand from './paradox';
import RACommand from './ra';
import RecruitCommand from './recruit';
import SkillCommand from './skills';
import SpineCommand from './spine';
import StageCommand from './stage';

export default class HelpCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display help information about commands');

    async execute(interaction: ChatInputCommandInteraction) {
        // Replace these with your actual command classes
        const commands = [new CCCommand(), new ArtCommand(), new BaseCommand(), new CCCommand(), new CostCommand(), new DefineCommand(), new EnemyCommand(), new EventCommand(), new InfoCommand(), new IS2Command(), new IS3Command(), new ItemCommand(), new ModuleCommand(), new ParadoxCommand(), new RACommand(), new RecruitCommand(), new SkillCommand(), new SpineCommand(), new StageCommand()];

        const helpEmbed = {
            title: 'Command Help',
            description: 'List of available commands and their descriptions:',
            fields: commands.map((command) => ({
                name: `/${command.data.name}`,
                value: command.data.description,
                inline: false,
            })),
        };

        await interaction.reply({ embeds: [helpEmbed] });
    }
}
