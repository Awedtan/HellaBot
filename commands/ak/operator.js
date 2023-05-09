const { iconPath, operatorAvatarPath } = require('../../paths.json');
const { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const { fetchOperators } = require('../../utils/fetchData.js');

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
const archetypes = {
    tactician: 'Tactician',
    agent: 'Agent',
    pioneer: 'Pioneer',
    bearer: 'Flagbearer',
    charger: 'Charger',
    lord: 'Lord',
    fighter: 'Fighter',
    librator: 'Liberator',
    centurion: 'Centurion',
    sword: 'Swordmaster',
    fearless: 'Dreadnought',
    instructor: 'Instructor',
    artsfighter: 'Arts Fighter',
    musha: 'Musha',
    reaper: 'Reaper',
    unyield: 'Juggernaut',
    fortress: 'Fortress',
    guardian: 'Guardian',
    duelist: 'Duelist',
    protector: 'Protector',
    artsprotector: 'Arts Protector',
    closerange: 'Heavyshooter',
    aoesniper: 'Artilleryman',
    longrange: 'Deadeye',
    reapperrange: 'Spreadshooter',
    fastshot: 'Marksman',
    bombarder: 'Flinger',
    siegesniper: 'Beseiger',
    corecaster: 'Core Caster',
    phalanx: 'Phalanx Caster',
    mystic: 'Mystic Caster',
    funnel: 'Mech-Accord',
    chain: 'Chain Caster',
    splashcaster: 'Slash Caster',
    blastcaster: 'Blast Caster',
    incantationmedic: 'Incantation',
    healer: 'Therapist',
    physician: 'Medic',
    ringhealer: 'Multi-target Medic',
    chainhealer: 'Chain Healer',
    wandermedic: 'Wandering Medic',
    blessing: 'Abjurer',
    craftsman: 'Artificer',
    summoner: 'Summoner',
    underminer: 'Hexer',
    bard: 'Bard',
    slower: 'Decel Binder',
    executor: 'Executor',
    traper: 'Trapmaster',
    dollkeeper: 'Dollkeeper',
    merchant: 'Merchant',
    stalker: 'Ambusher',
    hookmaster: 'Hookmaster',
    pusher: 'Push Stroker',
    geek: 'Sacrificial Specialist'
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
    const op = operatorDict[operatorName].operatorData;
    const opId = operatorDict[operatorName].operatorId;
    
    const icon = new AttachmentBuilder(iconPath);
    const avatar = new AttachmentBuilder(`./${operatorAvatarPath}/${opId}.png`);

    const tagRegex = /<.ba\..{2,7}>|<\/>/;
    const name = op.name;
    const description = `**${professions[op.profession]} - ${archetypes[op.subProfessionId]}**\n${op.description.split(tagRegex).join('')}`;

    const embed = new EmbedBuilder()
        .setColor(0xebca60)
        .setAuthor({ name: 'Hellabot', iconURL: `attachment://${iconPath}` })
        .setTitle(name)
        .setThumbnail(`attachment://${opId}.png`)
        .setDescription(description);

    for (const talent of op.talents) {
        const candidate = talent.candidates[talent.candidates.length - 1];
        embed.addFields({ name: `Talent: ${candidate.name}`, value: candidate.description.split(tagRegex).join('') });
    }

    let potentialString = '';
    for (const potential of op.potentialRanks) {
        potentialString += `${potential.description}\n`;
    }
    embed.addFields({ name: 'Potentials', value: potentialString, inline: true });

    let trustString = '';
    const trustBonus = op.favorKeyFrames[1].data;
    for (const trustValue of Object.values(trustBonus)) {
        if (trustValue != 0 && trustValue != 0.0 && trustValue != false) {
            const trustStat = Object.keys(trustBonus).find(key => trustBonus[key] === trustValue).toUpperCase();
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
        { name: '\u200B', value: '**Stats**' },
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