import { Client, Collection, REST, Routes } from 'discord.js';
const { clientId, token } = require('./../config.json');
const fs = require('fs');
const path = require('path');

export default class HellaClient extends Client {
    commands: Collection<string, any>;
    loadCommands() {
        this.commands = new Collection();
        const commandArr = [];
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.ts'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                this.commands.set(command.data.name, command);
                commandArr.push(command.data.toJSON());
            }
            else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
        const rest = new REST().setToken(token);
        (async () => {
            try {
                await rest.put(Routes.applicationCommands(clientId), { body: commandArr },);
            } catch (e) {
                console.error(e);
            }
        })();
    }
}