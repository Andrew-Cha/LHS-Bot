const Discord = require("discord.js");
const channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const securityRole = message.guild.roles.find(role => role.name === "Security");
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.name === "Verifier")) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const howtoVerifyTutorialChannel = lanisBot.channels.get(channels.howToVerify);

    await howtoVerifyTutorialChannel.messages.fetch().then(async messages => {
        for (const message of messages.values()) {
            await message.delete();
            console.log("deleted message");
        }
    });

    let howToVerify = new Discord.MessageEmbed()
        .setAuthor("A Tutorial On How To Verify")
        .addField("The Verification Process", "The Verification process has many catches to it, the main idea of it is to attempt to catch alts, where then a human can verify that they are indeed not an alt. It has many cases, which have to be handled, such as DMs turned off or invalid inputs, all of that is logged in <#477203736444403722> . In case someone is spamming the bot in an attempt to lag it out or has some troubles, go ahead and PM the person, in a worst scenario call for a <@&343769895881801728> or above to issue a kick.\n\nThere are a few requirements to get in instantly, those I won't list for security reasons, if you care enough just snoop around and you will find them.\n***Please do NOT leak them to the outside world in any shape, way or form***")
        .addBlankField()
        .addField("Accepting People", "To accept a person head to <#471711541465579521> and scroll to the top until you find the last application with a :key: reaction. Once you've done that, click on the key and now you get three new emojis:\n:white_check_mark: which is used to accept people, :x: which is used to deny people and :lock: which is used to lock the application to avoid any misclicks, it will go back to the :key: emoji.\nNow, to actually verify a person click the blue words that are 'Player Link' which will open your default browser and load their realmeye page that was used for verification, if no pages are hidden (Guild history, name history, fame history etc.) and they don't look like an alt, go ahead and click :white_check_mark: , which will verify that person and log it in <#473702116213653504> .")
        .addBlankField()
        .addField("Rejecting People", "To reject a person head to <#471711541465579521> and scroll to the top once again, unlock the application and click on the :x: emoji. Then you get options 1 through 5, with the last emoji :leftwards_arrow_with_hook: which goes back to the menu that is unlocked by :key: . Use this if you suspect that the player might be an alt or lacks something in their application.\n**The meaning of numbers :**\n:one: messages the person, telling them that they were suspected to be a mule, they also get your name as a reference; **Adds the person to the Expelled list**\n:two: will do the same as :one: , except it tells them that they are in a blacklisted guild and need to talk some things out.")
        .addField(" ឵឵ ឵឵", ":three: removes the person's application from the **Pending** list and tells the user to reapply having **everything** except the location unprivated.\n:four: will silently expel the person and add them to the **Expelled** list, won't message the user.\n:five: will remove the person's application from the **pending** list and won't message them, use this if the person left the server and you can't verify them due to that.")
        .addBlankField()
        .addField("Advice On How To Catch Alts", "Some things to watch out when verifying:\n1) Consistent fame gain, this one is the most important\n2) White bags or other goodies that can't be transfered onto an alt\n3) Pets, good pets especially")
        .addBlankField()
        .addField("The Process of Verifications and the States of it", "There are three states in the verification process:\n**Pending**\nThis state is usually one of the two states the user encounters, the second one being verified. A person is in this state whenever they have an active verification process or when they have a pending application. They are only removed from it once the application is rejected or accepted or when the active verification process is stopped.\n\n**Expelled**\nPeople are added to this list once they are rejected or using the command shown below. If a nickname is in this list, any person cannot apply using it.\n\n**Verified**\nA person is added to this list only when fully verified, they are only removed from it using the command or on the event of leaving the server *while not being suspended*.")
        .addBlankField()
        .addField("How to Handle the States of Verification", "**Expelled**\nMost of the time you'll be dealing with the **Expelled** state, anytime you reject a person they are added to this list, **for now they are not** removed from it when you verify them by adding the :white_check_mark: reaction, so if they leave and decide to apply again, the bot won't let them. You can add or remove people from this list, for more info check out `-commands expelled`\n\n**Pending**\nPeople are in this state only when they have an unchecked application or are in the verification process, use the command only when this state is glitched with an associated person, for more info check out `-commands pending`\n\n**Verified**\nThis state only needs touching when a person leaves and joins the server and they are rejected by the bot, due to someone having applied with their name. This happens rarely, although it does due to the way discord works, for more info check out `-commands verified`")
        .addBlankField()
        .addField("How to Handle Old Applications", "If you want to verify an old person (who maybe applied 3 weeks ago and got their application rejected, although never contacted the mentioend person), look up their in game name in the search bar, go to that message and manually add any reaction from which you want a reaction out of. To verify a person add :white_check_mark: , to reject :x: etc.")
    await howtoVerifyTutorialChannel.send(howToVerify);
}

module.exports.help = {
    name: "veriFaqReset"
}