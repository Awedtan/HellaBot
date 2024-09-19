# HellaBot

An Arknights Discord bot that provides information on operators, enemies, stages, and more! 

A work-in-progress personal project. Game data is fetched from [HellaAPI](https://github.com/Awedtan/HellaAPI).

<img src="https://raw.githubusercontent.com/Awedtan/HellaBot-Assets/main/readme/demo.gif" height="600"/>

> Note: this example is pretty outdated, the bot loads commands even faster now :^)

## Installation

To invite a me-hosted instance of the bot to a server, click here: https://discord.com/oauth2/authorize?client_id=1277141603575922710

> Note: the `spine` command is disabled for this bot because it is quite compute-intensive and the bot is hosted on a cheap cloud VM with not a lot of power. If you'd like that functionality, look below ↓

To run the bot on your own machine or wherever else, follow the steps below.

1. Install [Node.js](https://nodejs.org/en)
2. Clone or download this repository
```sh
git clone https://github.com/Awedtan/HellaBot.git --depth=1
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
├── node_modules/
├── package.json
├── package-lock.json
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
| art     | Show an operator's artwork                                       |
| base    | Show an operator's base skills                                   |
| cc      | Show information on a Contingency Contract stage or season       |
| ccb     | Show information on a CC Battleplan stage or season              |
| costs   | Show an operator's elite, skill, mastery, and module costs       |
| define  | Show definitions for in-game terms                               |
| deploy  | Show information on a deployable                                 |
| enemy   | Show an enemy's information and abilities                        |
| events  | Show a list of in-game events                                    |
| gacha   | Show a list of gacha banners and rate-ups                        |
| help    | Show help info on commands                                       |
| info    | Show an operator's information and attributes                    |
| is2     | Show information on IS2: Phantom & Crimson Solitaire             |
| is3     | Show information on IS3: Mizuki & Caerula Arbor                  |
| is4     | Show information on IS4: Expeditioner's Jǫklumarkar              |
| item    | Show information on an item                                      |
| modules | Show an operator's modules                                       |
| new     | Show newly updated game data                                     |
| paradox | Show an operator's Paradox Simulation stage                      |
| ping    | Get bot network latency                                          |
| ra2     | Show information on RA2: Tales Within the Sand                   |
| recruit | Find recruitable operators from recruitment tags                 |
| skills  | Show an operator's skills                                        |
| spine   | Render and display spine animations                              |
| stage   | Show information on a stage                                      |

## Acknowledgements

[Kengxxiao/ArknightsGameData_YoStar](https://github.com/Kengxxiao/ArknightsGameData_YoStar) for providing the raw game data.

[Aceship/Arknight-Images](https://github.com/Aceship/Arknight-Images) for providing game images.

[MrJAwesome](https://www.youtube.com/@MrJAwesomeYT) for making videos on Discord.js that helped me get started on this project.