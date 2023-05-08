const { iconPath, operatorImagePath, operatorAvatarPath } = require('../../paths.json');
const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { fetchOperators } = require('../../utils/fetchData.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('operator')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name')
                .setRequired(true)
        ),
    async execute(interaction) {
        const operatorDict = fetchOperators();
        const operatorName = interaction.options.getString('name').toLowerCase();

        if (operatorDict.hasOwnProperty(operatorName)) {
            const op = operatorDict[operatorName].operatorData;
            const opId = operatorDict[operatorName].operatorId;
            const icon = new AttachmentBuilder(iconPath);
            const avatar = new AttachmentBuilder(`./${operatorAvatarPath}/${opId}.png`);
            const image = new AttachmentBuilder(`./${operatorImagePath}/${opId}_1.png`);

            const name = op.name;
            const description = `**${op.profession} - ${op.subProfessionId}**\n${op.description}`;

            const embed = new EmbedBuilder()
                .setColor(0xebca60)
                .setAuthor({ name: 'Hellabot', iconURL: `attachment://${iconPath}` })
                .setTitle(name)
                .setThumbnail(`attachment://${opId}.png`)
                .setDescription(description)
                .addFields({ name: '\u200B', value: '\u200B' });

            for (const talent of op.talents) {
                const candidate = talent.candidates[talent.candidates.length - 1];
                embed.addFields({ name: candidate.name, value: candidate.description },);
            }

            let potentialString = '';
            for (const potential of op.potentialRanks) {
                potentialString += `${potential.description}\n`;
            }
            embed.addFields(
                { name: '\u200B', value: '\u200B' },
                { name: 'Potentials', value: potentialString, inline: true }
            );

            let trustString = '';
            const trustBonus = op.favorKeyFrames[1].data;
            for (const trustValue of Object.values(trustBonus)) {
                if (trustValue != 0 && trustValue != 0.0 && trustValue != false) {
                    const trustStat = Object.keys(trustBonus).find(key => trustBonus[key] === trustValue);
                    trustString += `${trustStat} +${trustValue}\n`;
                }
            }
            embed.addFields({ name: 'Trust Bonus', value: trustString, inline: true });

            const maxStats = op.phases[op.phases.length - 1].attributesKeyFrames[1].data;
            const hp = maxStats.maxHp.toString();
            const atk = maxStats.atk.toString();
            const def = maxStats.def.toString();
            const res = maxStats.magicResistance.toString();
            const dpCost = maxStats.cost.toString();
            const block = maxStats.blockCnt.toString();
            const redeploy = maxStats.respawnTime.toString();
            const atkInterval = maxStats.baseAttackTime.toString();

            embed.addFields(
                { name: '\u200B', value: '\u200B' },
                { name: '❤️ HP', value: hp, inline: true },
                { name: '⚔️ ATK', value: atk, inline: true },
                { name: '🛡️ DEF', value: def, inline: true },
                { name: '✨ RES', value: res, inline: true },
                { name: '🏁 DP', value: dpCost, inline: true },
                { name: '✋ Block', value: block, inline: true },
                { name: '⌛ Redeploy Time', value: redeploy, inline: true },
                { name: '⏱️ Attack Interval', value: atkInterval, inline: true },
            );

            await interaction.reply({ embeds: [embed], files: [icon, avatar] });
        }
        else {
            await interaction.reply('That operator doesn\'t exist!');
        }
    }
}