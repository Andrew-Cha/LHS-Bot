const Discord = require("discord.js");
const fs = require('fs');
const path = require('path');
const safeGuardConfigsFile = path.normalize(__dirname + "../../safeGuardConfigs.json");
const safeGuardConfigs = require(safeGuardConfigsFile);

module.exports.run = async (lanisBot, message, args) => {
    let action = args[0];
    const channelList = ["AFK", "SPLITVOID", "SUSPEND"];
    if (action != undefined) {
        action = action.toUpperCase();
    }

    let index;
    let ableToOptOut = false;
    let leaderAlreadyOptedIn = false;
    let currentLeader;
    for (let i = 0; i < safeGuardConfigs.leaders.length; i++) {
        if (safeGuardConfigs.leaders[i].id === message.author.id) {
            leaderAlreadyOptedIn = true;
            ableToOptOut = true;
            index = i;
            break;
        }
    }

    switch (action) {
        case "OPTIN":
            if (leaderAlreadyOptedIn) {
                await message.channel.send("Already opted in, can't add.");
                break;
            }
            await message.channel.send("Opting in.");
            safeGuardConfigs.leaders[safeGuardConfigs.leaders.length] = { "id": "" + message.author.id, "commands": [] }
            await message.channel.send("Added " + message.author + " to the safeguard list.");
            break;
        case "OPTOUT":
            if (!ableToOptOut) {
                await message.channel.send("Not opted in, please opt in before trying to remove yourself.");
                break;
            } else {
                await message.channel.send("Removing.");
            }

            safeGuardConfigs.leaders.splice(index, 1);
            await message.channel.send("Removed " + message.author + " out of the safeguard.");
            break;
        case "ADD":
            const commandToAdd = args[1];
            if (!safeGuardConfigs.leaders[index]) {
                await message.channel.send("Please opt in the safeguard before trying to add a command.");
                break;
            }
            if (channelList.includes(commandToAdd.toUpperCase())) {
                if (safeGuardConfigs.leaders[index].commands.includes(commandToAdd.toUpperCase())) {
                    await message.channel.send("Command already added.");
                } else {
                    safeGuardConfigs.leaders[index].commands.push(commandToAdd.toUpperCase());
                    await message.channel.send("Added the command to the safeguard list.");
                }
            } else {
                await message.channel.send("Command does not exist.");
            }
            break;
        case "REMOVE":
            const commandToRemove = args[1];
            if (!safeGuardConfigs.leaders[index]) {
                await message.channel.send("Please opt in the safeguard before trying to remove a command.");
                break;
            }
            if (channelList.includes(commandToRemove.toUpperCase())) {
                if (!safeGuardConfigs.leaders[index].commands.includes(commandToRemove.toUpperCase())) {
                    await message.channel.send("Command already is not in the safeguard list.");
                } else {
                    let commandIndex;
                    for (let i = 0; i < safeGuardConfigs.leaders[index].commands.length; i++) {
                        if (safeGuardConfigs.leaders[index].commands[i] === commandToRemove.toUpperCase()) {
                            commandIndex = i;
                        }
                    }
                    safeGuardConfigs.leaders[index].commands.splice(commandIndex, 1);
                    await message.channel.send("Removed the command from the safeguard list.");
                }
            } else {
                await message.channel.send("Command does not exist.");
            }
            break;
        case "LIST":
            if (!safeGuardConfigs.leaders[index]) {
                await message.channel.send("Please opt in before trying to access your command list.");
            } else {
                if (safeGuardConfigs.leaders[index].commands != "") {
                    await message.channel.send("Your command list is: " + safeGuardConfigs.leaders[index].commands);
                } else {
                    await message.channel.send("You don't have any commands added.");
                }
            }
            break;
        default:
            await message.channel.send("Invalid input, please check `-commands` for extra help.")
            break;
    }

    fs.writeFile(safeGuardConfigsFile, JSON.stringify(safeGuardConfigs), function (err) {
        if (err) return console.log(err);
    });
}

module.exports.help = {
    name: "safeGuard"
}

//add 
// Make a list of commands, grab them perhaps from bot?
// See if the command matches, if so add the command to their json file's object?
// Zat's it.

//remove
//Same as add, just remove

//optIn / optOut
// add a person's object to a json file, else remov em

//A message in this case is the command, so use a case for that.
//Args are used for specifying commands, so args should be added in cases.
