const Discord = require("discord.js");

module.exports.run = async (lanisBot, message, args) => {
    let reply = new Discord.RichEmbed()
        .addField("-afk (Raiding Channel Number) (Type) (Custom message sent to people who react with key or vial. Optional.)", "There are two types: 'Void' and 'Cult'. Custom message can be used for anything, usually it's used for inputting the location. Example: `-afk 3 Void USNW Right Bazaar.`")
        .addField("-safeGuard","Will add you to the safeguard list, where you can choose which commands will be extra guarded from your input. Usage:\n`optIn` adds you to the list\n`optOut` removes you from the list\n`add CommandName` adds the command name to your safeguard list\n`remove CommandName` removes the command from your safeguard list.\n`list` will simply show all the commands that you currently have added.\nWhen replying to a question from the bot simply input `-yes` or `-no`.")
        .addField("-splitVoid (Raiding Channel Number) (Type, Optional)", "Starts a void group split. There are three types 1) Small, will form 2 groups. 2) Medium, will form 3 groups. 3) Large, will form 4 groups. Example: `-splitVoid 2 Large`" )
        .addField("-suspend","Suspends a person, usage:\n`-suspend <@user mention> <number(must be a whole number)> <unit: w, d, h or m> <reason>`")
        await message.channel.send(reply);
}

module.exports.help = {
    name: "commands"
}