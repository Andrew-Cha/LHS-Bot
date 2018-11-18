const Discord = require("discord.js");
const Roles = require("../dataFiles/roles.json")
const Channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    let world = args[0];
    let location = "";
    for (let i = 1; i < args.length; i++) {
        location = location + args[i] + " "
    }

    if (!world) return await message.channel.send("Please input a world, good ones are: 3, 4, 7, 10, 12.");
    if (isNaN(world)) return await message.channel.send("Please input a number for the world.");
    if (location === "") return await message.channel.send("Please input a location for the train.");
    if (world > 13 || world < 1) return await message.channel.send("No such world exists.");
    let worldDescripion = "It seems that this world isn't special.."

    switch (Number(world)) {
        case 3:
            worldDescripion = "Overspawned, very spacious, excellent for dragging, fantastic for circling as its design is simple for most players to follow.\nHas most ideal god lands.\nYields 400+ fame per hour.";
            break;

        case 4:
            worldDescripion = "Hardest map to keep the train on the correct path, as it's divided into 3 godland segments given that there are grass tiles in between them. As such, most players would conclude that there is no more godlands beyond that point, thus turn around, resulting in a deficit of fame.\nHowever, It is very spacious and could be used for potentially lethal drags.";
            break;

        case 7:
            worldDescripion = "It's a good map, but people would probably mistake the small snowlands as an end to the godlands, when there's more below that.\nVery spacious, which makes for a good map to drag in.";
            break;

        case 10:
            worldDescripion = "A potential Top Tier map, but is temporarily considered Mid Tier because over time, the spawns die off and it's easy for people to deviate from the correct path.";
            break;

        case 12:
            worldDescripion = "Overspawned, very spacious, excellent for dragging, fantastic for circling as its design is simple for most players to follow.\nHas most ideal god lands.\nYields 400+ fame per hour.";
            break;

        default:
            console.log("No description");
            break;
    }

    const imagePath = "./files/images/worlds/world" + world + ".png";
    const title = "**World #" + world + "";
    let worldEmbed = new Discord.MessageEmbed()
        .setColor("#42f477")
        .addField("Information", worldDescripion)
        .setDescription(title + " • " + location + " • Started by: " + message.member.displayName + "**")
        .attachFiles(imagePath)
        .setImage("attachment://world" + world + ".png");

    const raidStatusAnnouncements = lanisBot.channels.get(Channels.raidStatusAnnouncements.id);
    const messages = await raidStatusAnnouncements.messages.fetch();

    for (let message of messages.values()) await message.delete();

    await raidStatusAnnouncements.send("<@&501979785140895744>");
    await raidStatusAnnouncements.send(worldEmbed);
}

module.exports.help = {
    name: "world2"
}
