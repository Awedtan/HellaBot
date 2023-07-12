import { SlashCommandBuilder } from 'discord.js';
import { operatorDict, skillDict } from '../data';
import { buildSkillEmbed, operatorAutocomplete } from '../utils';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skills')
        .setDescription('Show an operator\'s skills')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('Skill #')
                .setMinValue(1)
                .setMaxValue(3)
        ),
    async autocomplete(interaction) {
        const value = interaction.options.getFocused().toLowerCase();
        const callback = op => op.data.skills.length !== 0;
        const arr = operatorAutocomplete(value, callback);
        await interaction.respond(arr);
    },
    async execute(interaction) {
        const name = interaction.options.getString('name').toLowerCase();
        let index = interaction.options.getInteger('index') - 1;

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const op = operatorDict[name];

        if (op.data.skills.length === 0)
            return await interaction.reply({ content: 'That operator doesn\'t have any skills!', ephemeral: true });

        if (index !== -1 && index > op.data.skills.length - 1)
            index = -1;

        let first = true;

        for (let i = 0; i < op.data.skills.length; i++) {
            if (index !== -1 && index !== i) continue;

            const opSkill = op.data.skills[i];
            const skill = skillDict[opSkill.skillId];

            if (first) {
                const skillEmbed = buildSkillEmbed(skill, op, 0);
                await interaction.reply(skillEmbed);
                first = false;
            }
            else {
                const skillEmbed = buildSkillEmbed(skill, op, 0);
                await interaction.followUp(skillEmbed);
            }
        }
    }
}