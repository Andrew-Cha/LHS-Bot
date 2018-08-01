const Discord = require("discord.js");
const fs = require('fs');
const path = require('path');
const playersExpelledFile = path.normalize(__dirname + "../../dataFiles/expelledPeople.json");
const playersExpelled = require(playersExpelledFile);

module.exports.run = async (lanisBot, message, args) => {
    const action = args[0];
    if (action === undefined) return await message.channel.send("Input whether you want to `add` or `remove` a person to the expelled people list.")
    const playerInputted = args[1]
    if (playerInputted === undefined) return message.channel.send("Please input a user to expel or unban.");

    const actionUpperCase = action.toUpperCase();

    let index;
    let memberExpelled = false;
    for (let i = 0; i < playersExpelled.members.length; i++) {
        if (playersExpelled.members[i].name.toUpperCase() === playerInputted.toUpperCase()) {
            memberExpelled = true;
            index = i;
            break;
        }
    }

    switch (actionUpperCase) {
        case "ADD":
            if (!memberExpelled) {
                playersExpelled.members[playersExpelled.members.length] = {
                    "name": playerInputted.toUpperCase()
                }
                await fs.writeFile(playersExpelledFile, JSON.stringify(playersExpelled), function (err) {
                    if (err) return console.log(err);
                });
                await message.channel.send("Player is now expelled.")
            } else {
                return await message.channel.send("The member is already expelled.");
            }
            break;

        case "REMOVE":
            if (memberExpelled) {
                playersExpelled.members.splice(index, 1);
                await fs.writeFile(playersExpelledFile, JSON.stringify(playersExpelled), function (err) {
                    if (err) return console.log(err);
                });
                await message.channel.send("Player unbanned.");
            } else {
                return await message.channel.send("The member is not expelled.");
            }
            break;

        default:
            return await message.channel.send("Input a correct action, either `add` or `remove`");
            break;
    }
}

module.exports.help = {
    name: "expelled"
}