const Discord = require("discord.js");
const fs = require('fs');
const path = require('path');
const expelledGuildsFile = path.normalize(__dirname + "../../dataFiles/expelledGuilds.json");
const expelledGuilds = require(expelledGuildsFile);

module.exports.run = async (lanisBot, message, args) => {
    const action = args[0];
    if (action === undefined) return await message.channel.send("Input whether you want to `add` or `remove` a guild to the expelled guilds list.")
    let guildInputted = "";
    for (let i = 1; i < args.length; i++) {
        if (i !== 1) {
            guildInputted = guildInputted + " " + args[i];
        } else {
            guildInputted = args[1];
        }
    }
    if (guildInputted === undefined) return message.channel.send("Please input a guild to expel or unban.");

    const actionUpperCase = action.toUpperCase();

    let index;
    let guildExpelled = false;
    for (let i = 0; i < expelledGuilds.guilds.length; i++) {
        if (expelledGuilds.guilds[i].name.toUpperCase() === guildInputted.toUpperCase()) {
            guildExpelled = true;
            index = i;
            break;
        }
    }

    switch (actionUpperCase) {
        case "ADD":
            if (!guildExpelled) {
                expelledGuilds.guilds[expelledGuilds.guilds.length] = {
                    "name": guildInputted.toUpperCase()
                }
                await fs.writeFile(expelledGuildsFile, JSON.stringify(expelledGuilds), function (err) {
                    if (err) return console.log(err);
                });
                await message.channel.send("The guild is now expelled.")
            } else {
                return await message.channel.send("The guild is already expelled.");
            }
            break;

        case "REMOVE":
            if (guildExpelled) {
                expelledGuilds.guilds.splice(index, 1);
                await fs.writeFile(expelledGuildsFile, JSON.stringify(expelledGuilds), function (err) {
                    if (err) return console.log(err);
                });
                await message.channel.send("Guild unbanned.");
            } else {
                return await message.channel.send("The guild is not expelled.");
            }
            break;

        default:
            return await message.channel.send("Input a correct action, either `add` or `remove`");
            break;
    }
}

module.exports.help = {
    name: "expelledGuilds"
}