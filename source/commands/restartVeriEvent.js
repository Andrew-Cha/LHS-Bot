const Discord = require("discord.js");

const channels = require("../../data/channels.json");

module.exports.run = async (client, message, args) => {
    const verificationsAutomatic = client.channels.get(channels.verificationsEvents.id);
    await message.channel.send("Cleaning the event verification channel.");
    await verificationsAutomatic.messages.fetch().then(async messages => {
        for (const message of messages.values()) {
            await message.delete();
        }
    }).then(async () => {
        let verificationEmbed = new Discord.MessageEmbed()
            .setColor('#337b0a')
            .setAuthor('Public Halls Event Verification', client.user.avatarURL())
            .addField("Information", "This is the place to get access to the event part of this discord, where raid leaders will do miscellaneous dungeons with no preference, unless there is an event.")
            .addBlankField()
            .addField("Follow these steps to verify or unverify: ", "React to ✅, to get unverified react to ❌")
        const messageSent = await verificationsAutomatic.send(verificationEmbed);
        await messageSent.react("✅");
        await messageSent.react("❌");
        await message.channel.send("Cleaned the event verification channel.");
    });



}

module.exports.help = {
    name: "restartVeriEvent",
    category: "Server Management",
    example: "`-restartVeriEvent`",
    explanation: "Meant to be used to reset the message embed in the event verification channel."
}