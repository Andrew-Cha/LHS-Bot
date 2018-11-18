const Roles = require("../dataFiles/roles.json")
const Channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const raidingChannelCount = Object.keys(Channels.raidingChannels.id).length;
    let wantedChannel = args[0];
    let channelNumber;
    let raidingChannel;
    const verifiedRaiderRole = message.guild.roles.find(role => role.id === Roles.verifiedRaider.id);

    if (0 < wantedChannel && wantedChannel <= raidingChannelCount) {
        channelNumber = wantedChannel - 1;
        raidingChannel = lanisBot.channels.get(Channels.raidingChannels.id[channelNumber]);
        if (raidingChannel === undefined) {
            const error = "No such raiding channel found to reset for raiding.";
            await message.channel.send(error);
            return;
        }
    } else {
        const error = "No such raiding channel found to reset for raiding.";
        await message.channel.send(error);
        return;
    }

    const name = "raiding-" + wantedChannel;
    await raidingChannel.setName(name, "Resetting Raiding Channel #" + wantedChannel)
        .catch(e => {
            console.log(e);
            noPermissions = true
        });
    await raidingChannel.updateOverwrite(
        verifiedRaiderRole, {
            CONNECT: null
        },
        "Resetting Raiding Channel #" + wantedChannel)
        .catch(e => {
            console.log(e);
            noPermissions = true;
        });
    await raidingChannel.setUserLimit(99, "Resetting Raiding Channel #" + wantedChannel)
        .catch(e => {
            console.log(e)
            noPermissions = true
        });

    return await message.channel.send("Done");

}

module.exports.help = {
    name: "resetChannel"
}
