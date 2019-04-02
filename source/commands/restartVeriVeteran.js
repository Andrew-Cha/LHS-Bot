const Discord = require("discord.js");
const channels = require("../../data/channels.json");

module.exports.run = async (client, message, args) => {
    const verificationsAutomatic = client.channels.get(channels.verificationsVeteran.id);
    await message.channel.send("Cleaning the veteran verification channel.");
    await verificationsAutomatic.messages.fetch().then(async messages => {
        for (const message of messages.values()) {
            await message.delete();
        }
    }).then(async () => {
        let verificationEmbed = new Discord.MessageEmbed()
            .setColor('#337b0a')
            .setAuthor('Public Halls Veteran Verification', client.user.avatarURL())
            .addField("Information", "This is the place to get access to the Veteran Run part of this discord, where raid leaders will do Lost Halls with experienced members.")
            .addField(`Requirements`, `2 8/8 characters, one of which has to be either a melee or a priest.\n100 Lost Halls runs done with us.`)
            .addBlankField()
            .addField("Follow these steps to verify or unverify: ", "To attempt to verify react to ✅\nTo get unverified react to ❌")
            .setFooter(`⚠ There is a cooldown for how often you can interact with the reactions. If yours gets removed, wait until your report message is deleted.`)
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