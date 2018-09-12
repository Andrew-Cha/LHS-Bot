const Discord = require("discord.js");

const channels = require("../dataFiles/channels.json");
const fs = require('fs');
const path = require('path');
const leadingLogsFile = path.normalize(__dirname + "../../dataFiles/leadingLogs.json");
const leadingLogs = require(leadingLogsFile);

module.exports.run = async (lanisBot, message, args) => {
    const authorRoles = message.member.roles.values();
    let isLeader = false;
    for (role of authorRoles) {
        if (role.name === "Raid Leader" || role.name === "Almost Raid Leader") {
            isLeader = true;
            break;
        }
    }
    if (!isLeader) return await message.channel.send("You have to be a Raid Leader to log your runs.");

    const month = new Date().getUTCMonth() + 1;
    const day = new Date().getUTCDate();
    let hour = new Date().getUTCHours();
    let minutes = new Date().getUTCMinutes();
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    let timeType = "PM";
    if (hour < 12) {
        timeType = "AM";
    } else if (hour >= 12) {
        timeType = "PM";
        if (hour !== 12) {
            hour = hour - 12;
        }
    }
    const leader = message.member;
    const type = args[0];
    if (type === undefined) return await message.channel.send("Please input a raid type.");
    let raidType = "";
    if (type.toUpperCase() === "CULT") {
        raidType = "Cult";
    } else if (type.toUpperCase() === "VOID") {
        raidType = "Void";
    } else {
        return await message.channel.send("Incorrect raid type, input one of these types: `Cult` or `Void`.")
    }

    let customMessage = "";

    for (i = 1; i < args.length; i++) {
        customMessage = customMessage + args[i] + " ";
    }

    let index;
    let leaderAdded = false;
    for (let i = 0; i < leadingLogs.leaders.length; i++) {
        if (leadingLogs.leaders[i].id === message.author.id) {
            leaderAdded = true;
            index = i;
            break;
        }
    }

    if (leaderAdded === false) {
        leadingLogs.leaders[leadingLogs.leaders.length] = {
            "id":  message.author.id,
            "runs": "1",
            "assistedRuns": "0"
        }
        await message.channel.send(message.member.toString() + " this is your first run of the week, keep it up!");
    } else {
        const runsDone = parseInt(leadingLogs.leaders[index].runs)
        leadingLogs.leaders[index].runs = parseInt(runsDone) + 1;
        await message.channel.send(message.member.toString() + " you already have " + (runsDone + 1) + " runs done this week, including this one.");
    }

    if (customMessage) {
        const assistantLeadersMentions = message.mentions.members.values();
        let assistantLeaders = "";

        if (assistantLeadersMentions) {
            for (const leader of assistantLeadersMentions) {
                if (leader.id !== message.author.id) {
                    assistantLeaders += " " + leader;
                }
            }
        }
        if (assistantLeaders !== "") {
            await new Promise(async (resolve, reject) => {

                await message.channel.send("Are you sure these people assisted you: " + assistantLeaders + "?");
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
                const assistantLeadersMentions = message.mentions.members.values();
                await message.channel.send("Adding one secondary run to the mentioned peoples' logs.");
                for (const leader of assistantLeadersMentions) {
                    if (leader.user.bot === false) {
                        let index;
                        let leaderAdded = false;
                        for (let i = 0; i < leadingLogs.leaders.length; i++) {
                            if (leadingLogs.leaders[i].id === leader.id) {
                                leaderAdded = true;
                                index = i;
                                break;
                            }
                        }

                        if (leaderAdded === true) {
                            const assistedRunsCount = parseInt(leadingLogs.leaders[index].assistedRuns);
                            leadingLogs.leaders[index].assistedRuns = (parseInt(assistedRunsCount) + 1);
                            await message.channel.send(leader.toString() + " you already have " + (assistedRunsCount + 1) + " assisted runs this week.")
                        } else if (leaderAdded === false) {
                            leadingLogs.leaders[leadingLogs.leaders.length] = {
                                "id": "" + leader.id,
                                "runs": "0",
                                "assistedRuns": "1"
                            }
                            await message.channel.send(leader.toString() + " this is your first run of the week, keep it up!");
                        }
                    }
                }
            }).catch(async (failureMessage) => {
                await message.channel.send("Not adding secondary run credit to the mentioned people.");
            });
        }
    }
    let logMessage = "`" + month + "/" + day + " " + hour + ":" + minutes + " " + timeType + " UTC` **\n" + raidType + "** run by: " + leader.toString();
    if (customMessage) {
        logMessage = logMessage + ", " + customMessage;
    }
    await lanisBot.channels.get(channels.leadingLogs).send(logMessage);

    fs.writeFile(leadingLogsFile, JSON.stringify(leadingLogs), function (err) {
        if (err) return console.log(err);
    });

}

module.exports.help = {
    name: "log"
}