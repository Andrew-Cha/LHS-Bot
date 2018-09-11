const Discord = require("discord.js");
const channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const raidingChannelCount = Object.keys(channels.raidingChannels).length;
    const wantedChannel = args[0];
    let channelNumber;
    let raidingChannel;

    if (0 < wantedChannel && wantedChannel <= raidingChannelCount) {
        channelNumber = wantedChannel - 1;
        raidingChannel = lanisBot.channels.get(channels.raidingChannels[channelNumber]);
    } else if (args[0].toUpperCase() === "QUEUE") {
        raidingChannel = lanisBot.channels.get(channels.queues[0]);
    } else {
        const error = "No such raiding channel found to set up for a member count check.";
        await message.channel.send(error);
        return;
    }

    await message.channel.send("Bot sees: " + raidingChannel.members.size + " people in the voice channel.");
}

module.exports.help = {
    name: "memberCount"
}
