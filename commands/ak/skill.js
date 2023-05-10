const { iconPath, skillImagePath } = require('../../paths.json');
const { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { fetchSkills } = require('../../utils/fetchData.js');
const { createRangeEmbedField, formatTextBlackboardTags } = require('../../utils/utils.js');

const levelId = { l1: 0, l2: 1, l3: 2, l4: 3, l5: 4, l6: 5, l7: 6, m1: 7, m2: 8, m3: 9 };
const skillLevels = ['Lv1', 'Lv2', 'Lv3', 'Lv4', 'Lv5', 'Lv6', 'Lv7', 'M1', 'M2', 'M3'];
const skillTypes = ['Passive', 'Manual Trigger', 'Auto Trigger'];
const spTypes = [undefined, 'Per Second', 'Offensive', undefined, 'Defensive', undefined, undefined, undefined, 'Passive'];

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
            this.replySkillEmbed(interaction, skillName);
        }
        else {
            await interaction.reply('That skill doesn\'t exist!');
        }
    },
    async replySkillEmbed(interaction, skillName) {
        let level = 0;
        const skillEmbed = createSkillEmbed(skillName, level);
        let response = await interaction.reply(skillEmbed);

        while (true) {
            try {
                const confirm = await response.awaitMessageComponent({ time: 300000 });
                level = levelId[confirm.customId];
                try {
                    await confirm.update({ content: '' });
                } catch (e) {
                    continue;
                }
                response = await response.edit(createSkillEmbed(skillName, level));
            } catch (e) {
                console.log(e);
                await response.edit({ embeds: skillEmbed.embeds, files: skillEmbed.files, components: [] });
                break;
            }
        }
    },
    async sendSkillEmbed(channel, skillName) {
        let level = 0;
        const skillEmbed = createSkillEmbed(skillName, level);
        let response = await channel.send(skillEmbed);

        while (true) {
            try {
                const confirm = await response.awaitMessageComponent({ time: 300000 });
                level = levelId[confirm.customId];
                try {
                    await confirm.update({ content: '' });
                } catch (e) {
                    continue;
                }
                response = await response.edit(createSkillEmbed(skillName, level));
            } catch (e) {
                console.log(e);
                await response.edit({ embeds: skillEmbed.embeds, files: skillEmbed.files, components: [] });
                break;
            }
        }
    },
}

function createSkillEmbed(skillName, level) {
    const skillDict = fetchSkills()
    const skill = skillDict[skillName];
    const baseSkill = skill.levels[level];

    const icon = new AttachmentBuilder(iconPath);
    const imagePath = skill.iconId === null ? skill.skillId : skill.iconId;
    const image = new AttachmentBuilder(`./${skillImagePath}/skill_icon_${imagePath}.png`);

    const name = `${baseSkill.name} - ${skillLevels[level]}`;
    const spCost = baseSkill.spData.spCost;
    const initSp = baseSkill.spData.initSp;
    const spType = spTypes[baseSkill.spData.spType];
    const skillType = skillTypes[baseSkill.skillType];

    const description = formatTextBlackboardTags(baseSkill.description, baseSkill.blackboard);
    const embedDescription = `**${spType} - ${skillType}**\n***Cost:* ${spCost} SP - *Initial:* ${initSp} SP**\n${description} `;

    const embed = new EmbedBuilder()
        .setColor(0xebca60)
        .setAuthor({ name: 'Hellabot', iconURL: `attachment://${iconPath}` })
        .setTitle(name)
        .setThumbnail(`attachment://skill_icon_${imagePath.split(/\[|\]/).join('')}.png`)
        .setDescription(embedDescription);

    if (baseSkill.rangeId != null) {
        const rangeField = createRangeEmbedField(baseSkill.rangeId);
        embed.addFields(rangeField);
    }

    const lOne = new ButtonBuilder()
        .setCustomId('l1')
        .setLabel('Lv1')
        .setStyle(ButtonStyle.Secondary);
    const lTwo = new ButtonBuilder()
        .setCustomId('l2')
        .setLabel('Lv2')
        .setStyle(ButtonStyle.Secondary);
    const lThree = new ButtonBuilder()
        .setCustomId('l3')
        .setLabel('Lv3')
        .setStyle(ButtonStyle.Secondary);
    const lFour = new ButtonBuilder()
        .setCustomId('l4')
        .setLabel('Lv4')
        .setStyle(ButtonStyle.Secondary);
    const lFive = new ButtonBuilder()
        .setCustomId('l5')
        .setLabel('Lv5')
        .setStyle(ButtonStyle.Secondary);
    const lSix = new ButtonBuilder()
        .setCustomId('l6')
        .setLabel('Lv6')
        .setStyle(ButtonStyle.Secondary);
    const lSeven = new ButtonBuilder()
        .setCustomId('l7')
        .setLabel('Lv7')
        .setStyle(ButtonStyle.Secondary);
    const mOne = new ButtonBuilder()
        .setCustomId('m1')
        .setLabel('M1')
        .setStyle(ButtonStyle.Secondary);
    const mTwo = new ButtonBuilder()
        .setCustomId('m2')
        .setLabel('M2')
        .setStyle(ButtonStyle.Secondary);
    const mThree = new ButtonBuilder()
        .setCustomId('m3')
        .setLabel('M3')
        .setStyle(ButtonStyle.Secondary);

    if (skill.levels.length === 7) {
        mOne.setDisabled(true);
        mTwo.setDisabled(true);
        mThree.setDisabled(true);
    }

    switch (level) {
        case 0:
            lOne.setDisabled(true);
            break;
        case 1:
            lTwo.setDisabled(true);
            break;
        case 2:
            lThree.setDisabled(true);
            break;
        case 3:
            lFour.setDisabled(true);
            break;
        case 4:
            lFive.setDisabled(true);
            break;
        case 5:
            lSix.setDisabled(true);
            break;
        case 6:
            lSeven.setDisabled(true);
            break;
        case 7:
            mOne.setDisabled(true);
            break;
        case 8:
            mTwo.setDisabled(true);
            break;
        case 9:
            mThree.setDisabled(true);
            break;
    }

    const rowOne = new ActionRowBuilder().addComponents(lOne, lTwo, lThree, lFour, lFive);
    const rowTwo = new ActionRowBuilder().addComponents(lSix, lSeven, mOne, mTwo, mThree);

    return { embeds: [embed], files: [icon, image], components: [rowOne, rowTwo] };
}