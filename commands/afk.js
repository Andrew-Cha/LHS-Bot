const Discord = require("discord.js");

const fs = require('fs');
const path = require('path');
const storedMessagesFile = path.normalize(__dirname + "../../storedMessages.json");
const storedMessages = require(storedMessagesFile);

const channels = require("../channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const raidingChannelCount = Object.keys(channels.raidingChannels).length;
    let channelNumber;
    let raidingChannel;
    let queueChannels = channels.queues;

    if (0 < args && args <= raidingChannelCount) {
        channelNumber = args - 1;
        raidingChannel = lanisBot.channels.get(channels.raidingChannels[channelNumber]);
    } else {
        const error = "**No such raiding channel found to set up for raiding.**";
        await message.channel.send(error);
        return;
    }

    const warning = ("@here Next run starting for the **Raiding Channel Number " + (channelNumber + 1) + "**! React to the AFK check below!");
    await lanisBot.channels.get(channels.raidStatusAnnouncements).send(warning);

    const reactEmojis = [
        lanisBot.emojis.find("name", "voidentity"),
        lanisBot.emojis.find("name", "cult"),
        lanisBot.emojis.find("name", "vial"),
        lanisBot.emojis.find("name", "key"),
        lanisBot.emojis.find("name", "warrior"),
        lanisBot.emojis.find("name", "paladin"),
        lanisBot.emojis.find("name", "knight"),
        lanisBot.emojis.find("name", "priest"),
        "❌"
    ];


    let afkCheckEmbed = new Discord.RichEmbed()
        .setColor("#00FF00")
        .addField("AFK Check!", "We are starting an AFK check now, join queue and react with" + reactEmojis[0] + "to be moved in or kept in your current channel!\nIf you react with vial, key, or classes and do not bring them, you may be suspended.\n**In addition** to reacting with" + reactEmojis[0] + "also react if...")
        .addField("If you want to do cult and be guaranteed to be chosen react with:", reactEmojis[1])
        .addField("If you have a vial and wish to open a void for us react with:", reactEmojis[2])
        .addField("If you have a key and want to open a Lost Halls for us react with:", reactEmojis[3])
        .addField("If you are bringing a warrior, react with:", reactEmojis[4])
        .addField("If you are bringing a paladin, react with:", reactEmojis[5])
        .addField("If you are bringing a knight react with:", reactEmojis[6])
        .addField("If you are bringing a priest, react with:", reactEmojis[7])
        .addField("If you are a leader and want the AFK check to ABORT / END, react with:", reactEmojis[8]);

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
        reaction.emoji === lanisBot.emojis.find("name", "voidentity");

    const collector = new Discord.ReactionCollector(afkCheckMessage, filter, { time: 600000 });
    collector.on("collect", async (reaction, collector) => {
        if (!reaction.users.last().bot) {
            const currentMember = afkCheckMessage.guild.member(reaction.users.last()) || await afkCheckMessage.guild.fetchMember(reaction.users.last());
            if (reaction.emoji === lanisBot.emojis.find("name", "voidentity")) {
                if (currentMember && queueChannels.includes(currentMember.voiceChannelID) && !currentMember.deaf) {
                    await currentMember.setVoiceChannel(raidingChannel.id);
                }
            } else if (reaction.emoji.name === "❌") {
                if (currentMember && currentMember.hasPermission("MOVE_MEMBERS")) {
                    collector.stop();
                    const editedEmbed = new Discord.RichEmbed()
                        .addField("The AFK check has been stopped by " + currentMember.displayName + ".", "Please wait for the next run to start.");
                    await afkCheckMessage.edit(editedEmbed).then(() => { }).catch(console.error);
                }
            }
        }
    });

    for (const emoji of reactEmojis) {
        await afkCheckMessage.react(emoji)
            .catch(console.error);
    }

    collector.on("end", async (collected, reason) => {
        if (reason !== "user") {
            const editedEmbed = new Discord.RichEmbed()
                .addField("The AFK check has run out of time.", "Please wait for the next run to start.");
            await afkCheckMessage.edit(editedEmbed).then(() => { }).catch(console.error);
        }
        const members = raidingChannel.members;

        const voidEntityEmoji = lanisBot.emojis.find("name", "voidentity");
        const voidEntityReacts = (collected.get(voidEntityEmoji.id) ? collected.get(voidEntityEmoji.id).users : null);
        const peopleActive = voidEntityReacts;

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
    name: "afk"
}

//TODO - Move reactions to a separate file.5