const Discord = require("discord.js");

const channels = require("../channels.json");
const fs = require('fs');
const path = require('path');
const safeGuardConfigsFile = path.normalize(__dirname + "../../safeGuardConfigs.json");
const safeGuardConfigs = require(safeGuardConfigsFile);

module.exports.run = async (lanisBot, message, args) => {
    const date = new Date().toISOString();
    console.log("New AFK Check at: " + date + " by: " + message.member.displayName);
    const raidingChannelCount = Object.keys(channels.raidingChannels).length;
    const botCommands = lanisBot.channels.get(channels.botCommands);
    let wantedChannel = args[0];
    let wantedType = args[1];
    let raidEmote;
    let raidType;
    let channelNumber;
    let raidingChannel;
    let currentRunEmote;

    if (0 < wantedChannel && wantedChannel <= raidingChannelCount) {
        channelNumber = wantedChannel - 1;
        raidingChannel = lanisBot.channels.get(channels.raidingChannels[channelNumber]);
    } else {
        const error = "**No such raiding channel found to set up for raiding.**";
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
    if (locationMessage != "") {
        await lanisBot.channels.get(channels.arlChat).send("The location for Raiding Channel Number " + wantedChannel + " is: **" + locationMessage + "**");
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

    const warningMessage = ("@here Next run starting for the **Raiding Channel Number " + (channelNumber + 1) + "**, it's going to be a " + raidType + " run! React to the AFK check below! Started by: " + message.author);
    const warning = await lanisBot.channels.get(channels.raidStatusAnnouncements).send(warningMessage);

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
        .setColor(borderColor)
        .addField("AFK Check!", "We are starting an AFK check now, join queue and react with" + reactEmojis[0] + "to be moved in or kept in your current channel!\nIf you react with vial, key, or classes and do not bring them, you may be suspended.\n**In addition** to reacting with" + reactEmojis[0] + "also react if...", true)
    if (wantedType.toUpperCase() === "VOID") {
        afkCheckEmbed.addField("If you have a vial react with:", reactEmojis[1], true);
        afkCheckEmbed.addBlankField(true);
        const marbleSealEmote = lanisBot.emojis.find("name", "marbleseal");
        afkCheckEmbed.addField("If you have a marble seal react with:", marbleSealEmote, true);
    }
    afkCheckEmbed.addField("If you have a key react with:", reactEmojis[6], true)
        .addField("If you are bringing a warrior, react with:", reactEmojis[2], true)
        .addField("If you are bringing a paladin, react with:", reactEmojis[3], true)
        .addField("If you are bringing a knight react with:", reactEmojis[4], true)
        .addField("If you are bringing a priest, react with:", reactEmojis[5], true)
        .addField("If you are a leader and want the AFK check to END, react with:", reactEmojis[7], true)


    const afkCheckMessage = await lanisBot.channels.get(channels.raidStatusAnnouncements).send(afkCheckEmbed);

    await message.channel.send("AFK check started.");

    let abortEmbed = new Discord.RichEmbed()
        .setColor(borderColor)
        .addField(`Abort Raiding Channel Number **${wantedChannel}**`, `If you made a mistake you can abort the AFK check now, no people will be moved to AFK.`);
    let ranOutOfTime = false;
    const abortMessage = await lanisBot.channels.get(channels.botCommands).send(abortEmbed);
    abortMessage.react("❌");
    const abortFilter = (reaction, user) => reaction.emoji.name === "❌"
    const abortReactCollector = new Discord.ReactionCollector(abortMessage, abortFilter, { time: 360000 });
    abortReactCollector.on("collect", async (reaction, collector) => {
        const currentMember = await message.guild.members.get(reaction.users.last().id);
        if (reaction.emoji.name === "❌") {
            if (!reaction.users.last().bot) {
                if (currentMember && currentMember.hasPermission("MOVE_MEMBERS")) {
                    afkCheckMessage.delete();
                    warning.delete();
                    await message.channel.send("AFK check aborted.");
                    abortReactCollector.stop();
                }
            }
        }
    });

    abortReactCollector.on("end", async (collected, reason) => {
        abortMessage.delete();
        if (!ranOutOfTime) {
            clearInterval(movePeople);
            console.log("AFK check aborted");
            return;
        }
    });

    const filter = (reaction, user) => reaction.emoji.name === "❌" ||
        reaction.emoji === lanisBot.emojis.find("name", "LHvoid") ||
        reaction.emoji === lanisBot.emojis.find("name", "cultist") ||
        reaction.emoji === lanisBot.emojis.find("name", "LHkey") ||
        reaction.emoji === lanisBot.emojis.find("name", "vial") ||
        reaction.emoji === lanisBot.emojis.find("name", "LHpaladin") ||
        reaction.emoji === lanisBot.emojis.find("name", "LHwarrior") ||
        reaction.emoji === lanisBot.emojis.find("name", "knight") ||
        reaction.emoji === lanisBot.emojis.find("name", "LHpriest");

    const confirmationFilter = (confirmationMessage) => confirmationMessage.content !== "" && confirmationMessage.author.bot === false;

    let peopleActive = [];
    let peopleToMoveIn = [];
    let peopleMessaged = [];
    let vialsMessaged = 0;
    let keysMessaged = 0;

    const collector = new Discord.ReactionCollector(afkCheckMessage, filter, { time: 360000 });
    collector.on("collect", async (reaction, collector) => {
        const currentMember = await message.guild.members.get(reaction.users.last().id);
        raidingChannel = lanisBot.channels.get(channels.raidingChannels[channelNumber]);

        if (!reaction.users.last().bot) {
            let DMChannel = await currentMember.createDM();

            if (reaction.emoji.name === "❌") {
                if (currentMember && currentMember.hasPermission("MOVE_MEMBERS")) {
                    collector.stop();
                    const editedEmbed = new Discord.RichEmbed()
                        .setColor(borderColor)
                        .addField("The AFK check has been stopped by " + currentMember.displayName + ".", "Please wait for the next run to start.");
                    await afkCheckMessage.edit(editedEmbed).then(() => { }).catch(console.error);
                }
            } else if (reaction.emoji === lanisBot.emojis.find("name", "LHkey")) {
                if (locationMessage != "") {
                    if (peopleMessaged.includes(currentMember.id) === false) {
                        if (raidingChannel.members.has(currentMember.id) === true) {
                            if (keysMessaged < 1) {
                                await new Promise(async (resolve, reject) => {
                                    peopleMessaged.push(currentMember.id);
                                    await currentMember.send("Are you sure you have the key and want to be sent the location? Not coming to the location with the key will result in a suspension.\nRespond either with: `yes` or `no`.");
                                    const messageCollector = DMChannel.createMessageCollector(confirmationFilter, { time: 60000 });
                                    messageCollector.on("collect", async (responseMessage, messageCollector) => {
                                        if (responseMessage.content.toUpperCase() === "YES") {
                                            messageCollector.stop("CONTINUE");
                                        } else if (responseMessage.content.toUpperCase() === "NO") {
                                            messageCollector.stop("STOP");;
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
                                        await currentMember.send("The location is: " + locationMessage + ".");
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
                        if (raidingChannel.members.has(currentMember.id) === true) {
                            if (vialsMessaged < 1) {
                                await new Promise(async (resolve, reject) => {
                                    await currentMember.send("Are you sure you have the vial and want to be sent the location? Not coming to the location with the vial will result in a suspension.\nRespond either with: `yes` or `no`.");
                                    peopleMessaged.push(currentMember.id);
                                    const messageCollector = DMChannel.createMessageCollector(confirmationFilter, { time: 60000 });
                                    messageCollector.on("collect", async (responseMessage, messageCollector) => {
                                        if (responseMessage.content.toUpperCase() === "YES") {
                                            messageCollector.stop("CONTINUE");
                                        } else if (responseMessage.content.toUpperCase() === "NO") {
                                            messageCollector.stop("STOP");;
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
                                    await currentMember.send("Are you sure you have the vial and want to be sent the location? Not coming to the location with the vial will result in a suspension.\nRespond either with: `yes` or `no`.");
                                    peopleMessaged.push(currentMember.id);
                                    const messageCollector = DMChannel.createMessageCollector(confirmationFilter, { time: 60000 });
                                    messageCollector.on("collect", async (responseMessage, messageCollector) => {
                                        if (responseMessage.content.toUpperCase() === "YES") {
                                            messageCollector.stop("CONTINUE");
                                        } else if (responseMessage.toUpperCase() === "NO") {
                                            messageCollector.stop("STOP");;
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
                if (!peopleToMoveIn.includes(currentMember)) {
                    peopleToMoveIn.push(currentMember);
                    if (!peopleActive.includes(currentMember.id)) {
                        console.log("Added person: " + currentMember.displayName);
                        peopleActive.push(currentMember.id);
                    }
                }
            }
        }
    });

    if (wantedType.toUpperCase() === "CULT") {
        reactEmojis.splice(1, 1);
    } else if (wantedType.toUpperCase() === "VOID") {
        marbleSealEmote = lanisBot.emojis.find("name", "marble")
        reactEmojis.splice(2, 0, marbleSealEmote);
    }

    for (const emoji of reactEmojis) {
        await afkCheckMessage.react(emoji)
            .catch(console.error);
    }


    function sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms)
        });
    }

    const movePeople = setInterval(async function () {
        for (const member of peopleToMoveIn) {
            let personInQueue = false;
            for (queueChannel of queueChannels) {
                if (queueChannel.members.has(member.id) === true) {
                    personInQueue = true;
                }
            }

            if (personInQueue) {
                if (!member.deaf) {
                    console.log("Moving person into raiding channel " + wantedChannel + " : " + member.displayName);
                    const index = peopleToMoveIn.indexOf(member);
                    member.setVoiceChannel(raidingChannel.id);
                    peopleToMoveIn.splice(index, 1);
                    await sleep(1000);
                }
            }
        }
    }, 10000);

    //let formattedType;
    //if (wantedType)
    //await lanisBot.channels.get(channels.leadingLogs).send(raidType + " run started at: " + date + " by: " + message.member);

    collector.on("end", async (collected, reason) => {
        ranOutOfTime = true;
        clearInterval(movePeople);
        abortReactCollector.stop();

        if (reason !== "user") {
            const editedEmbed = new Discord.RichEmbed()
                .setColor(borderColor)
                .addField("The AFK check has run out of time.", "Please wait for the next run to start.");
            await afkCheckMessage.edit(editedEmbed).then(() => { }).catch(console.error);
        }

        let members = [];
        await message.guild.fetchMembers().then(guild => {
            for (const member of guild.members.values()) {
                if (member.voiceChannelID === raidingChannel.id) {
                    members.push(member);
                }
            }
        }).catch(e => {
            console.log(e);
        });

        for (const member of peopleToMoveIn) {
            console.log("Bot failed to move in: " + member.displayName)
        }
        for (const member of members) {
            console.log("In voice channel " + wantedChannel + ": " + member.displayName);
        }

        for (const reactorID of peopleActive) {
            const reactor = await message.guild.fetchMember(reactorID).then(reactor => {
                console.log("Bot detected a reaction from: " + reactor.displayName + " in raiding channel " + wantedChannel);
            }).catch(e => {
                console.log(e);
            });
        }

        for (const member of members) {
            if (!member.bot) {
                console.log("Does the bot see that member: " + member.displayName + " is in voice? (the includes): " + peopleActive.includes(member.id));
                if ((member.deaf && !member.hasPermission("MOVE_MEMBERS")) || (peopleActive.includes(member.id) === false && member.hasPermission("MOVE_MEMBERS") == false)) {
                    await member.setVoiceChannel(channels.afk);
                    console.log("Moving to AFK from raiding channel " + wantedChannel + " : " + member.displayName);
                }
            }
        }

    });
}


module.exports.help = {
    name: "afk"
}

//TODO - Move reactions to a separate file.5

//LOCATION ONLY TO PEOPLE IN VOICE
//SPLIT AFK, SAME AS VOID DIFFERENT NAME
//FORMAT GROUPS NICER?