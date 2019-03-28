const Discord = require("discord.js");
const channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const verificationsAutomatic = lanisBot.channels.get(channels.verificationsVeteran.id);
    await message.channel.send("Cleaning the veteran verification channel.");
    await verificationsAutomatic.messages.fetch().then(async messages => {
        for (const message of messages.values()) {
            await message.delete();
        }
    }).then(async () => {
        let verificationEmbed = new Discord.MessageEmbed()
            .setColor('#337b0a')
            .setAuthor('Public Halls Veteran Verification', lanisBot.user.avatarURL())
            .addField("Information", "This is the place to get access to the Veteran Run part of this discord, where raid leaders will do Lost Halls with experienced members.")
            .addField(`Requirements`, `2 8/8 characters.\nOne of those 8/8s has to be either a melee or a priest.`)
            .addBlankField()
            .addField("Follow these steps to verify or unverify: ", "To attempt to verify react to ✅\nTo get unverified react to ❌")
        const messageSent = await verificationsAutomatic.send(verificationEmbed);
        await messageSent.react("✅");
        await messageSent.react("❌");
        await message.channel.send("Cleaned the veteran verification channel.");
    });



}

module.exports.help = {
    name: "restartVeriVeteran",
    category: "Server Management",
    example: "`-restartVeriVeteran`",
    explanation: "Meant to be used to reset the message embed in the veteran verification channel."
}