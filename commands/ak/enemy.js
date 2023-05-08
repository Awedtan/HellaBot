const { iconPath, enemyImagePath } = require('../../paths.json');
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

        if (enemyDict.hasOwnProperty(enemyName)) {
            const enemyInfo = enemyDict[enemyName].excel;
            const enemyData = enemyDict[enemyName].levels.Value[0].enemyData;
            const icon = new AttachmentBuilder(iconPath);
            const image = new AttachmentBuilder(`./${enemyImagePath}/${enemyInfo.enemyId}.png`);

            const hp = enemyData.attributes.maxHp.m_value.toString();
            const atk = enemyData.attributes.atk.m_value.toString();
            const def = enemyData.attributes.def.m_value.toString();
            const res = enemyData.attributes.magicResistance.m_value.toString();
            const weight = enemyData.attributes.massLevel.m_value.toString();
            const life = enemyData.lifePointReduce.m_defined ? enemyData.lifePointReduce.m_value.toString() : '1';

            const silenceImmune = enemyData.attributes.silenceImmune.m_defined ? enemyData.attributes.silenceImmune.m_value : false;
            const stunImmune = enemyData.attributes.stunImmune.m_defined ? enemyData.attributes.stunImmune.m_value : false;
            const sleepImmune = enemyData.attributes.sleepImmune.m_defined ? enemyData.attributes.sleepImmune.m_value : false;
            const frozenImmune = enemyData.attributes.frozenImmune.m_defined ? enemyData.attributes.frozenImmune.m_value : false;
            const levitateImmune = enemyData.attributes.levitateImmune.m_defined ? enemyData.attributes.levitateImmune.m_value : false;

            const embed = new EmbedBuilder()
                .setColor(0xebca60)
                .setAuthor({ name: 'Hellabot', iconURL: `attachment://${iconPath}` })
                .setTitle(`${enemyInfo.enemyIndex} - ${enemyInfo.name}`)
                .setThumbnail(`attachment://${enemyInfo.enemyId}.png`)
                .setDescription(enemyInfo.description)
                .addFields(
                    { name: '❤️ HP', value: hp, inline: true },
                    { name: '⚔️ ATK', value: atk, inline: true },
                    { name: '🛡️ DEF', value: def, inline: true },
                    { name: '✨ RES', value: res, inline: true },
                    { name: '⚖️ Weight', value: weight, inline: true },
                    { name: '💔 Life Points', value: life, inline: true },
                    { name: 'Silence', value: silenceImmune ? '❌' : '✅', inline: true },
                    { name: 'Stun', value: stunImmune ? '❌' : '✅', inline: true },
                    { name: 'Sleep', value: sleepImmune ? '❌' : '✅', inline: true },
                    { name: 'Freeze', value: frozenImmune ? '❌' : '✅', inline: true },
                    { name: 'Levitate', value: levitateImmune ? '❌' : '✅', inline: true }
                );
            await interaction.reply({ embeds: [embed], files: [icon, image] });
        }
        else {
            await interaction.reply('That enemy doesn\'t exist!');
        }
    }
}