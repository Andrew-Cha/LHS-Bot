const Discord = require("discord.js");
//const Enmap = require("enmap");
//const EnmapMongo = require("enmap-mongo");
//const Provider = new EnmapMongo({ name: "mongo" });

const channels = require("../channels.json");

module.exports.run = async (lanisBot, message, args) => {
    //const memberCollection = await new Enmap({ provider: Provider });
    const raidingChannelCount = Object.keys(channels.raidingChannels).length;
    const messageFetchChannel = lanisBot.channels.get(channels.raidStatusAnnouncements);

    let channelNumber;
    let cultChannel;
    let raidingChannel;

    if (0 < args && args <= raidingChannelCount) {
        channelNumber = args - 1;
        raidingChannel = lanisBot.channels.get(channels.raidingChannels[channelNumber]);
        cultChannel = lanisBot.channels.get(channels.cultChannels[channelNumber]);
    } else {
        const error = "**No such raiding channel found to set up for cult.**";
        await message.channel.send(error);
        return;
    }

    const members = raidingChannel.members;
    let volunteers = [];
    let membersInCult;

    const multiplier = 1;
    const neededToCult = Math.floor(members.size * multiplier);

    if (neededToCult === 0) {
        await message.channel.send("There are not enough members in the voice chat to assign to cult. The current percentage of people needed is: **" + multiplier * 100 + "%**, meaning (percentage * amount of people in voice) has to result in a higher number than 0.");
        return;
    }

    const warning = ("Splitting people into cult for the **Cult Channel Number " + (channelNumber + 1) + "** from **Raiding Voice Channel Number " + (channelNumber + 1) + "**!");
    await message.channel.send(warning);

    let afkMessage;

    if (storedMessages.afkCheckIDs[channelNumber] != undefined) {
       // afkMessage = await messageFetchChannel.fetchMessage(storedMessages.afkCheckIDs[channelNumber]);
    } else {
        await message.channel.send("Failed to fetch the message from the specified channel.");
        return;
    }

    const afkReactions = afkMessage.reactions;

    for (reaction of afkReactions.values()) {
        if (reaction.emoji === lanisBot.emojis.find("name", "cult")) {
            const reactedToCult = await reaction.fetchUsers();
            if (reactedToCult.size - 1 > 0) {
                for (const user of reactedToCult.values()) {
                    const currentMember = await reaction.message.guild.fetchMember(user);
                    if (currentMember && currentMember.voiceChannel === raidingChannel && !currentMember.user.bot) {
                        await volunteers.push(currentMember);
                    }
                }
            }

            if (volunteers.length >= neededToCult) {
                await message.channel.send("Enough people reacted to the cult emoji, picking only random people from that list.");
                membersInCult = volunteers.sort(() => .5 - Math.random()).slice(0, neededToCult);
            } else if (neededToCult >= volunteers.length && volunteers.length > 0) {
                await message.channel.send("Currently assigning " + volunteers.length + "people to cult and all the people who reacted to the cult emoji!");
                membersInCult = members.random(neededToCult - volunteers.length) + volunteers;
            } else if (neededToCult > 0) {
                await message.channel.send("Currently assigning " + multiplier * 100 + "% of people to cult! No reaction for the cult emoji was found.");
                membersInCult = members.random(neededToCult);
            }


            for (const member of membersInCult) {
                member.user.send("Hey, you're doing cult! Go to the cultist hideout after the treasure room objective has been completed.")
                await member.setVoiceChannel(cultChannel.id);
            }

            await lanisBot.channels.get(channels.groupAssignments).send("These members are supposed to go to cult:\n" + membersInCult.join("\n"));
        }
    }
}

module.exports.help = {
    name: "cult"
}
