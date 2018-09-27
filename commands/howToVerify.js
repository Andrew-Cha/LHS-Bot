const Discord = require("discord.js");
const channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const securityRole = message.guild.roles.find(role => role.name === "Security");
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.name === "Verifier")) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const howToVerifyChannel = lanisBot.channels.get(channels.howToVerify);

    await howToVerifyChannel.messages.fetch().then(async messages => {
        for (const message of messages.values()) {
            await message.delete();
            console.log("deleted message");
        }
    });

    let howToVerify = new Discord.MessageEmbed()
        .setAuthor("A Tutorial On How To Verify")
        .addField(" ឵឵ ឵឵", "Firstly, read <#482394590721212416> and <#482368517568462868>")

    await howToVerifyChannel.send(howToVerify);
}

module.exports.help = {
    name: "howToVerifyReset"
}