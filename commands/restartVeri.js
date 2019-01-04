const Discord = require("discord.js");

const channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const verificationsAutomatic = lanisBot.channels.get(channels.verificationsAutomatic.id);
    await message.channel.send("Cleaning the automatic verification channel.");
    await verificationsAutomatic.messages.fetch().then(async messages => {
        for (const message of messages.values()) {
            await message.delete();
        }
    }).then(async () => {
        let verificationEmbed = new Discord.MessageEmbed()
            .setColor('#337b0a')
            .setAuthor('Public Lost Halls Discord', lanisBot.user.avatarURL())
            .addField("Follow these steps to verify: ", "\n1) Type `-verify <Write Your RotMG Name Here>` in this channel\n2) Go to the DM the bot sends you\n3) Take the VeriCode it gives you and paste it in one of the lines of your RealmEye profile\n4) Type `done` to the bot and follow any further instructions\n\nWe also ask you to not message the staff if you don't get instantly accepted, this is intended if it happens.")
            .addBlankField()
            .addField("Agreements", "By verifying in this server you agree to follow all of the rules mentioned in <#482368517568462868> and <#379504881213374475>.\nKeep in mind that if any problems arise we keep the right to take action against you.")
            .setFooter("⚠ Please make sure that you don't have DMs turned off; Anything inside < > is supposed to be replaced, including the brackets");
        await verificationsAutomatic.send(verificationEmbed);
        await message.channel.send("Cleaned the automatic verification channel.");
    });



}

module.exports.help = {
    name: "restartVeri",
    category: "Server Management",
    example: "`-restartVeri`",
    explanation: "Deletes all messages in the verification channel and sends the information embed anew."
}