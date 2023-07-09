import { SlashCommandBuilder } from 'discord.js';
const fetch = require('../fetch');
const create = require('../create');
import { Operator } from '../types';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Show an operator\'s information and attributes')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true)
        ),
    async autocomplete(interaction) { // thanks to this guy for revealing autocomplete is a thing => https://www.youtube.com/watch?v=znTvzGChzVE
        const value = interaction.options.getFocused().toLowerCase();

        let choices = [];
        for (const op of Object.keys(fetch.operators())) {
            if (op.includes('_')) continue; // Skip internal names
            const prettify = (op: string) => {
                const arr = op.split(' ');
                for (let i = 0; i < arr.length; i++) {
                    arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].substring(1);
                }
                return arr.join(' ');
            };
            choices.push(prettify(op));
        }
        const filtered = choices.filter(choice => choice.toLowerCase().includes(value)).slice(0, 8); // 8 is a good amount i think
        const filteredMap = filtered.map(choice => ({ name: choice, value: choice }));

        await interaction.respond(filteredMap);
    },
    async execute(interaction) {
        const operatorDict: { [key: string]: Operator } = fetch.operators();
        const name = interaction.options.getString('name').toLowerCase();

        if (!operatorDict.hasOwnProperty(name))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        const operator = operatorDict[name];
        const operatorEmbed = create.infoEmbed(operator, 0, 0, 0);
        await interaction.reply(operatorEmbed);
    }
}