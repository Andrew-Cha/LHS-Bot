const Roles = require("../dataFiles/roles.json")
const fs = require('fs');
const path = require('path');
const playersExpelledFile = path.normalize(__dirname + "../../dataFiles/expelledPeople.json");
const playersExpelled = require(playersExpelledFile);

module.exports.run = async (lanisBot, message, args) => {
    const securityRole = message.guild.roles.find(role => role.id === Roles.security.id);
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.id === Roles.verifier.id)) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const action = args[0];
    if (action === undefined) return await message.channel.send("Input whether you want to `add` or `remove` a person to the expelled people list, to view the list use the `list` argument.")
    const playerInputted = args[1]
    if (playerInputted === undefined && action.toUpperCase() !== "LIST") return message.channel.send("Please input a user to expel or unban.");

    const actionUpperCase = action.toUpperCase();


    let index;
    let memberExpelled = false;
    if (playerInputted) {
        for (let i = 0; i < playersExpelled.members.length; i++) {
            if (playersExpelled.members[i].name.toUpperCase() === playerInputted.toUpperCase()) {
                memberExpelled = true;
                index = i;
                break;
            }
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

        case "LIST":
            let reportMessage = "**Expelled Players**\n```";
            let expelledPeople = [];
            for (let i = 0; i < playersExpelled.members.length; i++) {
                expelledPeople.push(playersExpelled.members[i].name);
            }

            function compare(a, b) {
                if (a < b) {
                    return -1;
                }
                if (a > b) {
                    return 1;
                }
                return 0;
            }

            expelledPeople.sort(compare);
            let membersScrolled = 1;
            for (const person of expelledPeople) {
                const newReportMessage = reportMessage + person + "; ";
                if (newReportMessage.length > 1996) {
                    reportMessage = reportMessage + "\n```";
                    await message.channel.send(reportMessage);
                    reportMessage = "```\n" + person;
                } else {
                    reportMessage = newReportMessage;
                    if (membersScrolled === playersExpelled.members.length) {
                        reportMessage = reportMessage + "\n```";
                    }
                }
                membersScrolled += 1;
            }

            await message.channel.send(reportMessage);
            break;
        default:
            return await message.channel.send("Input a correct action, either `add`,`remove` or `list`.");
            break;
    }
}

module.exports.help = {
    name: "expelled"
}