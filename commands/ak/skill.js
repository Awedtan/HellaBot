const { iconPath, skillImagePath } = require('../../paths.json');
const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { fetchSkills } = require('../../utils/fetchData.js');

const skillLevels = ['Lv1', 'Lv2', 'Lv3', 'Lv4', 'Lv5', 'Lv6', 'Lv7', 'M1', 'M2', 'M3'];
const skillTypes = ['Passive', 'Manual Trigger', 'Auto Trigger'];
const spTypes = [undefined, 'Per Second', 'Offensive', undefined, 'Defensive'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skill')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const skillDict = fetchSkills();
        const skillName = interaction.options.getString('name').toLowerCase();

        if (skillDict.hasOwnProperty(skillName)) {
            const skill = skillDict[skillName];
            const baseSkill = skill.levels[0];
            const icon = new AttachmentBuilder(iconPath);
            const image = new AttachmentBuilder(`./${skillImagePath}/skill_icon_${skill.skillId}.png`);

            const skillKeys = {};
            for (const level of skill.levels) {
                const key = level.blackboard[0].key;
                const value = level.blackboard[0].value;

                if (skillKeys[key] === undefined) {
                    skillKeys[key] = [];
                }
                skillKeys[key].push(value);
            }

            const name = baseSkill.name;
            let description = `**${skillTypes[baseSkill.skillType]} - ${spTypes[baseSkill.spData.spType]}**\n\n${baseSkill.description.split(/<@ba.vup>|<\/>|:0%|{|}/).join('')}`;

            for (const key of Object.keys(skillKeys)) {
                description = description.split(key).join(`{${key}}`);
            }

            const embed = new EmbedBuilder()
                .setColor(0xebca60)
                .setAuthor({ name: 'Hellabot', iconURL: `attachment://${iconPath}` })
                .setTitle(name)
                .setThumbnail(`attachment://skill_icon_${skill.skillId}.png`)
                .setDescription(description);

            embed.addFields({ name: '\u200B', value: 'Lv1\nLv2\nLv3\nLv4\nLv5\nLv6\nLv7\nM1\nM2\nM3', inline: true });

            for (const key of Object.keys(skillKeys)) {
                let keyString = '';
                for (const value of skillKeys[key]) {
                    keyString += `${value}\n`;
                }
                embed.addFields({ name: key, value: keyString, inline: true });
            }

            await interaction.reply({ embeds: [embed], files: [icon, image] });
        }
        else {
            await interaction.reply('That skill doesn\'t exist!');
        }
    }
}