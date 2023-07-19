import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export interface Command {
    data: SlashCommandBuilder | Omit<SlashCommandBuilder, any>;
    autocomplete?(interaction: AutocompleteInteraction): any;
    execute(interaction: ChatInputCommandInteraction): any;
}