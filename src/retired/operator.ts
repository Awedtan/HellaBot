const { operatorAvatarPath } = require('../../paths.json');
const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { fetchOperators, fetchArchetypes } = require('../utils/fetchData');
const { createRangeEmbedField, formatBlackboardText } = require('../utils/utils');

import { Operator } from '../utils/types';

const professions: { [key: string]: string } = {
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
        const operatorDict: { [key: string]: Operator } = fetchOperators();
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

function createOperatorEmbed(operatorName: string) {
    const operatorDict: { [key: string]: Operator } = fetchOperators();
    const archetypeDict: { [key: string]: string } = fetchArchetypes();
    const op = operatorDict[operatorName];
    const opData = op.data;
    const opId = op.id;
    const opMax = opData.phases[opData.phases.length - 1];

    const avatar = new AttachmentBuilder(`./${operatorAvatarPath}/${opId}.png`);

    let name = `${opData.name} - *`;
    for (let i = -1; i < opData.rarity; i++) {
        name += '★';
    }
    name += '*';

    const urlName = opData.name.split(' the ').join('-').split('\'').join('').split(' ').join('-').split('ë').join('e').split('ł').join('l');

    let description = formatBlackboardText(opData.description, []);
    if (opData.trait != null) {
        const candidate = opData.trait.candidates[opData.trait.candidates.length - 1];
        if (candidate.overrideDescripton != null) {
            description = formatBlackboardText(candidate.overrideDescripton, candidate.blackboard);
        }
    }

    const embedDescription = `**${professions[opData.profession]} - *${archetypeDict[opData.subProfessionId]}***\n${description}`;
    const rangeField = createRangeEmbedField(opMax.rangeId);

    const embed = new EmbedBuilder()
        .setColor(0xebca60)
        .setTitle(name)
        .setThumbnail(`attachment://${opId}.png`)
        .setURL(`https://gamepress.gg/arknights/operator/${urlName}`)
        .setDescription(embedDescription)
        .addFields(rangeField);

    for (const talent of opData.talents) {
        const candidate = talent.candidates[talent.candidates.length - 1];
        embed.addFields({ name: `*Talent:* ${candidate.name}`, value: formatBlackboardText(candidate.description, []) });
    }

    let potentialString = '';
    for (const potential of opData.potentialRanks) {
        potentialString += `${potential.description}\n`;
    }
    if (potentialString != '') {
        embed.addFields({ name: 'Potentials', value: potentialString, inline: true });
    }

    let trustString = '';
    const trustBonus: { [key: string]: number | boolean } = opData.favorKeyFrames[1].data;
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

    return { embeds: [embed], files: [avatar] };
}