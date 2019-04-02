const Roles = require("../dataFiles/roles.json")
const Channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const raidingChannelCount = Object.keys(Channels.eventRaidingChannels.id).length;
    let wantedChannel = args[0];
    let channelNumber;
    let raidingChannel;
    const verifiedRaiderRole = message.guild.roles.find(role => role.id === Roles.verifiedRaider.id);

    if (0 < wantedChannel && wantedChannel <= raidingChannelCount) {
        channelNumber = wantedChannel - 1;
        raidingChannel = lanisBot.channels.get(Channels.eventRaidingChannels.id[channelNumber]);
        if (raidingChannel === undefined) {
            const error = "No such raiding channel found to reset for event raiding.";
            await message.channel.send(error);
            return;
        }
    } else {
        const error = "No such raiding channel found to reset for event raiding.";
        await message.channel.send(error);
        return;
    }

    let name;
    if (wantedChannel < 3) {
        name = "Event Dungeons " + wantedChannel
    } else {
        name = "Random Dungeons " + wantedChannel
    }

    await raidingChannel.setName(name, "Resetting Event Raiding Channel #" + wantedChannel)
        .catch(e => {
            console.log(e);
            noPermissions = true
        });
    await raidingChannel.updateOverwrite(
        verifiedRaiderRole, {
            CONNECT: null
        },
        "Resetting Event Raiding Channel #" + wantedChannel)
        .catch(e => {
            console.log(e);
            noPermissions = true;
        });
    await raidingChannel.setUserLimit(99, "Resetting Event Raiding Channel #" + wantedChannel)
        .catch(e => {
            console.log(e)
            noPermissions = true
        });

    return await message.channel.send("Done");

}

module.exports.help = {
    name: "resetEventChannel",
    category: "Raiding",
    example: "`-resetEventChannel 1`",
    explanation: "Resets an event raiding channel under the #Events category to its base permission state, so an AFK check can be started."
}
