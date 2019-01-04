const Discord = require("discord.js");

module.exports.run = async (lanisBot, message, args) => {
    return message.channel.send('Hey, <@270085795275079680>, you have sinned!',
        {
            files: [{
                attachment: './files/images/animeMeme.jpg',
                name: 'animeMeme.jpg'
            }]
        })
}

module.exports.help = {
    name: "dab",
    category: "Miscellaneous",
    example: "`-dab`",
    explanation: "Meant for sinners who have disobeyed the law."
}
