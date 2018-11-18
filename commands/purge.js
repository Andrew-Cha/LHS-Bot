const Roles = require("../dataFiles/roles.json")

module.exports.run = async (lanisBot, message, args) => {
    const devRole = message.guild.roles.find(role => role.id === Roles.developer.id);
    if (message.member.roles.highest.position < devRole.position) return;
    let messageNumber = parseInt(args[0]) + 1;

    if (!messageNumber) return;
    if (messageNumber > 100) return await message.channel.send("Can't delete more than 100 messages at a time, including yours.");

    await message.channel.bulkDelete(messageNumber).catch(e => {
        console.log(e);
    })
}
 
module.exports.help = {
    name: "purge"
}
 