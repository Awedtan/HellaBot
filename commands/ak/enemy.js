const { iconPath, enemyImagePath } = require('../../config.json');
const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { fetchEnemies } = require('../../utils/fetchData.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('enemy')
        .setDescription('tbd')
        .addStringOption(option => option.setName('name')
            .setDescription('name')
            .setRequired(true)
        ),
    async execute(interaction) {
        const enemyDict = fetchEnemies();
        const enemyName = interaction.options.getString('name').toLowerCase();

        if (enemyName in enemyDict) {
            const enemyInfo = enemyDict[enemyName].enemy;
            const enemyStats = enemyDict[enemyName].enemyData.Value[0].enemyData.attributes;
            const icon = new AttachmentBuilder(iconPath);
            const image = new AttachmentBuilder(`./${enemyImagePath}/${enemyInfo.enemyId}.png`);

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`${enemyInfo.enemyIndex} - ${enemyInfo.name}`)
                .setAuthor({ name: 'Hellabot', iconURL: `attachment://${iconPath}`, url: 'https://discord.js.org' })
                .setDescription(enemyInfo.description)
                .setThumbnail(`attachment://${enemyInfo.enemyId}.png`)
                .addFields(
                    { name: '❤️ HP', value: enemyStats.maxHp.m_value.toString(), inline: true },
                    { name: '⚔️ ATK', value: enemyStats.atk.m_value.toString(), inline: true },
                    { name: '🛡️ DEF', value: enemyStats.def.m_value.toString(), inline: true },
                    { name: '✨ RES', value: enemyStats.magicResistance.m_value.toString(), inline: true },
                    { name: '⚖️ Weight', value: enemyStats.massLevel.m_value.toString(), inline: true },
                    { name: '💔 Life Points', value: enemyDict[enemyName].enemyData.Value[0].enemyData.lifePointReduce.m_value.toString(), inline: true },
                    { name: 'Silence', value: enemyStats.silenceImmune.m_value ? '❌' : '🤐', inline: true },
                    { name: 'Stun', value: enemyStats.stunImmune.m_value ? '❌' : '😵', inline: true },
                    { name: 'Sleep', value: enemyStats.sleepImmune.m_value ? '❌' : '😴', inline: true },
                    { name: 'Freeze', value: enemyStats.frozenImmune.m_value ? '❌' : '🥶', inline: true },
                    { name: 'Levitate', value: enemyStats.levitateImmune.m_value ? '❌' : '🌪️', inline: true });

            await interaction.reply({ embeds: [embed], files: [icon, image] });
        }
    }
}