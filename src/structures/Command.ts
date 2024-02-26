import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, SlashCommandBuilder, StringSelectMenuInteraction } from "discord.js";

export interface Command {
    data: SlashCommandBuilder;
    name: string;
    description: string[];
    usage: string[];
    autocomplete?(interaction: AutocompleteInteraction): any;
    execute(interaction: ChatInputCommandInteraction): any;
    buttonResponse?(interaction: ButtonInteraction, idArr: string[]): any;
    selectResponse?(interaction: StringSelectMenuInteraction, idArr: string[]): any;
}