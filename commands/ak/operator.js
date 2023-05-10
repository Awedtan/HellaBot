const { iconPath, operatorAvatarPath } = require('../../paths.json');
const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { fetchOperators, fetchArchetypes } = require('../../utils/fetchData.js');
const { createRangeEmbedField, formatTextBlackboardTags } = require('../../utils/utils.js');

const professions = {
    PIONEER: 'Vanguard',
    WARRIOR: 'Guard',
    TANK: 'Defender',
    SNIPER: 'Sniper',
    CASTER: 'Caster',
    MEDIC: 'Medic',
    SUPPORT: 'Supporter',
    SPECIAL: 'Specialist'
};

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
            const operatorEmbed = createOperatorEmbed(operatorName);
            await interaction.reply(operatorEmbed);
        }
        else {
            await interaction.reply('That operator doesn\'t exist!');
        }
    }
}

function createOperatorEmbed(operatorName) {
    const operatorDict = fetchOperators();
    const archetypeDict = fetchArchetypes();
    const op = operatorDict[operatorName].data;
    const opId = operatorDict[operatorName].id;
    const opMax = op.phases[op.phases.length - 1];

    const icon = new AttachmentBuilder(iconPath);
    const avatar = new AttachmentBuilder(`./${operatorAvatarPath}/${opId}.png`);

    const name = op.name;

    let description = formatTextBlackboardTags(op.description, []);
    if (op.trait != null) {
        const candidate = op.trait.candidates[op.trait.candidates.length - 1];
        if (candidate.overrideDescripton != null) {
            description = formatTextBlackboardTags(candidate.overrideDescripton, candidate.blackboard);
        }
    }

    const embedDescription = `***${professions[op.profession]}* - ${archetypeDict[op.subProfessionId]}**\n${description}`;
    const rangeField = createRangeEmbedField(opMax.rangeId);

    const embed = new EmbedBuilder()
        .setColor(0xebca60)
        .setAuthor({ name: 'Hellabot', iconURL: `attachment://${iconPath}` })
        .setTitle(name)
        .setThumbnail(`attachment://${opId}.png`)
        .setDescription(embedDescription)
        .addFields(rangeField);

    for (const talent of op.talents) {
        const candidate = talent.candidates[talent.candidates.length - 1];
        embed.addFields({ name: `*Talent:* ${candidate.name}`, value: formatTextBlackboardTags(candidate.description, []) });
    }

    let potentialString = '';
    for (const potential of op.potentialRanks) {
        potentialString += `${potential.description}\n`;
    }
    if (potentialString != '') {
        embed.addFields({ name: 'Potentials', value: potentialString, inline: true });
    }

    let trustString = '';
    const trustBonus = op.favorKeyFrames[1].data;
    for (const trustKey of Object.keys(trustBonus)) {
        const trustValue = trustBonus[trustKey];
        if (trustValue != 0 && trustValue != 0.0 && trustValue != false) {
            trustString += `${trustKey.toUpperCase()} +${trustValue}\n`;
        }
    }
    embed.addFields({ name: 'Trust Bonus', value: trustString, inline: true });

    const maxStats = opMax.attributesKeyFrames[1].data;
    const hp = maxStats.maxHp.toString();
    const atk = maxStats.atk.toString();
    const def = maxStats.def.toString();
    const res = maxStats.magicResistance.toString();
    const dpCost = maxStats.cost.toString();
    const block = maxStats.blockCnt.toString();
    const redeploy = maxStats.respawnTime.toString();
    const atkInterval = maxStats.baseAttackTime.toString();

    embed.addFields(
        { name: '\u200B', value: '**Max Stats**' },
        { name: '❤️ HP', value: hp, inline: true },
        { name: '⚔️ ATK', value: atk, inline: true },
        { name: '🛡️ DEF', value: def, inline: true },
        { name: '✨ RES', value: res, inline: true },
        { name: '🏁 DP', value: dpCost, inline: true },
        { name: '✋ Block', value: block, inline: true },
        { name: '⌛ Redeploy Time', value: redeploy, inline: true },
        { name: '⏱️ Attack Interval', value: atkInterval, inline: true },
    );

    return { embeds: [embed], files: [icon, avatar] };
}