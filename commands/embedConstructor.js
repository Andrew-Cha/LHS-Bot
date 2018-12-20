const Discord = require("discord.js");
 
module.exports.run = async (lanisBot, message, args) => {
    let date = new Date()
    const embed = new Discord.MessageEmbed()
    .setTitle("This is your title, it can hold 256 characters")
    .setAuthor("Author Name", "https://i.imgur.com/lm8s41J.png")
    .setColor(0x00AE86)
    .setDescription("This is the main body of text, it can hold 2048 characters.")
    .setFooter("This is the footer text, it can hold 2048 characters", "http://i.imgur.com/w1vhFSR.png")
    .setImage("http://i.imgur.com/yVpymuV.png")
    .setThumbnail("http://i.imgur.com/p2qNFag.png")
    .setTimestamp()
    .setURL("https://discord.js.org/#/docs/main/master/class/MessageEmbed")
    .addField("This is a field title, it can hold 256 characters",
      "This is a field value, it can hold 1024 characters.")
    .addField("Inline Field", "They can also be inline.", true)
    .addField("Inline Field 2", "They can also be inline, below is a blank field.", true)
    .addBlankField()
    .addField("Inline Field 3", "You can have a maximum of 25 fields.", true);
   
    await message.channel.send("Hello, welcome to your custom embed constructor")
    await message.channel.send(embed)
}
 
module.exports.help = {
    name: "embedConstructor"
}
 