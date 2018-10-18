const Discord = require("discord.js");
const fs = require('fs');
const path = require('path');
const safeGuardConfigsFile = path.normalize(__dirname + "../../dataFiles/safeGuardConfigs.json");
const safeGuardConfigs = require(safeGuardConfigsFile);
const suspensionsFile = path.normalize(__dirname + "../../dataFiles/suspensions.json");
const suspensions = require(suspensionsFile);
const Channels = require("../dataFiles/channels.json");
const Roles = require("../dataFiles/roles.json")

module.exports.run = async (lanisBot, message, args) => {
    const arlRole = message.guild.roles.find(role => role.id === Roles.almostRaidLeader.id);
    if (message.member.roles.highest.position <= arlRole.position) return await message.channel.send("You can not unsuspend as a person with a role equal to or below ARL.");
    const memberMention = args[0];
    const regexMatches = memberMention.match(/<@!?(1|\d{17,19})>/)
    const memberID = regexMatches[1];
    if (!memberID) return await message.channel.send("Specify which member you want to suspend.");
    const memberToUnsuspend = message.guild.members.get(memberID);
    if (!memberToUnsuspend) return await message.channel.send("Please specify the member correctly. Either @ the member or write their ID.");

    let index;
    let currentLeader;
    for (let i = 0; i < safeGuardConfigs.leaders.length; i++) {
        if (safeGuardConfigs.leaders[i].id === message.author.id) {
            index = i;
            break;
        }
    }

    if (index != undefined) {
        currentLeader = safeGuardConfigs.leaders[index];
        if (currentLeader.commands.includes("SUSPEND")) {
            let abortCheck = false;
            await new Promise(async (resolve, reject) => {
                await message.channel.send("Are you sure you want to unsuspend " + memberToUnsuspend.toString() + " ?");
                const messageFilter = (responseMessage, user) => responseMessage.content != "" && responseMessage.author === message.author;
                const safeGuardCollector = new Discord.MessageCollector(message.channel, messageFilter, { time: 60000 });
                safeGuardCollector.on("collect", async (responseMessage, user) => {
                    if (responseMessage.author === message.author) {
                        if (responseMessage.content === "-yes") {
                            safeGuardCollector.stop("CONTINUE");
                        } else if (responseMessage.content === "-no") {
                            safeGuardCollector.stop("STOP");;
                        } else {
                            await message.channel.send("Please respond with a correct answer: `-yes` or `-no`.");
                        }
                    }
                });

                safeGuardCollector.on("end", async (collected, reason) => {
                    if (reason === "CONTINUE") {
                        resolve("SUCCESS");
                    } else if (reason === "STOP" || reason === "time") {
                        reject("FAILURE");
                    }
                })
            }).then(async (successMessage) => {
                await message.channel.send("Unsuspending the person.");
            }).catch(async (failureMessage) => {
                await message.channel.send("Not unsuspending the person.");
                abortCheck = true;
            });
            if (abortCheck) return;
        }
    }

    const suspendRole = message.guild.roles.find(role => role.id === Roles.suspendedButVerified.id);
    if (suspensions[memberToUnsuspend.id] !== undefined) {
        memberToUnsuspend.roles.remove(suspendRole);
        for (let i = 0; i < suspensions[memberToUnsuspend.id].roles.length; i++) {
            const currentRole = message.guild.roles.find(role => role.name === suspensions[memberToUnsuspend.id].roles[i]);
            memberToUnsuspend.roles.add(currentRole);
        }
    } else {
        return await message.channel.send("Member not suspended.");
    }
    delete suspensions[memberToUnsuspend.id];
    await message.channel.send("Unsuspended.");
    fs.writeFile(suspensionsFile, JSON.stringify(suspensions), function (e) {
        if (err) return console.log(e);
    });
    await lanisBot.channels.get(Channels.suspendLog.id).send(memberToUnsuspend.toString() + " you have been unsuspended.");
}

module.exports.help = {
    name: "unsuspend"
}