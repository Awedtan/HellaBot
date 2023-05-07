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
            const enemyData = enemyDict[enemyName].enemyData.Value[0].enemyData;
            const icon = new AttachmentBuilder(iconPath);
            const image = new AttachmentBuilder(`./${enemyImagePath}/${enemyInfo.enemyId}.png`);

            const hp = enemyData.attributes.maxHp.m_value.toString();
            const atk = enemyData.attributes.atk.m_value.toString();
            const def = enemyData.attributes.def.m_value.toString();
            const res = enemyData.attributes.magicResistance.m_value.toString();
            const weight = enemyData.attributes.massLevel.m_value.toString();
            const life = enemyDict[enemyName].enemyData.Value[0].enemyData.lifePointReduce.m_defined ? enemyDict[enemyName].enemyData.Value[0].enemyData.lifePointReduce.m_value.toString() : '1';

            const silenceImmune = enemyData.attributes.silenceImmune.m_defined ? enemyData.attributes.silenceImmune.m_value : false;
            const stunImmune = enemyData.attributes.stunImmune.m_defined ? enemyData.attributes.stunImmune.m_value : false;
            const sleepImmune = enemyData.attributes.sleepImmune.m_defined ? enemyData.attributes.sleepImmune.m_value : false;
            const frozenImmune = enemyData.attributes.frozenImmune.m_defined ? enemyData.attributes.frozenImmune.m_value : false;
            const levitateImmune = enemyData.attributes.levitateImmune.m_defined ? enemyData.attributes.levitateImmune.m_value : false;

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`${enemyInfo.enemyIndex} - ${enemyInfo.name}`)
                .setAuthor({ name: 'Hellabot', iconURL: `attachment://${iconPath}`, url: 'https://discord.js.org' })
                .setDescription(enemyInfo.description)
                .setThumbnail(`attachment://${enemyInfo.enemyId}.png`)
                .addFields(
                    { name: '❤️ HP', value: hp, inline: true },
                    { name: '⚔️ ATK', value: atk, inline: true },
                    { name: '🛡️ DEF', value: def, inline: true },
                    { name: '✨ RES', value: res, inline: true },
                    { name: '⚖️ Weight', value: weight, inline: true },
                    { name: '💔 Life Points', value: life, inline: true },
                    { name: 'Silence', value: silenceImmune ? '❌' : '🤐', inline: true },
                    { name: 'Stun', value: stunImmune ? '❌' : '😵', inline: true },
                    { name: 'Sleep', value: sleepImmune ? '❌' : '😴', inline: true },
                    { name: 'Freeze', value: frozenImmune ? '❌' : '🥶', inline: true },
                    { name: 'Levitate', value: levitateImmune ? '❌' : '🌪️', inline: true });

            await interaction.reply({ embeds: [embed], files: [icon, image] });
        }
    }
}