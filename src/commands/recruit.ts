const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('../utils/fetch');
const create = require('../utils/create');

import { Operator } from '../types';

const tagValues: { [key: string]: number } = { // prime number method for shits and giggles
    starter: 2,
    'senior operator': 3,
    'top operator': 5,
    melee: 7,
    ranged: 11,
    guard: 13,
    medic: 17,
    vanguard: 19,
    caster: 23,
    sniper: 29,
    defender: 31,
    supporter: 37,
    specialist: 41,
    healing: 43,
    support: 47,
    dps: 53,
    aoe: 59,
    slow: 61,
    survival: 67,
    defense: 71,
    debuff: 73,
    shift: 79,
    'crowd control': 83,
    nuker: 89,
    summon: 97,
    'fast-redeploy': 101,
    'dp-recovery': 103,
    robot: 107
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recruit')
        .setDescription('tbd'),
    async execute(interaction) {

        const qualEmbed = new EmbedBuilder()
            .setColor(0xebca60)
            .setTitle('Qualifications');
        const starterButton = new ButtonBuilder()
            .setCustomId('starter')
            .setLabel('Starter')
            .setStyle(ButtonStyle.Secondary);
        const seniorButton = new ButtonBuilder()
            .setCustomId('senior')
            .setLabel('Senior Operator')
            .setStyle(ButtonStyle.Secondary);
        const topButton = new ButtonBuilder()
            .setCustomId('top')
            .setLabel('Top Operator')
            .setStyle(ButtonStyle.Secondary);
        const qualRow = new ActionRowBuilder().addComponents(starterButton, seniorButton, topButton);
        await interaction.reply({ embeds: [qualEmbed], components: [qualRow] });

        const posEmbed = new EmbedBuilder()
            .setColor(0xebca60)
            .setTitle('Position');
        const meleeButton = new ButtonBuilder()
            .setCustomId('melee')
            .setLabel('Melee')
            .setStyle(ButtonStyle.Secondary);
        const rangedButton = new ButtonBuilder()
            .setCustomId('ranged')
            .setLabel('Ranged')
            .setStyle(ButtonStyle.Secondary);
        const posRow = new ActionRowBuilder().addComponents(meleeButton, rangedButton);
        await interaction.channel.send({ embeds: [posEmbed], components: [posRow] });

        const classEmbed = new EmbedBuilder()
            .setColor(0xebca60)
            .setTitle('Class');
        const guardButton = new ButtonBuilder()
            .setCustomId('guard')
            .setLabel('Guard')
            .setStyle(ButtonStyle.Secondary);
        const medicButton = new ButtonBuilder()
            .setCustomId('medic')
            .setLabel('Medic')
            .setStyle(ButtonStyle.Secondary);
        const vanguardButton = new ButtonBuilder()
            .setCustomId('vanguard')
            .setLabel('Vanguard')
            .setStyle(ButtonStyle.Secondary);
        const casterButton = new ButtonBuilder()
            .setCustomId('caster')
            .setLabel('Caster')
            .setStyle(ButtonStyle.Secondary);
        const sniperButton = new ButtonBuilder()
            .setCustomId('sniper')
            .setLabel('Sniper')
            .setStyle(ButtonStyle.Secondary);
        const defenderButton = new ButtonBuilder()
            .setCustomId('defender')
            .setLabel('Defender')
            .setStyle(ButtonStyle.Secondary);
        const supporterButton = new ButtonBuilder()
            .setCustomId('supporter')
            .setLabel('Supporter')
            .setStyle(ButtonStyle.Secondary);
        const specialistButton = new ButtonBuilder()
            .setCustomId('specialist')
            .setLabel('Specialist')
            .setStyle(ButtonStyle.Secondary);
        const classRow1 = new ActionRowBuilder().addComponents(guardButton, medicButton, vanguardButton, casterButton, sniperButton);
        const classRow2 = new ActionRowBuilder().addComponents(defenderButton, supporterButton, specialistButton);
        await interaction.channel.send({ embeds: [classEmbed], components: [classRow1, classRow2] });

        const tagEmbed = new EmbedBuilder()
            .setColor(0xebca60)
            .setTitle('Tags');
        const healingButton = new ButtonBuilder()
            .setCustomId('healing')
            .setLabel('Healing')
            .setStyle(ButtonStyle.Secondary);
        const supportButton = new ButtonBuilder()
            .setCustomId('support')
            .setLabel('Support')
            .setStyle(ButtonStyle.Secondary);
        const dpsButton = new ButtonBuilder()
            .setCustomId('dps')
            .setLabel('DPS')
            .setStyle(ButtonStyle.Secondary);
        const aoeButton = new ButtonBuilder()
            .setCustomId('aoe')
            .setLabel('AOE')
            .setStyle(ButtonStyle.Secondary);
        const slowButton = new ButtonBuilder()
            .setCustomId('slow')
            .setLabel('Slow')
            .setStyle(ButtonStyle.Secondary);
        const survivalButton = new ButtonBuilder()
            .setCustomId('survival')
            .setLabel('Survival')
            .setStyle(ButtonStyle.Secondary);
        const defenseButton = new ButtonBuilder()
            .setCustomId('defense')
            .setLabel('Defense')
            .setStyle(ButtonStyle.Secondary);
        const debuffButton = new ButtonBuilder()
            .setCustomId('debuff')
            .setLabel('Debuff')
            .setStyle(ButtonStyle.Secondary);
        const shiftButton = new ButtonBuilder()
            .setCustomId('shift')
            .setLabel('Shift')
            .setStyle(ButtonStyle.Secondary);
        const crowdControlButton = new ButtonBuilder()
            .setCustomId('crowd-control')
            .setLabel('Crowd Control')
            .setStyle(ButtonStyle.Secondary);
        const nukerButton = new ButtonBuilder()
            .setCustomId('nuker')
            .setLabel('Nuker')
            .setStyle(ButtonStyle.Secondary);
        const summonButton = new ButtonBuilder()
            .setCustomId('summon')
            .setLabel('Summon')
            .setStyle(ButtonStyle.Secondary);
        const fastRedeployButton = new ButtonBuilder()
            .setCustomId('fast-redeploy')
            .setLabel('Fast-Redeploy')
            .setStyle(ButtonStyle.Secondary);
        const dpRecoveryButton = new ButtonBuilder()
            .setCustomId('dp-recovery')
            .setLabel('DP-Recovery')
            .setStyle(ButtonStyle.Secondary);
        const robotButton = new ButtonBuilder()
            .setCustomId('robot')
            .setLabel('Robot')
            .setStyle(ButtonStyle.Secondary);

        const tagRow1 = new ActionRowBuilder().addComponents(healingButton, supportButton, dpsButton, aoeButton, slowButton);
        const tagRow2 = new ActionRowBuilder().addComponents(survivalButton, defenseButton, debuffButton, shiftButton, crowdControlButton);
        const tagRow3 = new ActionRowBuilder().addComponents(nukerButton, summonButton, fastRedeployButton, dpRecoveryButton, robotButton);

        await interaction.channel.send({ embeds: [tagEmbed], components: [tagRow1, tagRow2, tagRow3] });
        
        
    }
}