const Discord = require("discord.js");
const Roles = require("../dataFiles/roles.json")
const Emojis = require("../dataFiles/emojis.json")

module.exports.run = async (lanisBot, message, args) => {
    const guild = lanisBot.guilds.get("343704644712923138");
    let reportEmbed = new Discord.MessageEmbed()
        .setColor("3ea04a")
        .setTimestamp()

    let reportMessage = "";
    let activeMembers = [];

    function compareRuns(a, b) {
        return (b.cultsDone * 0.75 + b.voidsDone + b.otherDungeonsDone * 0.25) - (a.cultsDone * 0.75 + a.voidsDone + a.otherDungeonsDone * 0.25)
    }

    function compareKeysPopped(a, b) {
        return (b.lostHallsKeysPopped + b.otherKeysPopped) - (a.lostHallsKeysPopped + a.otherKeysPopped)
    }

    function compareVialsUsed(a, b) {
        return b.vialsUsed - a.vialsUsed
    }

    function compareRunsLed(a, b) {
        return (b.voidsLed + b.cultsLed) - (a.voidsLed + a.cultsLed)
    }

    let typePromptEmbed = new Discord.MessageEmbed()
        .addField("Which leaderboard would you like to see? React below.", `<:lostHallsDungeon:506072260139024395> for the run leaderboard.\n<:lostHallsKey:506080313974325248> for the keys popped leaderboard.\n <:lostHallsVial:506091071655378974> for the vial popped leaderboard.\n <:lostHallsVoidEntity:506091097970442257> for the runs led leaderboard.`)
        .setFooter("Awaiting Input")
        .setColor("3ea04a")
        .setTimestamp()

    let messageSent = await message.author.send(typePromptEmbed).catch(error => {
        if (error) {
            failed = true
            message.react("⚠")
        }
    })

    const reactionFilter = (reaction, user) => !user.bot
    const reactionCollector = messageSent.createReactionCollector(reactionFilter, { time: 60000 });
    reactionCollector.on("collect", async (reaction) => {
        if (reaction.emoji.id === "506072260139024395") { //Runs Done
            lanisBot.database.all(`SELECT * FROM stats WHERE cultsDone >= 0 OR voidsDone >= 0 OR otherDungeonsDone >= 0;`, async (error, rows) => {
                reportEmbed.setDescription("Leaderboard of Runs");

                rows.forEach(member => {
                    activeMembers.push(member)
                })

                activeMembers.sort(compareRuns);
                let memberPlace = 1
                for (const member of activeMembers) {
                    const currentMember = guild.members.get(member.ID)
                    if (!currentMember) continue;

                    const memberName = currentMember.id === message.author.id ? currentMember.toString() : currentMember.displayName;
                    const newReportMessage = reportMessage + "\n**[#" + memberPlace + "]** " + memberName + "\n Cults Done - " + member.cultsDone + " | Voids Done - " + member.voidsDone + " | Other Dungeons Done - " + member.otherDungeonsDone + "\n";
                    if (newReportMessage.length > 1024) {
                        reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
                        reportMessage = "**[#" + memberPlace + "]** " + memberName + "\n Cults Done - " + member.cultsDone + " | Voids Done - " + member.voidsDone + " | Other Dungeons Done - " + member.otherDungeonsDone + "\n";
                    } else {
                        reportMessage = newReportMessage
                    }

                    memberPlace += 1
                    if (memberPlace >= rows.length || memberPlace > 25) {
                        const authorMember = activeMembers.find(member => member.ID === message.author.id)
                        let authorPlace = activeMembers.indexOf(authorMember) + 1

                        reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
                            .setFooter("Your Rank: #" + authorPlace + "")

                        await message.author.send(reportEmbed);

                        const historyDMs = lanisBot.channels.get("396694518738714634")
                        let historyReport = new Discord.MessageEmbed()
                            .addField("Sent Leaderboard", `User <@${message.author.id}> has received the run leaderboard after requesting it.`)
                            .setColor("3ea04a")
                            .setFooter("User ID: " + message.author.id)
                            .setTimestamp()


                        if (message.channel.type === "dm") {
                            historyReport.addField("Channel Type", "Direct Message")
                        } else {
                            historyReport.addField("Channel Type", `<#${message.channel.id}>`)
                        }

                        await historyDMs.send(historyReport)

                        if (message.channel.type !== "dm") {
                            await sleep(30000)
                            await message.delete()
                     
                       }
                       return
                    }
                }
            })
            reactionCollector.stop()
        } else if (reaction.emoji.id === "506080313974325248") { //Keys Popped
            lanisBot.database.all(`SELECT * FROM stats WHERE lostHallsKeysPopped >= 0 OR otherKeysPopped >= 0;`, async (error, rows) => {
                reportEmbed.setDescription("Leaderboard of Keys Popped");

                rows.forEach(member => {
                    activeMembers.push(member)
                })

                activeMembers.sort(compareKeysPopped);
                let memberPlace = 1
                for (const member of activeMembers) {
                    const currentMember = guild.members.get(member.ID)
                    if (!currentMember) continue;

                    const memberName = currentMember.id === message.author.id ? currentMember.toString() : currentMember.displayName;
                    const newReportMessage = reportMessage + "\n**[#" + memberPlace + "]** " + memberName + "\n Lost Halls Keys Popped - " + member.lostHallsKeysPopped + " | Other Dungeons Keys Popped - " + member.otherKeysPopped + "\n";
                    if (newReportMessage.length > 1024) {
                        reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
                        reportMessage = "**[#" + memberPlace + "]** " + memberName + "\n Lost Halls Keys Popped - " + member.lostHallsKeysPopped + " | Other Dungeons Keys Popped - " + member.otherKeysPopped + "\n";
                    } else {
                        reportMessage = newReportMessage
                    }

                    memberPlace += 1
                    if (memberPlace >= rows.length || memberPlace > 25) {
                        const authorMember = activeMembers.find(member => member.ID === message.author.id)
                        let authorPlace = activeMembers.indexOf(authorMember) + 1

                        reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
                            .setFooter("Your Rank: #" + authorPlace + "")

                        await message.author.send(reportEmbed);

                        const historyDMs = lanisBot.channels.get("396694518738714634")
                        let historyReport = new Discord.MessageEmbed()
                            .addField("Sent Leaderboard", `User <@${message.author.id}> has received the key leaderboard after requesting it.`)
                            .setColor("3ea04a")
                            .setFooter("User ID: " + message.author.id)
                            .setTimestamp()


                        if (message.channel.type === "dm") {
                            historyReport.addField("Channel Type", "Direct Message")
                        } else {
                            historyReport.addField("Channel Type", `<#${message.channel.id}>`)
                        }

                        await historyDMs.send(historyReport)

                        if (message.channel.type !== "dm") {
                            await sleep(30000)
                            await message.delete()
                        }
                        return
                    }
                }
            })
            reactionCollector.stop()
        } else if (reaction.emoji.id === "506091071655378974") { //Vials Popped
            lanisBot.database.all(`SELECT * FROM stats WHERE vialsUsed >= 0;`, async (error, rows) => {
                reportEmbed.setDescription("Leaderboard of Vials Popped");

                rows.forEach(member => {
                    activeMembers.push(member)
                })

                activeMembers.sort(compareVialsUsed);
                let memberPlace = 1
                for (const member of activeMembers) {
                    const currentMember = guild.members.get(member.ID)
                    if (!currentMember) continue;

                    const memberName = currentMember.id === message.author.id ? currentMember.toString() : currentMember.displayName;
                    const newReportMessage = reportMessage + "\n**[#" + memberPlace + "]** " + memberName + "\n Voids Popped - " + member.vialsUsed + " | Vials Stored - " + member.vialsStored + "\n";
                    if (newReportMessage.length > 1024) {
                        reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
                        reportMessage = "**[#" + memberPlace + "]** " + memberName + "\n Voids Popped - " + member.vialsUsed + " | Vials Stored - " + member.vialsStored + "\n";
                    } else {
                        reportMessage = newReportMessage
                    }

                    memberPlace += 1
                    if (memberPlace >= rows.length || memberPlace > 25) {
                        const authorMember = activeMembers.find(member => member.ID === message.author.id)
                        let authorPlace = activeMembers.indexOf(authorMember) + 1

                        reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
                            .setFooter("Your Rank: #" + authorPlace + "")

                        await message.author.send(reportEmbed);

                        const historyDMs = lanisBot.channels.get("396694518738714634")
                        let historyReport = new Discord.MessageEmbed()
                            .addField("Sent Leaderboard", `User <@${message.author.id}> has received the vials popped leaderboard after requesting it.`)
                            .setColor("3ea04a")
                            .setFooter("User ID: " + message.author.id)
                            .setTimestamp()


                        if (message.channel.type === "dm") {
                            historyReport.addField("Channel Type", "Direct Message")
                        } else {
                            historyReport.addField("Channel Type", `<#${message.channel.id}>`)
                        }

                        await historyDMs.send(historyReport)

                        if (message.channel.type !== "dm") {
                            await sleep(30000)
                            await message.delete()
                     
                       }
                       return
                    }
                }
            })
            reactionCollector.stop()
        } else if (reaction.emoji.id === "506091097970442257") { //Runs Led 
            lanisBot.database.all(`SELECT * FROM stats WHERE cultsLed >= 0 OR voidsLed >= 0 OR assists >= 0;`, async (error, rows) => {
                reportEmbed.setDescription("Leaderboard of Runs Led");

                rows.forEach(member => {
                    activeMembers.push(member)
                })

                activeMembers.sort(compareRunsLed);
                let memberPlace = 1
                for (const member of activeMembers) {
                    const currentMember = guild.members.get(member.ID)
                    if (!currentMember) continue;

                    const memberName = currentMember.id === message.author.id ? currentMember.toString() : currentMember.displayName;
                    const newReportMessage = reportMessage + "\n**[#" + memberPlace + "]** " + memberName + "\n Cults Led - " + member.cultsLed + " | Voids Led - " + member.voidsLed + " | Assisted Runs - " + member.assists + "\n";
                    if (newReportMessage.length > 1024) {
                        reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
                        reportMessage = "**[#" + memberPlace + "]** " + memberName + "\n Cults Led - " + member.cultsLed + " | Voids Led - " + member.voidsLed + " | Assisted Runs - " + member.assists + "\n";
                    } else {
                        reportMessage = newReportMessage
                    }

                    memberPlace += 1
                    if (memberPlace >= rows.length || memberPlace > 25) {
                        const authorMember = activeMembers.find(member => member.ID === message.author.id)
                        let authorPlace = activeMembers.indexOf(authorMember) + 1

                        reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
                            .setFooter("Your Rank: #" + authorPlace + "")

                        await message.author.send(reportEmbed);

                        const historyDMs = lanisBot.channels.get("396694518738714634")
                        let historyReport = new Discord.MessageEmbed()
                            .addField("Sent Leaderboard", `User <@${message.author.id}> has received the runs led leaderboard after requesting it.`)
                            .setColor("3ea04a")
                            .setFooter("User ID: " + message.author.id)
                            .setTimestamp()


                        if (message.channel.type === "dm") {
                            historyReport.addField("Channel Type", "Direct Message")
                        } else {
                            historyReport.addField("Channel Type", `<#${message.channel.id}>`)
                        }

                        await historyDMs.send(historyReport)

                        if (message.channel.type !== "dm") {
                            await sleep(30000)
                            await message.delete()
                     
                       }
                       return
                    }
                }
            })
            reactionCollector.stop()
        } else {
            message.author.send("Unfortunetaly I cannot comprehend that emoji 😕 ...")
        }
    })

    reactionCollector.on("end", async (collected) => {
        typePromptEmbed.setFooter("Not Awaiting Input")
        await messageSent.edit(typePromptEmbed)
    })

    await message.react("✅")
    await messageSent.react(lanisBot.emojis.find(emoji => emoji.id === Emojis.lostHalls.dungeon))
    await messageSent.react(lanisBot.emojis.find(emoji => emoji.id === Emojis.lostHalls.key))
    await messageSent.react(lanisBot.emojis.find(emoji => emoji.id === Emojis.lostHalls.vial))
    await messageSent.react(lanisBot.emojis.find(emoji => emoji.id === Emojis.lostHalls.voidEntity))
}

module.exports.help = {
    name: "leaderboard",
    category: "Bot",
    example: "`-leaderboard`",
    explanation: "Displays the people who have done the most runs."
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}