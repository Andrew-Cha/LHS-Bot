const Discord = require("discord.js");

const channels = require("../dataFiles/channels.json");
const fs = require('fs');
const path = require('path');
const safeGuardConfigsFile = path.normalize(__dirname + "../../dataFiles/safeGuardConfigs.json");
const safeGuardConfigs = require(safeGuardConfigsFile);

module.exports.run = async (lanisBot, message, args) => {
    const authorRoles = message.member.roles.values();
    let isLeader = false;
    for (role of authorRoles) {
        if (role.name === "Raid Leader" || role.name === "Almost Raid Leader") {
            isLeader = true;
            break;
        }
    }
    if (!isLeader) return await message.channel.send("You have to be a Raid Leader to start an AFK check.");

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

    let aborted = false;
    const raidingChannelCount = Object.keys(channels.raidingChannels).length;
    const botCommands = lanisBot.channels.get(channels.botCommands);
    const raidStatusAnnouncements = lanisBot.channels.get(channels.raidStatusAnnouncements);
    const wantedChannel = args[0];
    const wantedType = args[1];
    const marbleSealEmote = lanisBot.emojis.find("name", "marble");
    let raidEmote;
    let raidType;
    let channelNumber;
    let raidingChannel;

    if (0 < wantedChannel && wantedChannel <= raidingChannelCount) {
        channelNumber = wantedChannel - 1;
        raidingChannel = lanisBot.channels.get(channels.raidingChannels[channelNumber]);
    } else {
        const error = "No such raiding channel found to set up for raiding.";
        await message.channel.send(error);
        return;
    }

    if (wantedType != undefined) {
        if (wantedType.toUpperCase() === "CULT") {
            raidEmote = lanisBot.emojis.find("name", "cultist");
            raidType = "**Cult**";
        } else if (wantedType.toUpperCase() === "VOID") {
            raidEmote = lanisBot.emojis.find("name", "LHvoid");
            raidType = "**Void**";
        } else {
            message.channel.send("Please input a correct raid type: Cult or Void");
            return;
        }
    } else {
        message.channel.send("Please input a correct raid type: Cult or Void");
        return;
    }

    let locationMessage = "";

    for (i = 2; i < args.length; i++) {
        locationMessage = locationMessage + args[i] + " ";
    }

    let arlLocationMessage;
    if (locationMessage !== "") {
        arlLocationMessage = await lanisBot.channels.get(channels.arlChat).send("The location for Raiding Channel Number " + wantedChannel + " is: **" + locationMessage + "**");
    }

    let queueChannels = [];
    await message.guild.fetchMembers().then(guild => {
        for (let i = 0; i < Object.keys(channels.queues).length; i++) {
            const channelID = channels.queues[i];
            const queueChannel = guild.channels.get(channelID);
            queueChannels.push(queueChannel)
        }
    }).catch(e => {
        console.log(e);
    });

    let index;
    let currentLeader;
    for (let i = 0; i < safeGuardConfigs.leaders.length; i++) {
        if (safeGuardConfigs.leaders[i].id === message.author.id) {
            index = i;
            break;
        }
    }

    if (index != undefined && locationMessage === "") {
        currentLeader = safeGuardConfigs.leaders[index];
        if (currentLeader.commands.includes("AFK")) {
            let abortCheck = false;
            await new Promise(async (resolve, reject) => {
                await message.channel.send("Are you sure?");
                const messageFilter = (responseMessage, user) => responseMessage.content != "" && responseMessage.author === message.author;
                const safeGuardCollector = new Discord.MessageCollector(message.channel, messageFilter, { time: 60000 });
                safeGuardCollector.on("collect", async (responseMessage, safeGuardCollector) => {
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
                await message.channel.send("Starting the AFK check.");
            }).catch(async (failureMessage) => {
                await message.channel.send("Stopping the AFK check.");
                abortCheck = true;
            });
            if (abortCheck) return;
        }
    }
    const date = new Date().toISOString();
    console.log("New AFK Check at: " + date + " by: " + message.member.displayName);

    const warningMessage = ("@here started by " + message.member + " for Raiding Channel #" + wantedChannel);
    const warning = await raidStatusAnnouncements.send(warningMessage);
    //const warning = await botCommands.send(warningMessage);

    const reactEmojis = [
        raidEmote,
        lanisBot.emojis.find("name", "vial"),
        lanisBot.emojis.find("name", "LHwarrior"),
        lanisBot.emojis.find("name", "LHpaladin"),
        lanisBot.emojis.find("name", "knight"),
        lanisBot.emojis.find("name", "LHpriest"),
        lanisBot.emojis.find("name", "LHkey"),
        "❌"
    ];

    let borderColor;
    if (wantedType.toUpperCase() === "CULT") {
        borderColor = "#cf0202"; //Red
    } else if (wantedType.toUpperCase() === "VOID") {
        borderColor = "#24048b"; //Purple
    }

    let afkCheckEmbed = new Discord.RichEmbed()
        .setColor(borderColor);
    if (wantedType.toUpperCase() === "VOID") {
        const voidEmbedMessage = "To join go to queue and react to " + raidEmote + "\nIf you have a key react with: " + reactEmojis[6] + "\nIf you have a vial react with:" + reactEmojis[1] + "\nIf you have a marble seal react with:" + marbleSealEmote + "\nTo indicate your class choice react with: " + reactEmojis[2] + reactEmojis[3] + reactEmojis[4] + reactEmojis[5] + "\nIf you are a leader and want the AFK check to END, react with:" + reactEmojis[7];
        afkCheckEmbed.addField("Void AFK Check" + raidEmote, voidEmbedMessage, false);
    } else if (wantedType.toUpperCase() === "CULT") {
        const cultEmbedMessage = "To join go to queue and react to " + raidEmote + "\nIf you have a key react with: " + reactEmojis[6] + "\nTo indicate your class choice react with: " + reactEmojis[2] + reactEmojis[3] + reactEmojis[4] + reactEmojis[5] + "\nIf you are a leader and want the AFK check to END, react with:" + reactEmojis[7];
        afkCheckEmbed.addField("Cult AFK Check", cultEmbedMessage, false);
    }
    afkCheckEmbed.setFooter("Time left: 6 minutes 0 seconds.")

    const afkCheckMessage = await raidStatusAnnouncements.send(afkCheckEmbed);
    //const afkCheckMessage = await botCommands.send(afkCheckEmbed);

    await message.channel.send("AFK check started.");

    const filter = (reaction, user) => (reaction.emoji.name === "❌" ||
        reaction.emoji === lanisBot.emojis.find("name", "LHvoid") ||
        reaction.emoji === lanisBot.emojis.find("name", "cultist") ||
        reaction.emoji === lanisBot.emojis.find("name", "LHkey") ||
        reaction.emoji === lanisBot.emojis.find("name", "vial") ||
        reaction.emoji === lanisBot.emojis.find("name", "LHpaladin") ||
        reaction.emoji === lanisBot.emojis.find("name", "LHwarrior") ||
        reaction.emoji === lanisBot.emojis.find("name", "knight") ||
        reaction.emoji === lanisBot.emojis.find("name", "marble") ||
        reaction.emoji === lanisBot.emojis.find("name", "LHpriest")) && user.bot === false;

    const confirmationFilter = (confirmationMessage) => confirmationMessage.content !== "" && confirmationMessage.author.bot === false;

    let peopleActive = [];
    let peopleMessaged = [];
    let vialsMessaged = 0;
    let keysMessaged = 0;

    await message.guild.fetchMembers();
    const afkCheckCollector = new Discord.ReactionCollector(afkCheckMessage, filter, { time: 360000 });
    afkCheckCollector.on("collect", async (reaction, afkCheckCollector) => {
        const currentMember = await message.guild.members.get(reaction.users.last().id);
        let personInQueue = false;
        for (queueChannel of queueChannels) {
            if (queueChannel.members.has(currentMember.id) === true) {
                personInQueue = true;
            }
        }

        if (!currentMember.user.bot) {
            let DMChannel = await currentMember.createDM();
            if (currentMember) {
                console.log("Got reaction from: " + currentMember.displayName + " of " + reaction.emoji.name);
            }
            if (reaction.emoji.name === "❌") {
                if (currentMember && currentMember.hasPermission("MOVE_MEMBERS")) {
                    afkCheckCollector.stop();
                    await botCommands.send("AFK #" + wantedChannel + " stopped by " + currentMember.displayName + ".");
                }
            } else if (reaction.emoji === lanisBot.emojis.find("name", "LHkey")) {
                if (locationMessage != "") {
                    if (peopleMessaged.includes(currentMember.id) === false) {
                        if (raidingChannel.members.has(currentMember.id) === true || personInQueue) {
                            if (keysMessaged < 1) {
                                await new Promise(async (resolve, reject) => {
                                    peopleMessaged.push(currentMember.id);
                                    await currentMember.send("Are you sure you have the key and want to be sent the location? Not coming to the location with the key will result in a suspension.\nRespond either with: `yes` or `no`.").catch(async e => {
                                        await message.channel.send("User " + currentMember + " tried to get location as a vial but their DMs are turned off.");
                                    });
                                    const messageCollector = await DMChannel.createMessageCollector(confirmationFilter, { time: 60000 });
                                    messageCollector.on("collect", async (responseMessage, messageCollector) => {
                                        if (!/[^a-zA-Z]/.test(responseMessage.content)) {
                                            if (responseMessage.content.toUpperCase() === "YES") {
                                                messageCollector.stop("CONTINUE");
                                            } else if (responseMessage.content.toUpperCase() === "NO") {
                                                messageCollector.stop("STOP");;
                                            }
                                        } else {
                                            await currentMember.send("Please respond with a correct answer: `yes` or `no`.");
                                        }
                                    });

                                    messageCollector.on("end", async (collected, reason) => {
                                        if (reason === "CONTINUE") {
                                            resolve("SUCCESS");
                                        } else if (reason === "STOP" || reason === "time") {
                                            reject("FAILURE");
                                        }
                                    })
                                }).then(async (successMessage) => {
                                    if (keysMessaged < 1) {
                                        await currentMember.send("The location is: " + locationMessage);
                                        botCommands.send("Person: " + currentMember + " has reacted with key and location has been sent to them.");
                                        keysMessaged += 1;
                                    } else {
                                        await currentMember.send("Sorry, some other key holder has already been sent the location.");
                                        const index = peopleMessaged.indexOf(currentMember.id);
                                        peopleMessaged.splice(index, 1);
                                    }
                                }).catch(async (failureMessage) => {
                                    await currentMember.send("Not sending the location.");
                                    const index = peopleMessaged.indexOf(currentMember.id);
                                    peopleMessaged.splice(index, 1);
                                });
                            }
                        }
                    }
                }
            } else if (reaction.emoji === lanisBot.emojis.find("name", "vial")) {
                if (locationMessage != "") {
                    if (peopleMessaged.includes(currentMember.id) === false) {
                        if (raidingChannel.members.has(currentMember.id) === true || personInQueue) {
                            if (vialsMessaged < 1) {
                                await new Promise(async (resolve, reject) => {
                                    await currentMember.send("Are you sure you have the vial and want to be sent the location? Not coming to the location with the vial will result in a suspension.\nRespond either with: `yes` or `no`.").catch(async e => {
                                        await message.channel.send("User " + currentMember + " tried to get location as a vial but their DMs are turned off.");
                                    });
                                    peopleMessaged.push(currentMember.id);
                                    const messageCollector = DMChannel.createMessageCollector(confirmationFilter, { time: 60000 });
                                    messageCollector.on("collect", async (responseMessage, messageCollector) => {
                                        if (!/[^a-zA-Z]/.test(responseMessage.content)) {
                                            if (responseMessage.content.toUpperCase() === "YES") {
                                                messageCollector.stop("CONTINUE");
                                            } else if (responseMessage.content.toUpperCase() === "NO") {
                                                messageCollector.stop("STOP");;
                                            }
                                        } else {
                                            await currentMember.send("Please respond with a correct answer: `yes` or `no`.");
                                        }
                                    });

                                    messageCollector.on("end", async (collected, reason) => {
                                        if (reason === "CONTINUE") {
                                            resolve("SUCCESS");
                                        } else if (reason === "STOP" || reason === "time") {
                                            reject("FAILURE");
                                        }
                                    })
                                }).then(async (successMessage) => {
                                    if (vialsMessaged < 1) {
                                        await currentMember.send("The location is: " + locationMessage + ", you are the **main** vial.");
                                        vialsMessaged += 1;
                                        botCommands.send("Person: " + currentMember + " has reacted with vial and location has been sent to them, they are the **main** vial.");
                                    } else {
                                        await currentMember.send("The location has already been sent to the main vial, if you want to become a backup vial please react again.");
                                        const index = peopleMessaged.indexOf(currentMember.id);
                                        peopleMessaged.splice(index, 1);
                                    }
                                }).catch(async (failureMessage) => {
                                    await currentMember.send("Not sending the location.");
                                    const index = peopleMessaged.indexOf(currentMember.id);
                                    peopleMessaged.splice(index, 1);
                                });
                            } else if (vialsMessaged < 4) {
                                await new Promise(async (resolve, reject) => {
                                    await currentMember.send("Are you sure you have the vial and want to be sent the location? Not coming to the location with the vial will result in a suspension.\nRespond either with: `yes` or `no`.").catch(async e => {
                                        await message.channel.send("User " + currentMember + " tried to get location as a vial but their DMs are turned off.");
                                    });
                                    peopleMessaged.push(currentMember.id);
                                    const messageCollector = DMChannel.createMessageCollector(confirmationFilter, { time: 60000 });
                                    messageCollector.on("collect", async (responseMessage, messageCollector) => {
                                        if (!/[^a-zA-Z]/.test(responseMessage.content)) {
                                            if (responseMessage.content.toUpperCase() === "YES") {
                                                messageCollector.stop("CONTINUE");
                                            } else if (responseMessage.toUpperCase() === "NO") {
                                                messageCollector.stop("STOP");;
                                            }
                                        } else {
                                            await currentMember.send("Please respond with a correct answer: `yes` or `no`.");
                                        }
                                    });

                                    messageCollector.on("end", async (collected, reason) => {
                                        if (reason === "CONTINUE") {
                                            resolve("SUCCESS");
                                        } else if (reason === "STOP" || reason === "time") {
                                            reject("FAILURE");
                                        }
                                    })
                                }).then(async (successMessage) => {
                                    if (vialsMessaged < 4) {
                                        await currentMember.send("The location is: " + locationMessage + ", you are a **backup** vial.");
                                        vialsMessaged += 1;
                                        botCommands.send("Person: " + currentMember + " has reacted with vial and location has been sent to them, they are a **backup** vial.");
                                    } else {
                                        await currentMember.send("Sorry we already have too many vials.");
                                        const index = peopleMessaged.indexOf(currentMember.id);
                                        peopleMessaged.splice(index, 1);
                                    }
                                }).catch(async (failureMessage) => {
                                    await currentMember.send("Not sending the location.");
                                    const index = peopleMessaged.indexOf(currentMember.id);
                                    peopleMessaged.splice(index, 1);
                                });
                            }
                        }
                    }
                }
            } else {
                if (personInQueue) {
                    console.log("Moving person into raiding channel " + wantedChannel + " : " + currentMember.displayName);
                    await currentMember.setVoiceChannel(raidingChannel.id);
                }
            }
        }
    });

    if (wantedType.toUpperCase() === "CULT") {
        reactEmojis.splice(1, 1);
    } else if (wantedType.toUpperCase() === "VOID") {
        reactEmojis.splice(2, 0, marbleSealEmote);
    }

    for (const emoji of reactEmojis) {
        await afkCheckMessage.react(emoji)
            .catch(console.error);
    }

    let timeTotal = afkCheckCollector.options.time;
    const updateTimeLeft = setInterval(() => {
        const embed = afkCheckMessage.embeds[0];
        timeTotal -= 5000;
        const minutesLeft = Math.floor(timeTotal / 60000);
        const secondsLeft = Math.floor((timeTotal - minutesLeft * 60000) / 1000);
        afkCheckEmbed.setFooter("Time left: " + minutesLeft + " minutes " + secondsLeft + " seconds.");
        afkCheckMessage.edit(afkCheckEmbed);
    }, 5000);

    let abortEmbed = new Discord.RichEmbed()
        .setColor(borderColor)
        .addField(`Abort Raiding Channel Number **${wantedChannel}**`, `If you made a mistake you can abort the AFK check now, no people will be moved to AFK.`);

    const abortMessage = await botCommands.send(abortEmbed);
    abortMessage.react("❌");
    const abortFilter = (reaction, user) => reaction.emoji.name === "❌"
    const abortReactCollector = new Discord.ReactionCollector(abortMessage, abortFilter, { time: 360000 });
    abortReactCollector.on("collect", async (reaction, afkCheckCollector) => {
        const currentMember = await message.guild.members.get(reaction.users.last().id);
        if (reaction.emoji.name === "❌") {
            if (!reaction.users.last().bot) {
                if (currentMember && currentMember.hasPermission("MOVE_MEMBERS")) {
                    aborted = true;
                    await afkCheckMessage.delete();
                    await warning.delete();
                    await abortReactCollector.stop();
                    await clearInterval(updateTimeLeft);
                    if (arlLocationMessage) {
                        await arlLocationMessage.delete();
                    }
                    await message.channel.send("AFK Check aborted by " + currentMember);
                    console.log("AFK check aborted");
                    return;
                }
            }
        }
    });

    abortReactCollector.on("end", async (collected, reason) => {
        abortMessage.delete();
    });

    afkCheckCollector.on("end", async (collected, reason) => {
        await abortReactCollector.stop();
        await clearInterval(updateTimeLeft);
        let peopleActive = [];
        const movingPeopleWarning = await raidStatusAnnouncements.send("Finishing moving the last of the people. Please wait.")
        for (const collectedEmoji of collected.values()) {
            for (const member of collectedEmoji.users.values()) {
                if (!member.bot) {
                    if (peopleActive.includes(member.id) === false) {
                        peopleActive.push(member.id);
                    }
                    const currentMember = message.guild.members.get(member.id);
                    let personInQueue = false;
                    for (queueChannel of queueChannels) {
                        if (queueChannel.members.has(currentMember.id) === true) {
                            personInQueue = true;
                        }
                    }
                    if (personInQueue) {
                        console.log("Moving person into raiding channel " + wantedChannel + " : " + currentMember.displayName + " at the end.");
                        await currentMember.setVoiceChannel(raidingChannel.id);
                    }
                }
            }
        }

        await movingPeopleWarning.delete();

        if (reason !== "user") {
            const editedEmbed = new Discord.RichEmbed()
                .setColor(borderColor)
                .addField("The AFK check has run out of time.", `Please wait for the next run to start.\nTotal raiders: ` + peopleActive.length)
                .setFooter("Started by " + message.member.displayName + " at " + hour + ":" + minutes + timeType + " UTC");
            await afkCheckMessage.edit(editedEmbed);
        } else {
            const editedEmbed = new Discord.RichEmbed()
                .setColor(borderColor)
                .addField("The AFK check has been stopped manually.", `Please wait for the next run to start.\nTotal raiders: ` + peopleActive.length)
                .setFooter("Started by " + message.member.displayName + " at " + hour + ":" + minutes + timeType + " UTC");
            await afkCheckMessage.edit(editedEmbed);
        }
        await warning.delete();

        const members = raidingChannel.members;

        for (const member of members.values()) {
            if (!member.bot) {
                if (!aborted) {
                    if ((member.deaf && !member.hasPermission("MOVE_MEMBERS")) || (peopleActive.includes(member.id) === false && member.hasPermission("MOVE_MEMBERS") == false)) {
                        await member.setVoiceChannel(channels.afk);
                        console.log("Moving to AFK from raiding channel " + wantedChannel + " : " + member.displayName);
                    }
                }
            }
        }

    });
}


module.exports.help = {
    name: "afk"
}
