import { ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import { buildRecruitMessage } from '../utils/build';

const tagOptions = [
    // { name: 'Starter', value: 'starter' },
    // { name: 'Senior', value: 'senior' },
    // { name: 'Top', value: 'top' },
    // { name: 'Robot', value: 'robot' },
    { name: 'Melee', value: 'melee' },
    { name: 'Ranged', value: 'ranged' },
    { name: 'Guard', value: 'guard' },
    { name: 'Medic', value: 'medic' },
    { name: 'Vanguard', value: 'vanguard' },
    { name: 'Caster', value: 'caster' },
    { name: 'Sniper', value: 'sniper' },
    { name: 'Defender', value: 'defender' },
    { name: 'Supporter', value: 'supporter' },
    { name: 'Specialist', value: 'specialist' },
    { name: 'Healing', value: 'healing' },
    { name: 'Support', value: 'support' },
    { name: 'DPS', value: 'dps' },
    { name: 'AOE', value: 'aoe' },
    { name: 'Slow', value: 'slow' },
    { name: 'Survival', value: 'survival' },
    { name: 'Defense', value: 'defense' },
    { name: 'Debuff', value: 'debuff' },
    { name: 'Shift', value: 'shift' },
    { name: 'Crowd-Control', value: 'crowd-control' },
    { name: 'Nuker', value: 'nuker' },
    { name: 'Summon', value: 'summon' },
    { name: 'Fast-Redeploy', value: 'fast-redeploy' },
    { name: 'DP-Recovery', value: 'dp-recovery' },
    { name: 'Elemental', value: 'elemental' }
];

export default class RecruitCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('recruit')
        .setDescription('Find recruitable operators from recruitment tags')
        .addStringOption(option =>
            option.setName('tag1')
                .setDescription('Tag 1')
                .addChoices(tagOptions)
        )
        .addStringOption(option =>
            option.setName('tag2')
                .setDescription('Tag 2')
                .addChoices(tagOptions)
        )
        .addStringOption(option =>
            option.setName('tag3')
                .setDescription('Tag 3')
                .addChoices(tagOptions)
        )
        .addStringOption(option =>
            option.setName('tag4')
                .setDescription('Tag 4')
                .addChoices(tagOptions)
        )
        .addStringOption(option =>
            option.setName('tag5')
                .setDescription('Tag 5')
                .addChoices(tagOptions)
        ) as SlashCommandBuilder;
    name = 'Recruit';
    description = ['Show an interactive recruitment tag calculator. Use the buttons to select/deselect their respective tags.',
        'You can preseed tags by providing up to 5 tags as command arguments. Qualification tags (Starter, Senior, Top) are not included as preseed options due to Discord\'s 25 option limit.'
    ];
    usage = [
        '`/recruit`',
        '`/recruit [tag1] [tag2] [tag3] [tag4] [tag5]`'
    ];
    async execute(interaction: ChatInputCommandInteraction) {
        const tags = [
            interaction.options.getString('tag1') ?? '',
            interaction.options.getString('tag2') ?? '',
            interaction.options.getString('tag3') ?? '',
            interaction.options.getString('tag4') ?? '',
            interaction.options.getString('tag5') ?? ''
        ];

        await interaction.deferReply();

        const placeholders = [
            await interaction.editReply('Loading...'),
            await interaction.followUp('Loading...'),
            await interaction.followUp('Loading...')
        ];
        const recruitEmbed = await buildRecruitMessage(1, tags, true, placeholders.map(x => x.id));
        for (let i = 0; i < placeholders.length; i++) {
            await interaction.editReply({ message: placeholders[i], content: recruitEmbed[i].content, embeds: recruitEmbed[i].embeds, components: recruitEmbed[i].components });
        }
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const value = parseInt(idArr[1]);
        const tag = idArr[2];
        const select = idArr[3] === 'select';
        const snowflakes = idArr.slice(4);

        // https://discordjs.guide/additional-info/changes-in-v13.html#dm-channels
        // apparently as of discord.js v13, DM channels are no longer being cached
        // so if the interaction channel is null, assume it's a DM and fetch the channel manually
        const channel = interaction.channel ?? await interaction.user.createDM();
        const placeholders = await Promise.all(snowflakes.map(async x => await channel.messages.fetch(x)));
        const recruitEmbed = tag === 'delete'
            ? await buildRecruitMessage(1, [''], true, snowflakes)
            : await buildRecruitMessage(value, [tag], select, snowflakes);
        await interaction.update({});
        for (let i = 0; i < placeholders.length; i++) {
            await placeholders[i].edit(recruitEmbed[i]);
        }
    }
}