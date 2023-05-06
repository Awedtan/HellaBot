const { iconPath } = require('../../config.json');
const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { fetchEnemies, fetchStages } = require('../../utils/fetchData.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stage')
        .setDescription('tbd')
        .addStringOption(option => option.setName('name')
            .setDescription('name')
            .setRequired(true)
        ),
    async execute(interaction) {
        const enemyDict = fetchEnemies();
        const stageDict = fetchStages();
        const stageName = interaction.options.getString('name');

        if (stageName in stageDict) {
            const stageInfo = stageDict[stageName].normal.stage;
            const stageData = stageDict[stageName].normal.stageData;
            const icon = new AttachmentBuilder(iconPath);

            const enemies = stageData.enemyDbRefs;

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle(`${stageInfo.code} - ${stageInfo.name}`)
                .setAuthor({ name: 'Hellabot', iconURL: `attachment://${iconPath}`, url: 'https://discord.js.org' });

            let enemyStr = '';
            for (const enemy of enemies) {
                const enemyInfo = enemyDict[enemy.id].enemy;
                enemyStr += `${enemyInfo.enemyIndex} - ${enemyInfo.name}\n`;
            }

            embed.addFields({ name: 'Enemies', value: enemyStr });

            await interaction.reply({ embeds: [embed], files: [icon] });
        }
    }
}