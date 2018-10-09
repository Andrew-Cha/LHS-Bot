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
    const marbleSealEmote = lanisBot.emojis.find(emoji => emoji.name === "marble");
    let raidEmote;
    let raidType;
    let channelNumber;
    let raidingChannel;

    if (0 < wantedChannel && wantedChannel <= raidingChannelCount) {
        channelNumber = wantedChannel - 1;
        raidingChannel = lanisBot.channels.get(channels.raidingChannels[channelNumber]);
        if (raidingChannel === undefined) {
            const error = "No such raiding channel found to set up for raiding.";
            await message.channel.send(error);
            return;
        }
    } else {
        const error = "No such raiding channel found to set up for raiding.";
        await message.channel.send(error);
        return;
    }


    if (raidingChannel.name.toUpperCase().includes("JOIN")) {
        return await message.channel.send(message.member.toString() + ", it seems there is an active AFK check in that channel as it has the word 'Join' in it's title.")
    }

    if (wantedType != undefined) {
        if (wantedType.toUpperCase() === "CULT") {
            raidEmote = lanisBot.emojis.find(emoji => emoji.name === "cultist");
            raidType = "**Cult**";
        } else if (wantedType.toUpperCase() === "VOID") {
            raidEmote = lanisBot.emojis.find(emoji => emoji.name === "LHvoid");
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

    let noPermissions = false;
    const oldName = "raiding-" + wantedChannel
    const newName = oldName + " <-- Join!";
    await raidingChannel.setName(newName, "Starting Raid for Raiding Channel #" + wantedChannel)
        .catch(e => {
            noPermissions = true
        });
    const verifiedRaiderRole = message.guild.roles.find(role => role.name === "Verified Raider");
    await raidingChannel.updateOverwrite(
        verifiedRaiderRole, {
            CONNECT: true
        },
        "Starting Raid for Raiding Channel #" + wantedChannel
    ).catch(e => {
        console.log(e);
        noPermissions = true;
    });
    await raidingChannel.setUserLimit(0, "Starting Raid for Raiding Channel #" + wantedChannel)
        .catch(e => {
            noPermissions = true
        });


    if (noPermissions) return await message.channel.send("No permissions to open the voice channel for raiders, sorry.");

    let borderColor;
    if (wantedType.toUpperCase() === "CULT") {
        borderColor = "#cf0202"; //Red
    } else if (wantedType.toUpperCase() === "VOID") {
        borderColor = "#24048b"; //Purple
    }

    let arlLocationMessage;
    let locationEmbed = new Discord.MessageEmbed()
    if (locationMessage !== "") {
        locationEmbed.setColor(borderColor)
            .setDescription(raidType + " run in Raiding Channel #" + wantedChannel)
            .addField("Location", locationMessage)
            .setFooter("Started by " + message.member.displayName + " at " + hour + ":" + minutes + timeType + " UTC");
        arlLocationMessage = await lanisBot.channels.get(channels.arlChat).send(locationEmbed);
    }

    const warningMessage = ("@here started by " + message.member.toString() + " for Raiding Channel #" + wantedChannel);
    const warning = await raidStatusAnnouncements.send(warningMessage);
    //const warning = await botCommands.send(warningMessage);

    const reactEmojis = [
        raidEmote,
        lanisBot.emojis.find(emoji => emoji.name === "vial"),
        lanisBot.emojis.find(emoji => emoji.name === "LHwarrior"),
        lanisBot.emojis.find(emoji => emoji.name === "LHpaladin"),
        lanisBot.emojis.find(emoji => emoji.name === "knight"),
        lanisBot.emojis.find(emoji => emoji.name === "LHpriest"),
        lanisBot.emojis.find(emoji => emoji.name === "LHkey"),
        "❌"
    ];

    let afkCheckEmbed = new Discord.MessageEmbed()
        .setColor(borderColor);
    if (wantedType.toUpperCase() === "VOID") {
        const voidEmbedMessage = "To join, **connect to the raiding channel by clicking it's name** and react to " + raidEmote.toString() + "\nIf you have a key react with: " + reactEmojis[6].toString() + "\nIf you have a vial react with:" + reactEmojis[1].toString() + "\nIf you have a marble seal react with:" + marbleSealEmote.toString() + "\nTo indicate your class choice react with: " + reactEmojis[2].toString() + reactEmojis[3].toString() + reactEmojis[4].toString() + reactEmojis[5].toString() + "\nIf you are a leader and want the AFK check to END, react with:" + reactEmojis[7];
        afkCheckEmbed.addField("Void AFK Check" + raidEmote.toString(), voidEmbedMessage, false);
    } else if (wantedType.toUpperCase() === "CULT") {
        const cultEmbedMessage = "To join, **connect the raiding channel by clicking it's name** and react to " + raidEmote.toString() + "\nIf you have a key react with: " + reactEmojis[6].toString() + "\nTo indicate your class choice react with: " + reactEmojis[2].toString() + reactEmojis[3].toString() + reactEmojis[4].toString() + reactEmojis[5].toString() + "\nIf you are a leader and want the AFK check to END, react with:" + reactEmojis[7];
        afkCheckEmbed.addField("Cult AFK Check", cultEmbedMessage, false);
    }
    afkCheckEmbed.setFooter("Time left: 6 minutes 0 seconds; Total people: 0.")

    const afkCheckMessage = await raidStatusAnnouncements.send(afkCheckEmbed);
    //const afkCheckMessage = await botCommands.send(afkCheckEmbed);

    let informationPanel = new Discord.MessageEmbed()
        .setColor(borderColor)
        .setDescription("Information Panel, Raiding Channel #" + wantedChannel)
        .addField("Key:", "None")
        .setFooter("AFK check is in progress.");

    if (wantedType.toUpperCase() === "VOID") informationPanel.addField("Vials:", "None");
    if (locationMessage !== "") { informationPanel.addField("Location:", locationMessage) }
    const informationPanelMessage = await botCommands.send(informationPanel);

    let totalPeople = 0;
    let peopleReacted = [];

    const filter = (reaction, user) => (reaction.emoji.name === "❌" ||
        reaction.emoji === lanisBot.emojis.find(emoji => emoji.name === "LHvoid") ||
        reaction.emoji === lanisBot.emojis.find(emoji => emoji.name === "cultist") ||
        reaction.emoji === lanisBot.emojis.find(emoji => emoji.name === "LHkey") ||
        reaction.emoji === lanisBot.emojis.find(emoji => emoji.name === "vial") ||
        reaction.emoji === lanisBot.emojis.find(emoji => emoji.name === "LHpaladin") ||
        reaction.emoji === lanisBot.emojis.find(emoji => emoji.name === "LHwarrior") ||
        reaction.emoji === lanisBot.emojis.find(emoji => emoji.name === "knight") ||
        reaction.emoji === lanisBot.emojis.find(emoji => emoji.name === "marble") ||
        reaction.emoji === lanisBot.emojis.find(emoji => emoji.name === "LHpriest")) && user.bot === false;

    const confirmationFilter = (confirmationMessage) => confirmationMessage.content !== "" && confirmationMessage.author.bot === false;

    let peopleMessaged = [];
    let vialsMessaged = 0;
    let keysMessaged = 0;

    const afkCheckCollector = new Discord.ReactionCollector(afkCheckMessage, filter, { time: 360000 });
    afkCheckCollector.on("collect", async (reaction, user) => {
        const currentMember = await message.guild.members.get(user.id);

        if (!currentMember.user.bot) {
            let DMChannel = await currentMember.createDM();
            if (currentMember) {
                console.log("Got reaction from: " + currentMember.displayName + " of " + reaction.emoji.name);
            }
            if (reaction.emoji.name === "❌") {
                if (currentMember && currentMember.hasPermission("MOVE_MEMBERS")) {
                    await afkCheckCollector.stop();
                    informationPanel.setFooter("AFK check has been stopped by " + currentMember.displayName);
                    await informationPanelMessage.edit(informationPanel);
                }
            } else if (reaction.emoji === lanisBot.emojis.find(emoji => emoji.name === "LHkey")) {
                if (locationMessage != "") {
                    if (peopleMessaged.includes(currentMember.id) === false) {
                        if (raidingChannel.members.has(currentMember.id) === true) {
                            if (keysMessaged < 1) {
                                await new Promise(async (resolve, reject) => {
                                    peopleMessaged.push(currentMember.id);
                                    await currentMember.send("Are you sure you have the key and want to be sent the location? Not coming to the location with the key will result in a suspension.\nRespond either with: `yes` or `no`.").catch(async e => {
                                        await message.channel.send("User " + currentMember.toString() + " tried to get location as a vial but their DMs are turned off.");
                                    });
                                    const messageCollector = await DMChannel.createMessageCollector(confirmationFilter, { time: 60000 });
                                    messageCollector.on("collect", async (responseMessage, user) => {
                                        if (!/[^a-zA-Z]/.test(responseMessage.content)) {
                                            if (responseMessage.content.toUpperCase() === "YES") {
                                                messageCollector.stop("CONTINUE");
                                            } else if (responseMessage.content.toUpperCase() === "NO") {
                                                messageCollector.stop("STOP");;
                                            } else {
                                                await currentMember.send("Please respond with a correct answer: `yes` or `no`.");
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
                                        keysMessaged += 1;
                                        informationPanel.fields[0] = { name: "Key:", value: currentMember.toString(), inline: false };
                                        await informationPanelMessage.edit(informationPanel);
                                    } else {
                                        await currentMember.send("Sorry, some other key holder has already been sent the location.");
                                        const index = peopleMessaged.indexOf(currentMember.id);
                                        peopleMessaged.splice(index, 1);
                                    }
                                }).catch(async (failureMessage) => {
                                    console.log(failureMessage);
                                    await currentMember.send("Not sending the location.");
                                    const index = peopleMessaged.indexOf(currentMember.id);
                                    peopleMessaged.splice(index, 1);
                                });
                            }
                        }
                    }
                }
            } else if (reaction.emoji === lanisBot.emojis.find(emoji => emoji.name === "vial")) {
                if (locationMessage != "") {
                    if (peopleMessaged.includes(currentMember.id) === false) {
                        if (raidingChannel.members.has(currentMember.id) === true) {
                            if (vialsMessaged < 1) {
                                await new Promise(async (resolve, reject) => {
                                    await currentMember.send("Are you sure you have the vial and want to be sent the location? Not coming to the location with the vial will result in a suspension.\nRespond either with: `yes` or `no`.").catch(async e => {
                                        await message.channel.send("User " + currentMember.toString() + " tried to get location as a vial but their DMs are turned off.");
                                    });
                                    peopleMessaged.push(currentMember.id);
                                    const messageCollector = DMChannel.createMessageCollector(confirmationFilter, { time: 60000 });
                                    messageCollector.on("collect", async (responseMessage, user) => {
                                        if (!/[^a-zA-Z]/.test(responseMessage.content)) {
                                            if (responseMessage.content.toUpperCase() === "YES") {
                                                messageCollector.stop("CONTINUE");
                                            } else if (responseMessage.content.toUpperCase() === "NO") {
                                                messageCollector.stop("STOP");;
                                            } else {
                                                await currentMember.send("Please respond with a correct answer: `yes` or `no`.");
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
                                        informationPanel.fields[1] = { name: "Vials:", value: currentMember.toString() + " / Main", inline: false };
                                        await informationPanelMessage.edit(informationPanel);
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
                            } else if (vialsMessaged < 3) {
                                await new Promise(async (resolve, reject) => {
                                    await currentMember.send("Are you sure you have the vial and want to be sent the location? Not coming to the location with the vial will result in a suspension.\nRespond either with: `yes` or `no`.").catch(async e => {
                                        await message.channel.send("User " + currentMember + " tried to get location as a vial but their DMs are turned off.");
                                    });
                                    peopleMessaged.push(currentMember.id);
                                    const messageCollector = DMChannel.createMessageCollector(confirmationFilter, { time: 60000 });
                                    messageCollector.on("collect", async (responseMessage, user) => {
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
                                    if (vialsMessaged < 3) {
                                        await currentMember.send("The location is: " + locationMessage + ", you are a **backup** vial.");
                                        vialsMessaged += 1;
                                        const oldVials = informationPanel.fields[1]
                                        informationPanel.fields[1] = { name: "Vials:", value: oldVials.value + "\n" + currentMember.toString(), inline: false };
                                        await informationPanelMessage.edit(informationPanel);
                                    } else {
                                        await currentMember.send("Sorry we already have too many vials.");
                                        const index = peopleMessaged.indexOf(currentMember.id);
                                        peopleMessaged.splice(index, 1);
                                    }
                                }).catch(async (failureMessage) => {
                                    console.log(failureMessage)
                                    await currentMember.send("Not sending the location.");
                                    const index = peopleMessaged.indexOf(currentMember.id);
                                    peopleMessaged.splice(index, 1);
                                });
                            }
                        }
                    }
                }
            } else {
                if (!peopleReacted.includes(currentMember.id)) {
                    totalPeople++;
                    peopleReacted.push(currentMember.id);
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
        timeTotal -= 5000;
        const minutesLeft = Math.floor(timeTotal / 60000);
        const secondsLeft = Math.floor((timeTotal - minutesLeft * 60000) / 1000);
        afkCheckEmbed.setFooter("Time left: " + minutesLeft + " minutes " + secondsLeft + " seconds; Total people: " + totalPeople + ".");
        afkCheckMessage.edit(afkCheckEmbed);
    }, 5000);

    let abortEmbed = new Discord.MessageEmbed()
        .setColor(borderColor)
        .addField(`Abort Raiding Channel Number **${wantedChannel}**`, `If you made a mistake you can abort the AFK check now, no people will be moved to AFK.`);

    const abortMessage = await botCommands.send(abortEmbed);
    abortMessage.react("❌");
    const abortFilter = (reaction, user) => reaction.emoji.name === "❌"
    const abortReactCollector = new Discord.ReactionCollector(abortMessage, abortFilter, { time: 360000 });
    abortReactCollector.on("collect", async (reaction, user) => {
        const currentMember = await message.guild.members.get(reaction.users.last().id);
        if (reaction.emoji.name === "❌") {
            if (!reaction.users.last().bot) {
                if (currentMember && currentMember.hasPermission("MOVE_MEMBERS")) {
                    aborted = true;
                    await afkCheckMessage.delete();
                    await warning.delete();
                    await abortReactCollector.stop();
                    await clearInterval(updateTimeLeft);
                    await informationPanelMessage.delete();
                    if (arlLocationMessage) {
                        await arlLocationMessage.delete();
                    }
                    await message.channel.send("AFK check for Raiding Channel #" + wantedChannel + " aborted by " + currentMember.toString());
                    console.log("AFK check for Raiding Channel #" + wantedChannel + " aborted by " + currentMember.displayName);
                    await raidingChannel.setUserLimit(99, "Stopping AFK Check for Raiding Channel #" + wantedChannel)
                        .catch(e => {
                            noPermissions = true
                        });
                    await raidingChannel.setName(oldName, "Stopping AFK Check for Raiding Channel #" + wantedChannel)
                        .catch(e => {
                            noPermissions = true
                        });
                    await raidingChannel.updateOverwrite(
                        verifiedRaiderRole, {
                            CONNECT: null
                        },
                        "Stopping AFK Check for Raiding Channel #" + wantedChannel)
                        .catch(async e => {
                            console.log(e);
                            noPermissions = true;
                        });

                    if (noPermissions) return await message.channel.send("No permissions to close the voice channel for raiders, sorry.");

                    return;
                }
            }
        }
    });

    abortReactCollector.on("end", async (collected, reason) => {
        await abortMessage.delete();
    });

    afkCheckCollector.on("end", async (collected, reason) => {
        locationEmbed.setFooter("AFK check stopped by " + message.member.displayName + " at " + hour + ":" + minutes + timeType + " UTC");
        await arlLocationMessage.edit(locationEmbed);
        await raidingChannel.setName(oldName, "Stopping AFK Check for Raiding Channel #" + wantedChannel)
            .catch(e => {
                console.log(e);
                noPermissions = true
            });
        await raidingChannel.updateOverwrite(
            verifiedRaiderRole, {
                CONNECT: null
            },
            "Stopping AFK Check for Raiding Channel #" + wantedChannel)
            .catch(e => {
                console.log(e);
                noPermissions = true;
            });
        await raidingChannel.setUserLimit(99, "Stopping AFK Check for Raiding Channel #" + wantedChannel)
            .catch(e => {
                console.log(e)
                noPermissions = true
            });

        if (noPermissions) return await message.channel.send("No permissions to close the voice channel for raiders, sorry.");

        await abortReactCollector.stop();
        await clearInterval(updateTimeLeft);
        let editedEmbed;
        if (reason !== "user") {
            editedEmbed = new Discord.MessageEmbed()
                .setColor(borderColor)
                .addField("The AFK check has run out of time.", `Please wait for the next run to start.\nTotal raiders: ` + totalPeople);
        } else {
            editedEmbed = new Discord.MessageEmbed()
                .setColor(borderColor)
                .addField("The AFK check has been stopped manually.", `Please wait for the next run to start.\nTotal raiders: ` + totalPeople);
        }

        await warning.delete();
        const members = raidingChannel.members;

        for (const member of members.values()) {
            if (!member.bot) {
                if (!aborted) {
                    if ((member.deaf && !member.hasPermission("MOVE_MEMBERS")) || (peopleReacted.includes(member.id) === false && member.hasPermission("MOVE_MEMBERS") == false)) {
                        await member.setVoiceChannel(channels.afk);
                        console.log("Moving to AFK from raiding channel " + wantedChannel + " : " + member.displayName);
                    }
                }
            }
        }

        await editedEmbed.setFooter("Started by " + message.member.displayName + " at " + hour + ":" + minutes + timeType + " UTC");
        await afkCheckMessage.edit(editedEmbed);
        makePostAFKCheck(borderColor, raidStatusAnnouncements, raidingChannel);
    });
}


module.exports.help = {
    name: "afk"
}

async function makePostAFKCheck(borderColor, channel, intoChannel) {
    let queueChannels = [];
    for (let i = 0; i < Object.keys(channels.queues).length; i++) {
        const channelID = channels.queues[i];
        const queueChannel = channel.guild.channels.get(channelID);
        queueChannels.push(queueChannel)
    }

    const androidBugFixerEmbed = new Discord.MessageEmbed()
        .setColor(borderColor)
        .addField("Post-AFK Check Moving in", "If you got disconnected due to the android bug or because you forgot to react go to the **Lounge** channel and react below with:\n:eyes: ");
    //let androidBugFixerMessage = await raidStatusAnnouncements.send(androidBugFixerEmbed);
    let androidBugFixerMessage = await channel.send(androidBugFixerEmbed);
    let androidBugFixerFilter = (reaction, user) => (reaction.emoji.name === "👀")
    const androidBugFixerCollector = new Discord.ReactionCollector(androidBugFixerMessage, androidBugFixerFilter, { time: 60000 });
    androidBugFixerCollector.on("collect", async (reaction, user) => {
        let personInQueue = false;
        for (queueChannel of queueChannels) {
            if (queueChannel !== undefined) {
                if (queueChannel.members.has(user.id) === true) {
                    personInQueue = true;
                }
            }
        }

        if (personInQueue) await channel.guild.members.fetch(user.id).then(async (member) => {
            await member.setVoiceChannel(intoChannel);
        });
    });

    await androidBugFixerMessage.react("👀");
    androidBugFixerCollector.on("end", async (collected, reason) => {
        await androidBugFixerMessage.delete();
    });

}
function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}