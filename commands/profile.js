const Discord = require("discord.js");
const channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    let guildMember;
    if (args[0] === undefined) {
        guildMember = message.member;
    } else {
        const memberMention = args[0];
        if (!memberMention) return await message.channel.send("Input a correct user mention.")
        const regexMatches = memberMention.match(/<@!?(1|\d{17,19})>/)
        if (regexMatches === null) return await message.channel.send("Input a correct user mention.");
        const memberID = regexMatches[1];
        if (!memberID) return await message.channel.send("Specify which member you want to suspend.");
        guildMember = await message.channel.guild.members.fetch(memberID);
    }

    let informationEmbed = new Discord.MessageEmbed()
        .setAuthor(guildMember.user.tag, await guildMember.user.avatarURL())
        .setDescription(guildMember.presence.status + guildMember.toString(), true)
        .setThumbnail(await guildMember.user.avatarURL(), true)
        .addField("User ID", guildMember.user.id)
        .addField("Joined Discord", guildMember.user.createdAt.toUTCString())
        .addField("Joined Server", guildMember.joinedAt.toUTCString())
        .addField("Highest Role", guildMember.roles.highest, true)
        .addField("Member #", "Sort guild members zZzzZZ", true)
        .setColor("3ea04a");
    await message.channel.send(informationEmbed)
}

module.exports.help = {
    name: "profile"
}