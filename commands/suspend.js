const Discord = require("discord.js");

const path = require('path');
const safeGuardConfigsFile = path.normalize(__dirname + "../../dataFiles/safeGuardConfigs.json");
const safeGuardConfigs = require(safeGuardConfigsFile);
const Channels = require("../dataFiles/channels.json");
const Roles = require("../dataFiles/roles.json")

module.exports.run = async (lanisBot, message, args) => {
    const arlRole = message.guild.roles.find(role => role.id === Roles.almostRaidLeader.id);
    if (message.member.roles.highest.position <= arlRole.position) return await message.channel.send("You can not suspend as a person with a role equal to or below ARL.");
    const memberMention = args[0];
    if (!memberMention) return await message.channel.send("Input a correct user mention.")
    const regexMatches = memberMention.match(/<@!?(1|\d{17,19})>/)
    if (regexMatches === null) return await message.channel.send("Input a correct user mention.");
    const memberID = regexMatches[1];
    if (!memberID) return await message.channel.send("Specify which member you want to suspend.");
    let time = args[1];
    let timeUnit = args[2];
    let timeMultiplier;
    const memberToSuspend = message.guild.members.get(memberID);

    if (!memberToSuspend) return await message.channel.send("Please specify the member correctly. Either @ the member or write their ID.");
    if (memberToSuspend.id === message.author.id) return await message.channel.send("You cannot suspend yourself.");
    if (memberToSuspend.roles.highest.position >= message.member.roles.highest.position) return await message.channel.send("You cannot suspend that person.");
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

    lanisBot.database.get(`SELECT * FROM suspended WHERE ID = ${memberID}`, async (error, row) => {
        if (error) {
            throw error
        }

        if (row !== undefined) return message.channel.send("Member already suspended.")

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
                    await message.channel.send("Continuing.");
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

        let toBeExpelled = false;
        if (suspensionReason !== "") {
            if (timeUnit !== "weeks" || time < 10) {
                await lanisBot.channels.get(Channels.suspendLog.id).send(memberToSuspend.toString() + " you have been suspended by: " + message.author.toString() + " for " + time + " " + timeUnit + " for " + suspensionReason)
            } else if (timeUnit === "weeks" && time >= 10) {
                await new Promise(async (resolve, reject) => {
                    await message.channel.send("Would you like to suspend " + memberToSuspend.toString() + " permanently instead?");
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
                    toBeExpelled = true;
                }).catch(async (failureMessage) => {
                    await message.channel.send("Not suspending the person permanently.");
                });

                if (toBeExpelled) {
                    await lanisBot.channels.get(Channels.suspendLog.id).send(memberToSuspend.toString() + " you have been suspended by: " + message.author.toString() + " **permanently** for " + suspensionReason);
                    time = 9999;
                } else {
                    await lanisBot.channels.get(Channels.suspendLog.id).send(memberToSuspend.toString() + " you have been suspended by: " + message.author.toString() + " for " + time + " " + timeUnit + " for " + suspensionReason)
                }
            }
        } else {
            return await message.channel.send("Please input a reason for the suspension.");
        }

        let roles = []
        for (const currentRole of memberToSuspend.roles.values()) {
            if (currentRole.name !== "@everyone") {
                roles.push(currentRole.name);
                await memberToSuspend.roles.remove(message.guild.roles.find(role => role.name === currentRole.name));
            }
        }

        lanisBot.database.run(`INSERT INTO suspended(ID, time, roles) VALUES(${memberToSuspend.id}, ${Date.now() + parseInt(time) * timeMultiplier}, '${roles.join(",")}')`, (error, row) => {
            if (error) {
                throw error
            }
        })

        await message.channel.send("Suspended.");
        let suspendRole = toBeExpelled ? message.guild.roles.find(role => role.id === Roles.suspended.id) : message.guild.roles.find(role => role.id === Roles.suspendedButVerified.id);
        await memberToSuspend.roles.add(suspendRole)
    })
}

module.exports.help = {
    name: "suspend",
    category: "Server Management",
    example: "`-suspend [User Mention] [Numeric Length] [Type of length, m for minutes, h for hours, d for days, w for weeks] [Reason]`",
    explanation: "The suspension command, anything above or equal to 10 weeks will offer a perma suspension instead."
}