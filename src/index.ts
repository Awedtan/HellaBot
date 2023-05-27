const fs = require('fs');
const path = require('path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token } = require('../config.json');
const { initializeAll } = require('./utils/fetchData');
const create = require('./utils/create');
const fetchData = require('./utils/fetchData');
import { Base, BaseInfo, Enemy, Module, Paradox, Operator, Range, RogueStage, Skill, Skin, Stage } from "./utils/types";

initializeAll();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}
client.login(token);

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    const idArr = interaction.customId.split('$');

    switch (idArr[0]) {
        case ('skill'):
            const levelId: { [key: string]: number } = { l1: 0, l2: 1, l3: 2, l4: 3, l5: 4, l6: 5, l7: 6, m1: 7, m2: 8, m3: 9 };
            const skillDict = fetchData.fetchSkills();
            const opDict = fetchData.fetchOperators();

            console.log(idArr);

            const level = levelId[idArr[1]];
            const skill: { [key: string]: Skill } = skillDict[idArr[2]];
            const op: { [key: string]: Operator } = opDict[idArr[3]];

            const skillEmbed = create.skillEmbed(skill, level, op);
            await interaction.update(skillEmbed);

            break;
    }
});

export { };