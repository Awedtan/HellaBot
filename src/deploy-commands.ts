import { REST, Routes } from 'discord.js';
const { clientId, token } = require('./../config.json');
const fs = require('fs');
const path = require('path');

export function deployCommands() {
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        }
        else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
    const rest = new REST().setToken(token);
    (async () => {
        try {
            await rest.put(Routes.applicationCommands(clientId), { body: commands },);
        } catch (e) {
            console.error(e);
        }
    })();
}