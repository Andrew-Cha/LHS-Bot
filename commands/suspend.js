const Discord = require("discord.js");
const fs = require('fs');
const path = require('path');
const safeGuardConfigsFile = path.normalize(__dirname + "../../dataFiles/safeGuardConfigs.json");
const safeGuardConfigs = require(safeGuardConfigsFile);
const suspensionsFile = path.normalize(__dirname + "../../dataFiles/suspensions.json");
const suspensions = require(suspensionsFile);
const channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const arlRole = message.guild.roles.find(role => role.name === "Almost Raid Leader");
    if (message.member.roles.highest.position <= arlRole.position) return await message.channel.send("You can not suspend as a person with a role equal to or below ARL.");
    const memberMention = args[0];
    const regexMatches = memberMention.match(/<@!?(1|\d{17,19})>/)
    if (regexMatches === null) return await message.channel.send("Input a correct user mention.");
    const memberID = regexMatches[1];
    if (!memberID) return await message.channel.send("Specify which member you want to suspend.");
    const time = args[1];
    let timeUnit = args[2];
    let timeMultiplier;
    const memberToSuspend = message.guild.members.get(memberID);

    if (!memberToSuspend) return await message.channel.send("Please specify the member correctly. Either @ the member or write their ID.");
    if (memberToSuspend.id === message.author.id) return await message.channel.send("You cannot suspend yourself.");
    if (memberToSuspend.highestRole.position >= message.member.highestRole.position) return await message.channel.send("You cannot suspend that person.");
    if (time === undefined || time === NaN) return await message.channel.send("Input a correct time number.");
    if (timeUnit === undefined) return await message.channel.send("Input a time format.");

    switch (timeUnit.toUpperCase()) {
        case "W":
            timeMultiplier = 604800000;
            timeUnit = "weeks";
            break;

        case "D":
            timeMultiplier = 86400000;
            timeUnit = "days";
            break;

        case "H":
            timeMultiplier = 3600000;
            timeUnit = "hours";
            break;

        case "M":
            timeMultiplier = 60000;
            timeUnit = "minutes";
            break;

        default:
            return await message.channel.send("Input a valid time format.");
    }

    const suspendRole = message.guild.roles.find(role => role.name === "Suspended but Verified");
    if (suspensions[memberToSuspend.id] !== undefined) {
        return await message.channel.send("Member already suspended.");
    }

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
                await message.channel.send("Are you sure you want to suspend " + memberToSuspend.toString() + " ?");
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
                await message.channel.send("Suspending the person.");
            }).catch(async (failureMessage) => {
                await message.channel.send("Not suspending the person.");
                abortCheck = true;
            });
            if (abortCheck) return;
        }
    }

    let suspensionReason = ""
    for (i = 3; i < args.length; i++) {
        suspensionReason = suspensionReason + args[i] + " ";
    }

    if (suspensionReason != "") {
        await lanisBot.channels.get(channels.suspendLog).send(memberToSuspend + " you have been suspended by: " + message.author + " for " + time + " " + timeUnit + " for " + suspensionReason)
    } else {
        return await message.channel.send("Please input a reason for the suspension.");
    }

    lanisBot.suspensions[memberToSuspend.id] = {
        time: Date.now() + parseInt(time) * timeMultiplier,
        roles: [],
        guildID: message.guild.id
    }

    for (const currentRole of memberToSuspend.roles.values()) {
        if (currentRole.name !== "@everyone") {
            lanisBot.suspensions[memberToSuspend.id].roles.push(currentRole.name);
            memberToSuspend.roles.remove(message.guild.roles.find(role => role.name === currentRole.name));
        }
    }

    fs.writeFile(suspensionsFile, JSON.stringify(suspensions), function (err) {
        if (err) return console.log(err);
    });

    await message.channel.send("Suspended.");
    await memberToSuspend.roles.add(suspendRole);
}

module.exports.help = {
    name: "suspend"
}