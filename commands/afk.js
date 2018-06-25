const Discord = require("discord.js");

const fs = require('fs');
const path = require('path');
const storedMessagesFile = path.normalize(__dirname + "../../storedMessages.json");
const storedMessages = require(storedMessagesFile);

const channels = require("../channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const raidingChannelCount = Object.keys(channels.raidingChannels).length;
    const botCommands = lanisBot.channels.get(channels.botCommands);
    let wantedChannel = args[0];
    let wantedType = args[1];
    let raidEmote;
    let raidType;
    let channelNumber;
    let raidingChannel;
    let queueChannels = channels.queues;
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
            raidType = "**cult**";
        } else if (wantedType.toUpperCase() === "VOID") {
            raidEmote = lanisBot.emojis.find("name", "LHvoid");
            raidType = "**void**";
        }
    } else {
        message.channel.send("Please input a correct raid type: Cult or Void");
        return;
    }

    let locationMessage = "";

    for (i = 2; i < args.length; i++) {
        locationMessage = locationMessage + args[i] + " ";
    }
    const warning = ("@here Next run starting for the **Raiding Channel Number " + (channelNumber + 1) + "**, it's going to be a " + raidType + " run! React to the AFK check below! Started by: " + message.author);;
    await lanisBot.channels.get(channels.raidStatusAnnouncements).send(warning);

    const reactEmojis = [
        raidEmote,
        lanisBot.emojis.find("name", "vial"),
        lanisBot.emojis.find("name", "LHkey"),
        lanisBot.emojis.find("name", "LHwarrior"),
        lanisBot.emojis.find("name", "LHpaladin"),
        lanisBot.emojis.find("name", "knight"),
        lanisBot.emojis.find("name", "LHpriest"),
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
    afkCheckEmbed.addField("If you have a key react with:", reactEmojis[2], true)
        .addField("If you are bringing a warrior, react with:", reactEmojis[3], true)
        .addField("If you are bringing a paladin, react with:", reactEmojis[4], true)
        .addField("If you are bringing a knight react with:", reactEmojis[5], true)
        .addField("If you are bringing a priest, react with:", reactEmojis[6], true)
        .addField("If you are a leader and want the AFK check to END, react with:", reactEmojis[7], true);


    const afkCheckMessage = await lanisBot.channels.get(channels.raidStatusAnnouncements).send(afkCheckEmbed);

    let currentIndex = 0
    for (const id of storedMessages.afkCheckIDs) {
        storedMessages.afkCheckIDs[currentIndex] = id;
    }
    storedMessages.afkCheckIDs[channelNumber] = afkCheckMessage.id;

    fs.writeFile(storedMessagesFile, JSON.stringify(storedMessages), function (err) {
        if (err) return console.log(err);
    });

    const filter = (reaction, user) => reaction.emoji.name === "❌" ||
        reaction.emoji === lanisBot.emojis.find("name", "LHvoid") || reaction.emoji === lanisBot.emojis.find("name", "LHkey") || reaction.emoji === lanisBot.emojis.find("name", "vial");

    let peopleMessaged = [];
    let keyMessaged = false;
    const collector = new Discord.ReactionCollector(afkCheckMessage, filter, { time: 600000 });
    collector.on("collect", async (reaction, collector) => {
        if (!reaction.users.last().bot) {
            const currentMember = afkCheckMessage.guild.member(reaction.users.last()) || await afkCheckMessage.guild.fetchMember(reaction.users.last());
            if ((reaction.emoji === lanisBot.emojis.find("name", "LHvoid")) || (reaction.emoji === lanisBot.emojis.find("name", "cultist"))) {
                if (currentMember && queueChannels.includes(currentMember.voiceChannelID) && !currentMember.deaf) {
                    await currentMember.setVoiceChannel(raidingChannel.id);
                }
            } else if (reaction.emoji.name === "❌") {
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
                        if (!keyMessaged) {
                            currentMember.send("The location is: " + locationMessage);
                            botCommands.send("Person: " + currentMember + " has reacted with key and location has been sent to them.");
                            keyMessaged = true;
                            peopleMessaged.push(currentMember.id);
                        }
                    }
                }
            } else if (reaction.emoji === lanisBot.emojis.find("name", "vial")) {
                if (locationMessage != "") {
                    if (peopleMessaged.includes(currentMember.id) === false) {
                        currentMember.send("The location is: " + locationMessage);
                        botCommands.send("Person: " + currentMember + " has reacted with vial and location has been sent to them.");
                        peopleMessaged.push(currentMember.id);
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

    collector.on("end", async (collected, reason) => {
        if (reason !== "user") {
            const editedEmbed = new Discord.RichEmbed()
                .setColor(borderColor)
                .addField("The AFK check has run out of time.", "Please wait for the next run to start.");
            await afkCheckMessage.edit(editedEmbed).then(() => { }).catch(console.error);
        }
        const members = raidingChannel.members;

        let peopleActive;
        if (wantedType.toUpperCase() === "VOID") {
        const voidEntityEmoji = lanisBot.emojis.find("name", "LHvoid");
        const voidEntityReacts = (collected.get(voidEntityEmoji.id) ? collected.get(voidEntityEmoji.id).users : null)
        peopleActive = voidEntityReacts;
        } else if (wantedType.toUpperCase() === "CULT") {
            const cultistEmoji = lanisBot.emojis.find("name", "cultist");
            const cultistReacts = (collected.get(cultistEmoji.id) ? collected.get(cultistEmoji.id).users : null);
            peopleActive = cultistReacts
        }

        for (const member of members.values()) {
            if (await !raidingChannel.guild.fetchMember(member.id).bot) {
                if ((member.deaf && !member.hasPermission("MOVE_MEMBERS")) || (!peopleActive.has(member.id) && !member.hasPermission("MOVE_MEMBERS"))) {
                    await member.setVoiceChannel(channels.afk);
                }
            }
        }
    });
}


module.exports.help = {
    name: "-afk"
}

//TODO - Move reactions to a separate file.5