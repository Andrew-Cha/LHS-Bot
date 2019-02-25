const Discord = require("discord.js");

const Channels = require("../dataFiles/channels.json");
const Roles = require("../dataFiles/roles.json");
const Emojis = require("../dataFiles/emojis.json")


const path = require('path');
const safeGuardConfigsFile = path.normalize(__dirname + "../../dataFiles/safeGuardConfigs.json");
const safeGuardConfigs = require(safeGuardConfigsFile);

module.exports.run = async (lanisBot, message, args) => {
    const arlRole = message.guild.roles.find(role => role.id === Roles.almostRaidLeader.id);
    if (message.member.roles.highest.position < arlRole.position) return await message.channel.send("Your role position is not high enough to start an AFK check.");

    let aborted = false;
    const botCommands = lanisBot.channels.get(message.channel.id);
    let raidStatusAnnouncements = lanisBot.channels.get(Channels.raidStatusEventAnnouncements.id);
    const wantedChannel = args[0];
    const wantedType = args[1];
    const marbleSealEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.lostHalls.marbleSeal);
    const vialEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.lostHalls.vial);
    let maxKeys = 4;
    let maxRushers = 2;
    let borderColor;
    let raidEmote;
    let raidKey;
    let raidType;
    let channelNumber;
    let raidingChannel;


    if (!wantedChannel) return await message.channel.send("Please input a raiding channel number.");
    if (isNaN(wantedChannel)) return await message.channel.send("Please input an actual number for the raiding channel.");

    if (wantedType != undefined) {
        const wantedTypeToUppercase = wantedType.toUpperCase();

        switch (wantedTypeToUppercase) {
            case "ABYSSOFDEMONS":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.abyssOfDemons.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.abyssOfDemons.key);
                raidType = "**Abyss of Demons**"
                borderColor = "#c40b1b" //demon red
                break;

            case "CANDYLAND":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.candyLand.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.candyLand.key);
                raidType = "**Candy Land**"
                borderColor = "##f453ea" //pink
                break;

            case "CNIDARIANREEF":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.cnidarianReef.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.cnidarianReef.key);
                raidType = "**Cnidarian Reef**"
                borderColor = "#62aed1" //light blue
                break;

            case "CRAWLINGDEPTHS":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.crawlingDepths.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.crawlingDepths.key);
                raidType = "**Crawling Depths**"
                borderColor = "#632f09" //brown
                break;

            case "DAVYJONESLOCKER":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.davyJonesLocker.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.davyJonesLocker.key);
                raidType = "**Davy Jone's Locker**"
                borderColor = "#1c188e" //dark blue
                break;

            case "DEADWATERDOCKS":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.deadwaterDocks.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.deadwaterDocks.key);
                raidType = "**Deadwater Docks**"
                borderColor = "#9b9692" //gray
                break;

            case "HAUNTEDCEMETERY":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.hauntedCemetary.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.hauntedCemetary.key);
                raidType = "**Haunted Cemetary**"
                borderColor = "#238c55" //dark green
                break;

            case "ICECAVE":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.iceCave.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.iceCave.key);
                raidType = "**Ice Cave**"
                borderColor = "#3ee3f2" //light blue
                break;

            case "ICETOMB":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.iceTomb.dungeon)
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.iceTomb.key)
                raidType = "**Ice Tomb**"
                borderColor = "#3ee3f2"
                break;

            case "LAIROFDRACONIS":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.lairOfDraconis.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.lairOfDraconis.key);
                raidType = "**Lair of Draconis**"
                borderColor = "#efec2f" //soft yellow
                break;

            case "LAIROFSHAITAN":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.lairOfShaitan.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.lairOfShaitan.key);
                raidType = "**Lair of Shaitan**"
                borderColor = "#c60b1e" //red warm
                break;

            case "MADLAB":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.madLab.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.madLab.key);
                raidType = "**Mad Lab**"
                borderColor = "#4d0687" //purple
                break;

            case "MANOROFIMMORTALS":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.manorOfImmortals.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.manorOfImmortals.key);
                raidType = "**Manor of Immortals**"
                borderColor = "#4d0687" //purple 
                break;

            case "MOUNTAINTEMPLE":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.mountainTemple.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.mountainTemple.key);
                raidType = "**Mountain Temple**"
                borderColor = "#683503" //brown
                break;

            case "NEST":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.nest.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.nest.key);
                raidType = "**The Nest**"
                borderColor = "#d38f19" //mix of orange and yellow
                break;

            case "OCEANTRENCH":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.oceanTrench.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.oceanTrench.key);
                raidType = "**Ocean Trench**"
                borderColor = "#0c91a0" //muddy blue
                break;

            case "PARASITECHAMBERS":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.parasiteChambers.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.parasiteChambers.key);
                raidType = "**Parasite Chambers**"
                borderColor = "#bc1640" //red more towards black
                break;

            case "PUPPETMASTERSENCORE":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.puppetMastersEncore.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.puppetMastersEncore.key);
                raidType = "**Puppet Master's Encore**"
                borderColor = "#292f4c" //dark blue more like dark
                break;

            case "PUPPETMASTERSTHEATRE":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.puppetMastersTheatre.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.puppetMastersTheatre.key);
                raidType = "**Puppet Master's Theatre**"
                borderColor = "#5b3521" //brown
                break;

            case "SECLUDEDTHICKET":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.secludedThicket.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.secludedThicket.key);
                raidType = "**Secluded Thicket**"
                borderColor = "#337a3b" //green
                break;

            case "SHATTERS":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.shatters.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.shatters.key);
                raidType = "**Shatters**"
                borderColor = "#110a0c" //black
                break;

            case "SNAKEPIT":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.snakePit.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.snakePit.key);
                raidType = "**Snake Pit**"
                borderColor = "#337a3b" //green
                break;

            case "TOMBOFTHEANCIENTS":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.tombOfTheAncients.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.tombOfTheAncients.key);
                raidType = "**Tomb of the Ancients**"
                borderColor = "#e1e81b" //yellow
                break;

            case "TOXICSEWERS":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.toxicSewers.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.toxicSewers.key);
                raidType = "**Toxic Sewers**"
                borderColor = "#393756" //purple blue ish
                break;

            case "UNDEADLAIR":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.undeadLair.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.undeadLair.key);
                raidType = "**Undead Lair**"
                borderColor = "#55555b" //gray
                break;

            case "WOODLANDLABYRINTH":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.woodlandLabyrinth.dungeon);
                raidKey = lanisBot.emojis.find(emoji => emoji.id === Emojis.woodlandLabyrinth.key);
                raidType = "**Woodland Labyrinth**"
                borderColor = "#6b6546" //muddy
                break;

            case "CULT":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.lostHalls.cultist);
                raidKey = lanisBot.emojis.find(emoji => emoji.id = Emojis.lostHalls.key);
                raidType = "**Cult**";
                borderColor = "#cf0202"; //Red
                raidStatusAnnouncements = lanisBot.channels.get(Channels.raidStatusAnnouncements.id);
                maxKeys = 1;
                break;

            case "VOID":
                raidEmote = lanisBot.emojis.find(emoji => emoji.id === Emojis.lostHalls.voidEntity);
                raidKey = lanisBot.emojis.find(emoji => emoji.id = Emojis.lostHalls.key);
                raidType = "**Void**";
                borderColor = "#24048b"; //Purple
                raidStatusAnnouncements = lanisBot.channels.get(Channels.raidStatusAnnouncements.id);
                maxKeys = 1;
                break;

            default:
                return await message.channel.send("Please input a correct raid type.");
        }
    } else {
        message.channel.send("Please input a correct raid type.");
        return;
    }

    let oldName;
    if (wantedType.toUpperCase() === "VOID" || wantedType.toUpperCase() === "CULT") {
        const raidingChannelCount = Object.keys(Channels.raidingChannels.id).length;
        if (0 < wantedChannel && wantedChannel <= raidingChannelCount) {
            channelNumber = wantedChannel - 1;
            raidingChannel = lanisBot.channels.get(Channels.raidingChannels.id[channelNumber]);
            oldName = "raiding-" + wantedChannel;
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
    } else {
        const raidingChannelCount = Object.keys(Channels.eventRaidingChannels.id).length;
        if (0 < wantedChannel && wantedChannel <= raidingChannelCount) {
            if (wantedChannel < 3) {
                oldName = "Event Dungeons " + wantedChannel;
            } else {
                oldName = "Random Dungeons " + wantedChannel;
            }
            channelNumber = wantedChannel - 1;
            raidingChannel = lanisBot.channels.get(Channels.eventRaidingChannels.id[channelNumber]);
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
    }

    if (raidingChannel.name.toUpperCase().includes("JOIN")) {
        return await message.channel.send(message.member.toString() + ", it seems there is an active AFK check in that channel as it has the word 'Join' in its title.")
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

    let noPermissions = false;
    const newName = oldName + " <-- Join!";
    await raidingChannel.setName(newName, "Starting Raid for Raiding Channel #" + wantedChannel)
        .catch(e => {
            noPermissions = true
        });

    const verifiedRaiderRole = message.guild.roles.find(role => role.id === Roles.verifiedRaider.id);
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

    const warningMessage = ("@here " + raidType + " started by " + message.member.toString() + " for Raiding Channel #" + wantedChannel);
    const warning = await raidStatusAnnouncements.send(warningMessage);
    //const warning = await botCommands.send(warningMessage);
    const reactEmojis = [
        raidEmote,
        raidKey,
        lanisBot.emojis.find(emoji => emoji.id === Emojis.classes.warrior),
        lanisBot.emojis.find(emoji => emoji.id === Emojis.classes.paladin),
        lanisBot.emojis.find(emoji => emoji.id === Emojis.classes.knight),
        lanisBot.emojis.find(emoji => emoji.id === Emojis.classes.priest),
        lanisBot.emojis.find(emoji => emoji.id === Emojis.classes.cloakOfThePlanewalker),
        "❌"
    ];

    let afkCheckEmbed = new Discord.MessageEmbed()
        .setColor(borderColor);
    if (wantedType.toUpperCase() === "VOID") {
        const voidEmbedMessage = "To join, **connect to the raiding channel by clicking its name** and react to " + raidEmote.toString() + "\nIf you have a key or vial, react to " + raidKey.toString() + " or " + vialEmote.toString() + "\nTo indicate your class or gear choices, react to " + marbleSealEmote.toString() + " " + reactEmojis[2].toString() + " " + reactEmojis[3].toString() + " " + reactEmojis[4].toString() + " " + reactEmojis[5].toString() + " " + reactEmojis[6].toString() + "\nTo end the AFK check as a leader, react to " + reactEmojis[7];
        afkCheckEmbed.addField("**Void** AFK Check" + raidEmote.toString(), voidEmbedMessage, false);
    } else {
        const cultEmbedMessage = "To join, **connect the raiding channel by clicking its name** and, react to " + raidEmote.toString() + "\nIf you have a key, react to " + raidKey.toString() + "\nTo indicate your class choice, react to " + reactEmojis[2].toString() + " " + reactEmojis[3].toString() + " " + reactEmojis[4].toString() + " " + reactEmojis[5].toString() + " " + reactEmojis[6].toString() + "\nTo end the AFK check as a leader, react to " + reactEmojis[7];
        afkCheckEmbed.addField(raidType + " AFK Check", cultEmbedMessage, false);
    }
    afkCheckEmbed.setFooter("Time left: 6 minutes 0 seconds; Total people: 0.")

    const afkCheckMessage = await raidStatusAnnouncements.send(afkCheckEmbed);
    //const afkCheckMessage = await botCommands.send(afkCheckEmbed);

    let informationPanel = new Discord.MessageEmbed()
        .setColor(borderColor)
        .setDescription("Information Panel, Raiding Channel #" + wantedChannel + ", " + raidType)
        .addField("Keys:", "None")
        .setFooter("AFK check is in progress.");

    if (wantedType.toUpperCase() === "VOID") informationPanel.addField("Vials:", "None")
    informationPanel.addField("Rushers:", "None")
    if (locationMessage !== "") { informationPanel.addField("Location:", locationMessage) }
    const informationPanelMessage = await botCommands.send(informationPanel);
    const arlChatInformationPanelMessage = await lanisBot.channels.get(Channels.arlChat.id).send(informationPanel);
    let totalPeople = 0;
    let peopleReacted = [];


    const filter = (reaction, user) => {
        if (user.bot) return false;
        return true
    }

    const confirmationFilter = (confirmationMessage) => confirmationMessage.content !== "" && confirmationMessage.author.bot === false;

    let peopleMessaged = [];
    let rushersMessaged = 0;
    let vialsMessaged = 0;
    let keysMessaged = 0;
    let firstKeyMessaged = false;
    let firstRusherMessaged = false;
    let rusherFieldIndex;

    if (wantedType.toUpperCase() === "VOID") {
        rusherFieldIndex = 2
    } else {
        rusherFieldIndex = 1
    }

    const afkCheckCollector = new Discord.ReactionCollector(afkCheckMessage, filter, { time: 360000 });
    afkCheckCollector.on("collect", async (reaction, user) => {
        const currentMember = await message.guild.members.get(user.id);

        if (!currentMember.user.bot) {
            let DMChannel = await currentMember.createDM();

            if (reaction.emoji.name === "❌") {
                if (currentMember && currentMember.hasPermission("MOVE_MEMBERS")) {
                    await afkCheckCollector.stop();
                }
            } else if (reaction.emoji === lanisBot.emojis.find(emoji => emoji.id === raidKey.id)) {
                if (locationMessage != "") {
                    if (peopleMessaged.includes(currentMember.id) === false) {
                        if (raidingChannel.members.has(currentMember.id) === true) {
                            if (keysMessaged < maxKeys) {
                                await new Promise(async (resolve, reject) => {
                                    peopleMessaged.push(currentMember.id);
                                    await currentMember.send("Are you sure you have the key and want to be sent the location? Not coming to the location with the key will result in a suspension.\nRespond either with: `yes` or `no`.").catch(async e => {
                                        await message.channel.send("User " + currentMember.toString() + " tried to get location as a key but their DMs are turned off.");
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
                                    if (keysMessaged < maxKeys) {
                                        await currentMember.send("The location is: " + locationMessage);
                                        keysMessaged += 1;

                                        if (wantedType.toUpperCase() === "CULT" || wantedType.toUpperCase() === "VOID") {
                                            lanisBot.database.run(`UPDATE stats SET lostHallsKeysPopped = lostHallsKeysPopped + 1 WHERE ID = '${currentMember.id}';`)
                                        } else {
                                            lanisBot.database.run(`UPDATE stats SET otherKeysPopped = otherKeysPopped + 1 WHERE ID = '${currentMember.id}';`)
                                        }

                                        let reactionInformationEmbed = new Discord.MessageEmbed()
                                            .addField("Successful Reaction", `${currentMember.toString()} reacted with key, confirmed it.\nThe location was sent to them.`)
                                            .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                            .setFooter(`User ID: ${currentMember.id}`)
                                            .setColor("3ea04a")
                                            .setTimestamp()
                                        await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                                        if (firstKeyMessaged) {
                                            const oldText = informationPanel.fields[0].value;
                                            informationPanel.fields[0] = { name: "Keys:", value: oldText + "\n" + currentMember.toString(), inline: false };
                                        } else {
                                            informationPanel.fields[0] = { name: "Keys:", value: currentMember.toString() + " / Main", inline: false };
                                        }
                                        await informationPanelMessage.edit(informationPanel);
                                        await arlChatInformationPanelMessage.edit(informationPanel);
                                        if (!firstKeyMessaged) firstKeyMessaged = true;

                                        lanisBot.database.get(`SELECT * FROM stats WHERE ID = '${user.id}'`, async (error, row) => {
                                            if (row != undefined) {
                                                let totalKeysPopped = row.lostHallsKeysPopped + row.otherKeysPopped

                                                const temporaryKeyPopper = message.guild.roles.get(Roles.keyPopper.temporary.id)
                                                const verifiedKeyPopper = message.guild.roles.get(Roles.keyPopper.verified.id)
                                                const veteranKeyPopper = message.guild.roles.get(Roles.keyPopper.veteran.id)

                                                let roleGrantedEmbed = new Discord.MessageEmbed()

                                                if (totalKeysPopped >= 50) {
                                                    if (currentMember.roles.find(role => role.id === Roles.keyPopper.veteran.id) !== undefined) {
                                                        return
                                                    }
                                                    currentMember.roles.remove(verifiedKeyPopper)
                                                    currentMember.roles.add(veteranKeyPopper)
                                                    currentMember.send("You have popped 50 or more keys for us, you have been granted the Veteran Key Popper role.")
                                                    roleGrantedEmbed.addField("Role Given", `${currentMember.toString()} received the Veteran Key Popper role at ${totalKeysPopped} runs.`)
                                                } else if (totalKeysPopped >= 15) {
                                                    if (currentMember.roles.find(role => role.id === Roles.keyPopper.verified.id) !== undefined) {
                                                        return
                                                    }
                                                    currentMember.roles.remove(temporaryKeyPopper)
                                                    currentMember.roles.add(verifiedKeyPopper)
                                                    currentMember.send("You have popped 15 or more keys for us, you have been granted the Verified Key Popper role.")
                                                    roleGrantedEmbed.addField("Role Given", `${currentMember.toString()} received the Verified Key Popper role at ${totalKeysPopped} runs.`)
                                                } else {
                                                    currentMember.roles.add(temporaryKeyPopper)
                                                    currentMember.send("You have been given the temporary key popper role, please check out <#542591888331374625>")
                                                    roleGrantedEmbed.addField("Role Given", `${currentMember.toString()} received the Temporary Key Popper role at ${totalKeysPopped} runs.`)
                                                    setTimeout(() => {
                                                        currentMember.roles.remove(temporaryKeyPopper)
                                                    }, 900000)
                                                }

                                                roleGrantedEmbed.addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                                    .setFooter(`User ID: ${currentMember.id}`)
                                                    .setColor("3ea04a")
                                                    .setTimestamp()
                                                await lanisBot.channels.get(Channels.historyReacts.id).send(roleGrantedEmbed);
                                            }
                                        })
                                    } else {
                                        await currentMember.send("Sorry, enough key holders have already been sent the location.");
                                        await reaction.users.remove(currentMember.id)
                                        let reactionInformationEmbed = new Discord.MessageEmbed()
                                            .addField("Overflow Reaction", `${currentMember.toString()} reacted with key, confirmed it, but the limit for keys was hit.\nThe location was not sent to them.`)
                                            .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                            .setFooter(`User ID: ${currentMember.id}`)
                                            .setColor("cf0202")
                                            .setTimestamp()
                                        await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                                        const index = peopleMessaged.indexOf(currentMember.id);
                                        peopleMessaged.splice(index, 1);
                                    }
                                }).catch(async (e) => {
                                    console.log(e);
                                    await currentMember.send("Not sending the location.");
                                    await reaction.users.remove(currentMember.id)
                                    let reactionInformationEmbed = new Discord.MessageEmbed()
                                        .addField("Time Out", `${currentMember.toString()} reacted with key, but their request timed out.`)
                                        .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                        .setFooter(`User ID: ${currentMember.id}`)
                                        .setColor("cf0202")
                                        .setTimestamp()
                                    await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                                    const index = peopleMessaged.indexOf(currentMember.id);
                                    peopleMessaged.splice(index, 1);
                                });
                            } else {
                                await currentMember.send("Sorry, we already have enough keys.")
                                await reaction.users.remove(currentMember.id)
                                let reactionInformationEmbed = new Discord.MessageEmbed()
                                    .addField("Overflow Reaction", `${currentMember.toString()} reacted with key while there were enough keys already.`)
                                    .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                    .setFooter(`User ID: ${currentMember.id}`)
                                    .setColor("cf0202")
                                    .setTimestamp()
                                await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                            }
                        } else {
                            await currentMember.send("Sorry, you have to be in the voice channel to get the key location.")
                            await reaction.users.remove(currentMember.id)
                            let reactionInformationEmbed = new Discord.MessageEmbed()
                                .addField("Invalid Reaction", `${currentMember.toString()} reacted with key while they were not in a voice channel.`)
                                .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                .setFooter(`User ID: ${currentMember.id}`)
                                .setColor("cf0202")
                                .setTimestamp()
                            await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                        }
                    }
                }
            } else if (reaction.emoji === lanisBot.emojis.find(emoji => emoji.id === Emojis.lostHalls.vial)) {
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
                                        let reactionInformationEmbed = new Discord.MessageEmbed()
                                            .addField("Successful Reaction", `${currentMember.toString()} reacted with main vial, confirmed it.\nThe location was sent to them.`)
                                            .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                            .setFooter(`User ID: ${currentMember.id}`)
                                            .setColor("3ea04a")
                                            .setTimestamp()
                                        await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                                        informationPanel.fields[1] = { name: "Vials:", value: currentMember.toString() + " / Main", inline: false };
                                        await informationPanelMessage.edit(informationPanel);
                                        await arlChatInformationPanelMessage.edit(informationPanel);
                                    } else {
                                        await currentMember.send("The location has already been sent to the main vial, if you want to become a backup vial please react again.");
                                        await reaction.users.remove(currentMember.id)
                                        let reactionInformationEmbed = new Discord.MessageEmbed()
                                            .addField("Overflow Reaction", `${currentMember.toString()} reacted with vial, they were supposed to be a main vial, although someone else confirmed main vial first.\nThe location was not sent to them.`)
                                            .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                            .setColor("cf0202")
                                            .setFooter(`User ID: ${currentMember.id}`)
                                            .setTimestamp()
                                        await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                                        const index = peopleMessaged.indexOf(currentMember.id);
                                        peopleMessaged.splice(index, 1);
                                    }
                                }).catch(async (failureMessage) => {
                                    await currentMember.send("Not sending the location.");
                                    await reaction.users.remove(currentMember.id)
                                    let reactionInformationEmbed = new Discord.MessageEmbed()
                                        .addField("Timed Out Reaction", `${currentMember.toString()} reacted with vial, they were supposed to be a main vial, although their reaction timed out.\nThe location was not sent to them.`)
                                        .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                        .setFooter(`User ID: ${currentMember.id}`)
                                        .setColor("cf0202")
                                        .setTimestamp()
                                    await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
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
                                        let reactionInformationEmbed = new Discord.MessageEmbed()
                                            .addField("Successful Reaction", `${currentMember.toString()} reacted with backup vial, confirmed it.\nThe location was sent to them.`)
                                            .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                            .setFooter(`User ID: ${currentMember.id}`)
                                            .setColor("3ea04a")
                                            .setTimestamp()
                                        await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                                        const oldVials = informationPanel.fields[1]
                                        informationPanel.fields[1] = { name: "Vials:", value: oldVials.value + "\n" + currentMember.toString(), inline: false };
                                        await informationPanelMessage.edit(informationPanel);
                                        await arlChatInformationPanelMessage.edit(informationPanel);
                                    } else {
                                        await currentMember.send("Sorry, we already have too many vials.");
                                        const index = peopleMessaged.indexOf(currentMember.id);
                                        peopleMessaged.splice(index, 1);
                                    }
                                }).catch(async (e) => {
                                    console.log(e)
                                    await currentMember.send("Not sending the location.");
                                    let reactionInformationEmbed = new Discord.MessageEmbed()
                                        .addField("Timed Out Reaction", `${currentMember.toString()} reacted with vial, they were supposed to be a backup vial, although their reaction timed out.\nThe location was not sent to them.`)
                                        .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                        .setFooter(`User ID: ${currentMember.id}`)
                                        .setColor("cf0202")
                                        .setTimestamp()
                                    await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                                    const index = peopleMessaged.indexOf(currentMember.id);
                                    peopleMessaged.splice(index, 1);
                                });
                            } else {
                                await currentMember.send("Sorry, we already have enough vials.")
                                await reaction.users.remove(currentMember.id)
                                let reactionInformationEmbed = new Discord.MessageEmbed()
                                    .addField("Overflow Reaction", `${currentMember.toString()} reacted with vial while there were enough vials already.`)
                                    .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                    .setFooter(`User ID: ${currentMember.id}`)
                                    .setColor("cf0202")
                                    .setTimestamp()
                                await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                            }
                        } else {
                            await currentMember.send("Sorry, you have to be in the voice channel to get the vial location.")
                            await reaction.users.remove(currentMember.id)
                            let reactionInformationEmbed = new Discord.MessageEmbed()
                                .addField("Invalid Reaction", `${currentMember.toString()} reacted with vial while they were not in a voice channel.`)
                                .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                .setFooter(`User ID: ${currentMember.id}`)
                                .setColor("cf0202")
                                .setTimestamp()
                            await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                        }
                    }
                }
            } else if (reaction.emoji === lanisBot.emojis.find(emoji => emoji.id === Emojis.classes.cloakOfThePlanewalker)) {
                if (peopleMessaged.includes(currentMember.id) === false) {
                    if (currentMember.roles.find(role => role.name === "Official Rusher")) {
                        if (raidingChannel.members.has(currentMember.id) === true) {
                            if (rushersMessaged < maxRushers) {
                                await new Promise(async (resolve, reject) => {
                                    peopleMessaged.push(currentMember.id);
                                    await currentMember.send("Are you sure you will rush and want to be sent the location? Not rushing will result in a suspension.\nRespond either with: `yes` or `no`.").catch(async e => {
                                        await message.channel.send("User " + currentMember.toString() + " tried to get location as rusher key but their DMs are turned off.");
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
                                    if (rushersMessaged < maxRushers) {
                                        await currentMember.send("The location is: " + locationMessage);
                                        rushersMessaged += 1

                                        let reactionInformationEmbed = new Discord.MessageEmbed()
                                            .addField("Successful Reaction", `${currentMember.toString()} reacted with planewalker, confirmed it.\nThe location was sent to them.`)
                                            .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                            .setFooter(`User ID: ${currentMember.id}`)
                                            .setColor("3ea04a")
                                            .setTimestamp()
                                        await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                                        if (firstRusherMessaged) {
                                            const oldText = informationPanel.fields[rusherFieldIndex].value;
                                            informationPanel.fields[rusherFieldIndex] = { name: "Rushers:", value: oldText + "\n" + currentMember.toString(), inline: false };
                                        } else {
                                            informationPanel.fields[rusherFieldIndex] = { name: "Rushers:", value: currentMember.toString(), inline: false };
                                            firstRusherMessaged = true
                                        }
                                        await informationPanelMessage.edit(informationPanel);
                                        await arlChatInformationPanelMessage.edit(informationPanel);
                                    } else {
                                        await currentMember.send("Sorry, enough rushers have already been sent the location.");
                                        await reaction.users.remove(currentMember.id)
                                        let reactionInformationEmbed = new Discord.MessageEmbed()
                                            .addField("Overflow Reaction", `${currentMember.toString()} reacted with planewalker, confirmed it, but the limit for rushers was hit.\nThe location was not sent to them.`)
                                            .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                            .setFooter(`User ID: ${currentMember.id}`)
                                            .setColor("cf0202")
                                            .setTimestamp()
                                        await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                                        const index = peopleMessaged.indexOf(currentMember.id);
                                        peopleMessaged.splice(index, 1);
                                    }
                                }).catch(async (e) => {
                                    await currentMember.send("Not sending the location.");
                                    await reaction.users.remove(currentMember.id)
                                    let reactionInformationEmbed = new Discord.MessageEmbed()
                                        .addField("Time Out", `${currentMember.toString()} reacted with planewalker, but their request timed out.`)
                                        .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                        .setFooter(`User ID: ${currentMember.id}`)
                                        .setColor("cf0202")
                                        .setTimestamp()
                                    await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                                    const index = peopleMessaged.indexOf(currentMember.id);
                                    peopleMessaged.splice(index, 1);
                                });
                            } else {
                                await currentMember.send("Sorry, we already have enough rushers.")
                                await reaction.users.remove(currentMember.id)
                                let reactionInformationEmbed = new Discord.MessageEmbed()
                                    .addField("Overflow Reaction", `${currentMember.toString()} reacted with planewalker while there were enough rushers already.`)
                                    .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                    .setFooter(`User ID: ${currentMember.id}`)
                                    .setColor("cf0202")
                                    .setTimestamp()
                                await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                            }
                        } else {
                            await currentMember.send("Sorry, you have to be in the voice channel to get the rusher location.")
                            await reaction.users.remove(currentMember.id)
                            let reactionInformationEmbed = new Discord.MessageEmbed()
                                .addField("Invalid Reaction", `${currentMember.toString()} reacted with planewalker while they were not in a voice channel.`)
                                .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                                .setFooter(`User ID: ${currentMember.id}`)
                                .setColor("cf0202")
                                .setTimestamp()
                            await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                        }
                    } else {
                        await currentMember.send("Sorry, you have to be an official rusher to get rusher location.")
                        await reaction.users.remove(currentMember.id)
                        let reactionInformationEmbed = new Discord.MessageEmbed()
                            .addField("Invalid Reaction", `${currentMember.toString()} reacted with planewalker while they were not an official rusher, but in the voice channel.`)
                            .addField("Information", `${raidType} run in Raiding Channel #${wantedChannel}`)
                            .setFooter(`User ID: ${currentMember.id}`)
                            .setColor("cf0202")
                            .setTimestamp()
                        await lanisBot.channels.get(Channels.historyReacts.id).send(reactionInformationEmbed);
                    }
                }
            } else {
                if (reactEmojis.find(emoji => emoji.id === reaction.emoji.id) && reaction.emoji.id) {
                    if (!peopleReacted.includes(currentMember.id)) {
                        totalPeople++;
                        peopleReacted.push(currentMember.id);
                    }
                } else {
                    await reaction.users.remove(currentMember.id)
                }
            }
        }
    });

    if (wantedType.toUpperCase() === "VOID") {
        reactEmojis.splice(2, 0, marbleSealEmote); //if it's a void run, add the marble seal with vial
        reactEmojis.splice(2, 0, lanisBot.emojis.find(emoji => emoji.id === Emojis.lostHalls.vial));
    }

    for (const emoji of reactEmojis) {
        await afkCheckMessage.react(emoji)
            .catch(console.error);
    }

    let timeTotal = afkCheckCollector.options.time;
    const updateTimeLeft = setInterval(() => {
        if (timeTotal < 0) { clearInterval(updateTimeLeft) }
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
    await abortMessage.react("❌");
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
                    await arlChatInformationPanelMessage.delete();
                    await message.channel.send("AFK check for Raiding Channel #" + wantedChannel + " aborted by " + currentMember.toString());
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
        informationPanel.setFooter("AFK check stopped by " + message.member.displayName);
        informationPanel.setTimestamp()
        await informationPanelMessage.edit(informationPanel);
        await arlChatInformationPanelMessage.edit(informationPanel);
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
                        member.setVoiceChannel(Channels.afk.id);
                    }
                }
            }
        }

        editedEmbed.setTimestamp()
        editedEmbed.setFooter("Started by " + message.member.displayName);
        await afkCheckMessage.edit(editedEmbed);
        makePostAFKCheck(borderColor, raidStatusAnnouncements, raidingChannel);

        const randomTimeout = Math.floor(Math.random() * 500000)
        console.log(randomTimeout)
        setTimeout(() => {
            let members = raidingChannel.members

            members.each(member => {
                if (!member.deaf) {
                    console.log("Adding run credit to " + member.displayName)
                    if (wantedType.toUpperCase() === "CULT") {
                        lanisBot.database.run(`UPDATE stats SET cultsDone = cultsDone + 1 WHERE ID = '${member.id}';`)
                    } else if (wantedType.toUpperCase() === "VOID") {
                        lanisBot.database.run(`UPDATE stats SET voidsDone = voidsDone + 1 WHERE ID = '${member.id}';`)
                    } else {
                        lanisBot.database.run(`UPDATE stats SET otherDungeonsDone = otherDungeonsDone + 1 WHERE ID = '${member.id}';`)
                    }
                }
            })
        }, randomTimeout)
    });

    async function makePostAFKCheck(borderColor) {
        let queueChannels = [];
        for (let i = 0; i < Object.keys(Channels.queues.id).length; i++) {
            const channelID = Channels.queues.id[i];
            const queueChannel = raidStatusAnnouncements.guild.channels.get(channelID);
            queueChannels.push(queueChannel)
        }

        const androidBugFixerEmbed = new Discord.MessageEmbed()
            .setColor(borderColor)
            .addField("Post-AFK Check Moving in for " + raidType + " in **Raiding " + wantedChannel + "**", "If you got disconnected due to the android bug or because you forgot to react go to the **Lounge** channel first and *then* react below with:\n:eyes: ");
        let androidBugFixerMessage = await raidStatusAnnouncements.send(androidBugFixerEmbed);
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

            if (personInQueue) await raidStatusAnnouncements.guild.members.fetch(user.id).then(async (member) => {
                await member.setVoiceChannel(raidingChannel);
            });
        });

        await androidBugFixerMessage.react("👀");
        androidBugFixerCollector.on("end", async (collected, reason) => {
            await androidBugFixerMessage.delete();
        });

    }
}


module.exports.help = {
    name: "AFK",
    category: "Raiding",
    example: "`-afk 1 void USS Right Bazaar` | `-afk 3 puppetmasterstheatre EUW Left`",
    explanation: "Starts an AFK check for a specified raid type in a specified raiding channel.\nVoid and Cult AFK checks will use the #Raiding subsection and the rest use the #Events subsection."
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}