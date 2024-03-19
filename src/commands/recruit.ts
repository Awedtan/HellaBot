import { ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../structures/Command';
import { buildRecruitMessage } from '../utils/build';

export default class RecruitCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('recruit')
        .setDescription('Find recruitable operators from recruitment tags');
    name = 'Recruit';
    description = ['Show an interactive recruitment tag calculator. Use the buttons to select/deselect their respective tags.'];
    usage = [
        '`/recruit`'
    ];
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        const placeholders = [
            await interaction.editReply('Loading...'),
            await interaction.followUp('Loading...'),
            await interaction.followUp('Loading...')
        ];
        const recruitEmbed = await buildRecruitMessage(1, '', true, placeholders.map(x => x.id));
        for (let i = 0; i < placeholders.length; i++) {
            await placeholders[i].edit(recruitEmbed[i]);
        }
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const value = parseInt(idArr[1]);
        const tag = idArr[2];
        const select = idArr[3] === 'select';
        const snowflakes = idArr.slice(4);

        const placeholders = await Promise.all(snowflakes.map(async x => await interaction.channel.messages.fetch(x)));
        const recruitEmbed = tag === 'delete'
            ? await buildRecruitMessage(1, '', true, snowflakes)
            : await buildRecruitMessage(value, tag, select, snowflakes);
        for (let i = 0; i < placeholders.length; i++) {
            await placeholders[i].edit(recruitEmbed[i]);
        }
    }
}