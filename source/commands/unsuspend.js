const Discord = require("discord.js");
const path = require('path');

const safeGuardConfigsFile = path.normalize(__dirname + "../../dataFiles/safeGuardConfigs.json");
const safeGuardConfigs = require(safeGuardConfigsFile);

const Channels = require("../dataFiles/channels.json");
const Roles = require("../dataFiles/roles.json")

module.exports.run = async (lanisBot, message, args) => {
    const arlRole = message.guild.roles.find(role => role.id === Roles.almostRaidLeader.id);
    if (message.member.roles.highest.position <= arlRole.position) return await message.channel.send("You can not unsuspend as a person with a role equal to or below ARL.");
    const memberMention = args[0];
    const regexMatches = memberMention.match(/<@!?(1|\d{17,19})>/)
    const memberID = regexMatches[1];
    if (!memberID) return await message.channel.send("Specify which member you want to suspend.");
    const memberToUnsuspend = await message.guild.members.fetch(memberID);
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

    lanisBot.database.get(`SELECT * FROM suspended WHERE ID = ${memberID}`, async (error, row) => {
        if (error) {
            throw error
        }

        if (row !== undefined) {
            const memberRoles = memberToUnsuspend.roles;
            for (const role of memberRoles.values()) {
                if (role.name !== "@everyone") {
                    await memberToUnsuspend.roles.remove(role)
                }
            };

            const suspendedButVerifiedRole = message.guild.roles.find(role => role.id === Roles.suspendedButVerified.id)
            if (memberToUnsuspend.roles.find(role => role.id === Roles.suspendedButVerified.id)) {
                await memberToUnsuspend.roles.remove(suspendedButVerifiedRole);
            }
            const suspendedRole = message.guild.roles.find(role => role.id === Roles.suspended.id)
            if (memberToUnsuspend.roles.find(role => role.id === Roles.suspended.id)) {
                await memberToUnsuspend.roles.remove(suspendedRole);
            }

            const roleNames = row.roles.split(",")
            const roles = []
            for (const roleName of roleNames) {
                const currentRole = message.guild.roles.find(role => role.name === roleName)
                roles.push(currentRole)
            }

            if (roles[0] !== undefined) {
                await memberToUnsuspend.roles.add(roles)
            }

            lanisBot.database.run(`DELETE FROM suspended WHERE ID = ${row.ID}`)

            await message.channel.send("Unsuspended.");

            let suspensionReason = ""
            for (i = 1; i < args.length; i++) {
                suspensionReason = suspensionReason + args[i] + " ";
            }

            if (suspensionReason != "") {
                await lanisBot.channels.get(Channels.suspendLog.id).send(memberToUnsuspend.toString() + " you have been unsuspended by: " + message.member.toString() + " for: " + suspensionReason);
            } else {
                await lanisBot.channels.get(Channels.suspendLog.id).send(memberToUnsuspend.toString() + " you have been unsuspended by: " + message.member.toString() + ".")
            }
        } else {
            return await message.channel.send("Member not suspended.");
        }
    })
}

module.exports.help = {
    name: "unsuspend",
    category: "Server Management",
    example: "`-unsuspend [User Mention] [Reason]`",
    explanation: "Unsuspends a user, if they are suspended."
}