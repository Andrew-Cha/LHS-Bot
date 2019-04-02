const Roles = require("../dataFiles/roles.json")
const Channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const raidingChannelCount = Object.keys(Channels.veteranRaidingChannels.id).length;
    let wantedChannel = args[0];
    let channelNumber;
    let raidingChannel;
    const verifiedRaiderRole = message.guild.roles.find(role => role.id === Roles.verifiedRaider.id);

    if (0 < wantedChannel && wantedChannel <= raidingChannelCount) {
        channelNumber = wantedChannel - 1;
        raidingChannel = lanisBot.channels.get(Channels.veteranRaidingChannels.id[channelNumber]);
        if (raidingChannel === undefined) {
            const error = "No such raiding channel found to reset for veteran raiding.";
            await message.channel.send(error);
            return;
        }
    } else {
        const error = "No such raiding channel found to reset for veteran raiding.";
        await message.channel.send(error);
        return;
    }

    const name = "Veteran Raiding " + wantedChannel

    await raidingChannel.setName(name, "Resetting Veteran Raiding Channel #" + wantedChannel)
        .catch(e => {
            console.log(e);
            noPermissions = true
        });
    await raidingChannel.updateOverwrite(
        verifiedRaiderRole, {
            CONNECT: null
        },
        "Resetting Veteran Raiding Channel #" + wantedChannel)
        .catch(e => {
            console.log(e);
            noPermissions = true;
        });
    await raidingChannel.setUserLimit(99, "Resetting Veteran Raiding Channel #" + wantedChannel)
        .catch(e => {
            console.log(e)
            noPermissions = true
        });

    return await message.channel.send("Done");

}

module.exports.help = {
    name: "resetVeteranChannel",
    category: "Raiding",
    example: "`-resetVeteranChannel 1`",
    explanation: "Resets a veteran raiding channel under the #Veteran-Halls category to its base permission state, so an AFK check can be started."
}
