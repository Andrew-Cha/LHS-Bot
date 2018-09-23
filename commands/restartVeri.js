const Discord = require("discord.js");

const channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const verificationsAutomatic = lanisBot.channels.get(channels.verificationsAutomatic);
    await message.channel.send("Cleaning the automatic verification channel.");
    await verificationsAutomatic.messages.fetch().then(async messages => {
        for (const message of messages.values()) {
            await message.delete();
        }
    }).then(async () => {
        let verificationEmbed = new Discord.MessageEmbed()
            .setColor('#337b0a')
            .setAuthor('Public Lost Halls Discord', lanisBot.user.avatarURL)
            .addField("Follow these steps to verify: ", "\n1) Type `-verify Your_RotMG_Name_Here` in this channel\n2) Go to the DM the bot sends you\n3) Follow the steps it tells you to do")
            .setFooter("⚠ Please make sure that you don't have DMs turned off");
        await verificationsAutomatic.send(verificationEmbed);
        await message.channel.send("Cleaned the automatic verification channel.");
    });



}

module.exports.help = {
    name: "restartVeri"
}