const Discord = require("discord.js");

module.exports.run = async (client, message, args) => {
    return message.channel.send('Hey, <@254784010075504640> OwO *nuzzles you*!',
        {
            files: [{
                attachment: './files/images/owowhatsthis.jpg',
                name: 'owowhatsthis.jpg'
            }]
        })
}

module.exports.help = {
    name: "dab",
    category: "Miscellaneous",
    example: "`-dab`",
    explanation: "Meant for sinners who have disobeyed the law."
}
