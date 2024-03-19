# HellaBot

An Arknights Discord bot that provides information on operators, enemies, stages, and more! 

A work-in-progress personal project. Game data is fetched from [HellaAPI](https://github.com/Awedtan/HellaAPI).

<img src="https://raw.githubusercontent.com/Awedtan/HellaBot-Assets/main/readme/demo.gif" height="600"/>

## Installation

If you want to run the bot on your own machine or wherever else, follow the steps below.

1. Install [Node.js](https://nodejs.org/en)
2. Clone or download this repository
```sh
git clone https://github.com/Awedtan/HellaBot.git
```
3. Move into the project folder
```sh
cd HellaBot
```
4. Install the project dependencies
```sh
npm install
```
5. Create a `config.json` file in the project folder, and copy your Discord bot token and application ID into it.
```json
{
    "token": "your_bot_token_here",
    "clientId": "your_application_id_here"
}
```
The project directory should now look something like this:
```sh
HellaBot/
├── config.json
├── LICENSE
├── node_modules/
├── package-lock.json
├── package.json
├── README.md
├── src/
└── tsconfig.json
```
6. Run the bot!
```sh
npm start
```

## Usage

HellaBot uses slash commands. To use a command, just type: `/[command]`

All command interactions are event-driven, so buttons and other interactables will never expire!

### Command List

| Command | Description                                                      |
|---------|------------------------------------------------------------------|
| art     | Display an operator's artwork                                    |
| base    | Show an operator's base skills                                   |
| cc      | Show information on a Contingency Contract stage or season       |
| costs   | Show an operator's elite, skill, mastery, and module costs       |
| define  | Show definitions for in-game terms                               |
| enemy   | Show an enemy's information and abilities                        |
| events  | Display a list of in-game events                                 |
| help    | Show help info on commands                                       |
| info    | Show an operator's information and attributes                    |
| is2     | Show information on IS2: Phantom & Crimson Solitaire             |
| is3     | Show information on IS3: Mizuki & Caerula Arbor                  |
| is4     | Show information on IS4: Expeditioner's Jǫklumarkar              |
| item    | Show information on an item                                      |
| modules | Show an operator's modules                                       |
| paradox | Show an operator's Paradox Simulation stage                      |
| ra      | Show information on a Reclamation Algorithm stage                |
| recruit | Find recruitable operators from recruitment tags                 |
| skills  | Show an operator's skills                                        |
| spine   | Render and display spine animations (experimental)               |
| stage   | Show information on a stage                                      |

## Acknowledgements

Huge thanks to [Kengxxiao/ArknightsGameData](https://github.com/Kengxxiao/ArknightsGameData) and [Aceship/Arknight-Images](https://github.com/Aceship/Arknight-Images) for compiling and providing game resources that this project depends on.

Thanks to [MrJAwesome](https://www.youtube.com/@MrJAwesomeYT) for making extensive videos on Discord.js so I can preview features without going through all the drudgery myself.