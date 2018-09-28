const Discord = require("discord.js");
const channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const securityRole = message.guild.roles.find(role => role.name === "Security");
    if (message.member.roles.highest.position < securityRole.position && !message.member.roles.find(role => role.name === "Verifier")) return await message.channel.send("You can not use this command as a non Security or Verifier.");
    const faqChannel = lanisBot.channels.get(channels.faq);

    await faqChannel.messages.fetch().then(async messages => {
        for (const message of messages.values()) {
            await message.delete();
            console.log("deleted message");
        }
    });

    let faqMessage = new Discord.MessageEmbed()
        .setAuthor("Frequently Asked Questions")
        .addField("Q: Why can't I see raids?", "A: You probably are not verified yet. Check <#343711922417434634> and follow the bot's instructions in <#471711348095713281>.")
        .addBlankField()
        .addField("Q: How do I know if I'm verified?", "A: The bot will message you when you are verified. You will also see a list of new channels and have a different color name. If you click your name you will see all your roles as well.")
        .addBlankField()
        .addField("Q: How do I join organized raids once I am verified?", "A: Raids will be announced in <#379779029479194624>.  Join a raiding channel that is active (It is specified in the AFK Check and have a it's name highlighted) and react to the bot with <:cultist:397924622928052230>, <:LHvoid:431284547012001809>, or one of the classes you are bringing, listed in the reactions.")
        .addBlankField()
        .addField("Q: How do I know where to go for the Lost Halls?", "A: You must first be verified. Once you are verified follow the instructions bellow\n1. Find which raiding channel is open and has an AFK check attached to it.\n2. Join that channel by clicking it's name\n3. You MUST click on either <:cultist:397924622928052230> or <:LHvoid:431284547012001809> or else you will get moved out.\n4. Whenever you’re inside the raiding channel, wait for the leaders to prepare the run.\n5. Whenever they are ready, the leaders will start a countdown to say the server. \n6. The Leader will say the server location and bazaar multiple times into the voice chat.\n:warning: You will get moved out if you're deafened.")
        .addBlankField()
        .addField("Q: I see we use voice channels on this server, do I have to speak?", "A: No, only Raid Leaders speak in the voice channels. All other members are muted by default. You only have to listen.")
        .addBlankField()
        .addField("Q: Is the run a cult or void run?", "A: When the bot posts to begin a run it will say at the top “Cult AFK Check” (with a red border) or “Void AFK Check” (with a purple border)")
        .addBlankField()
        .addField("Q: I am interested in becoming a Raid Leader, what do I do?", "A: Applications are closed for the time being, an announcement will be made when its apps reopen")
        //.addField("Q: I am interested in becoming a Raid Leader, what do I do?", "A: Our Applications can be found here. Read carefully :)\n[Application Link](https://docs.google.com/forms/d/e/1FAIpQLScEce9thYxQb-4eflqc3cmFzYIgAOmdFYDjWcB5VLiPeurAxQ/viewform)")
        .addBlankField()
        .addField("Q: I applied for staff on this Discord and never heard anything back.", "A: We receive many applications and cannot reply to each one. Please understand we only ever approach you if you’re hired.")
        .addBlankField()
        .addField("Who owns and creates the bot?", "If you need any help or have something to tell me, my name is <@142250464656883713>")
        .addField("Q: Invite Code?", "Here you go:\nhttps://discord.gg/Ntzh472")
        .setColor("3ea04a")
    await faqChannel.send(faqMessage);
    await faqChannel.send("**Q: I am trying to <#471711348095713281> / read <#482394590721212416> or <#482368517568462868> but I see messages with nothing attached**\nA: Your personal settings are set to hide linked previews. Follow the diagram bellow to turn it back on. (Keep this setting on otherwise you won’t see bot instructions in <#379779029479194624>)\nVisual tutorial on how to turn it on:\nhttps://cdn.discordapp.com/attachments/471376992193740800/482399125334392852/0ero.png");

}

module.exports.help = {
    name: "faqReset"
}