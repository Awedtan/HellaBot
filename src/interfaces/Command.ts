import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

export interface Command {
    data: SlashCommandBuilder;
    autocomplete?(interaction: AutocompleteInteraction): void;
    execute(interaction: ChatInputCommandInteraction): void;
}