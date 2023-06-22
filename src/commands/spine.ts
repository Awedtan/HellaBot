const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const puppeteer = require('puppeteer');
const fetch = require('../fetch');
const create = require('../create');

import { Operator } from "../types";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spine')
        .setDescription('Show an operator\'s spine animations')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Animation type')
                .addChoices(
                    { name: 'start', value: 'Start' },
                    { name: 'idle', value: 'Idle' },
                    { name: 'die', value: 'Die' }
                )
        ),
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetch.operators();
        const name = interaction.options.getString('name').toLowerCase();
        const type = interaction.options.getString('type');

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const op = operatorDict[name];

        await interaction.deferReply();

        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        page.on('console', async message => {
            if (message.text() === 'done') {
                await new Promise(r => setTimeout(r, 1000));
                await browser.close();

                const avatarPath = path.join(__dirname, `out.gif`);
                const avatar = new AttachmentBuilder(avatarPath);

                const embed = new EmbedBuilder()
                    .setTitle('test')
                    .setImage(`attachment://out.gif`);

                await interaction.followUp({ embeds: [embed], files: [avatar] });
            }
        })
            .on('pageerror', async ({ message }) => {
                console.error(message);
                await interaction.editReply({ content: 'There was an error while generating the animation!' });
            });

        const client = await page.target().createCDPSession()
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: path.resolve(__dirname, './'),
        })

        await page.setViewport({ width: 300, height: 300 });
        await page.goto(path.resolve(__dirname, `spine.html?name=${op.id}&type=${type}`));
    }
};