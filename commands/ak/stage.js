const { iconPath, stageImagePath } = require('../../paths.json');
const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { fetchEnemies, fetchStages } = require('../../utils/fetchData.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stage')
        .setDescription('tbd')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('name')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('difficulty')
                .setDescription('difficulty')
                .addChoices(
                    { name: 'Normal', value: 'normal' },
                    { name: 'Challenge', value: 'challenge' }
                )
        ),
    async execute(interaction) {
        const stageDict = fetchStages();
        const stageName = interaction.options.getString('name').toLowerCase();
        const stageMode = interaction.options.getString('difficulty');

        if (stageDict.hasOwnProperty(stageName)) {
            const stage = stageDict[stageName];
            const isChallenge = stageMode === 'challenge';
            const stageInfo = isChallenge ? stage.challenge.excel : stage.normal.excel;
            const stageData = isChallenge ? stage.challenge.levels : stage.normal.levels;

            if (stageInfo === undefined || stageData === undefined) {
                await interaction.reply('The stage data doesn\'t exist!');
                return;
            }

            const icon = new AttachmentBuilder(iconPath);
            const titleString = isChallenge ? `Challenge ${stageInfo.code} - ${stageInfo.name}` : `${stageInfo.code} - ${stageInfo.name}`;

            const embed = new EmbedBuilder()
                .setColor(0xebca60)
                .setTitle(titleString)
                .setAuthor({ name: 'Hellabot', iconURL: `attachment://${iconPath}`, url: 'https://discord.js.org' }
                );

            const stageEnemies = stageData.enemyDbRefs;
            const enemyDict = fetchEnemies();
            let enemyString = '', eliteString = '', bossString = '';
            for (const enemy of stageEnemies) {
                if (enemyDict.hasOwnProperty(enemy.id)) {
                    const enemyInfo = enemyDict[enemy.id].excel;
                    switch (enemyInfo.enemyLevel) {
                        case ('NORMAL'):
                            enemyString += `${enemyInfo.enemyIndex} - ${enemyInfo.name}\n`;
                            break;
                        case ('ELITE'):
                            eliteString += `${enemyInfo.enemyIndex} - ${enemyInfo.name}\n`;
                            break;
                        case ('BOSS'):
                            bossString += `${enemyInfo.enemyIndex} - ${enemyInfo.name}\n`;
                            break;
                    }
                }
            }

            if (enemyString != '') {
                embed.addFields({ name: 'Enemies', value: enemyString, inline: true });
            }
            if (eliteString != '') {
                embed.addFields({ name: 'Elites', value: eliteString, inline: true });
            }
            if (bossString != '') {
                embed.addFields({ name: 'Leaders', value: bossString, inline: true });
            }

            // Not all stage images were found in the .obb file
            // TODO: find some other way of getting them
            try {
                const image = new AttachmentBuilder(`${stageImagePath}/${stageInfo.stageId}.png`);
                embed.setImage(`attachment://${stageInfo.stageId}.png`);
                await interaction.reply({ embeds: [embed], files: [icon, image] });
            } catch (e) {
                await interaction.reply({ embeds: [embed], files: [icon] });
            }
        }
        else {
            await interaction.reply('That stage doesn\'t exist!');
        }
    }
}