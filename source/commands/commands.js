const Discord = require("discord.js");
const fileSystem = require(`fs`);
module.exports.run = async (lanisBot, message, args) => {
    let command;
    if (args.length > 0) {
        command = args[0].toUpperCase();
    } else {
        command = "ALL";
    }

    let commandDescription = new Discord.MessageEmbed()
        .setColor("#5042f4")
        .setFooter("⚠ Capitalization when issuing commands doesn't matter.");

    switch (command) {
        case ("ALL"):
            let categories = []
            let categoriesFound = []
            lanisBot.commands.forEach(command => {
                if (!categoriesFound.includes(command.help.category)) {
                    categoriesFound.push(command.help.category)
                    let category = {
                        name: command.help.category,
                        commands: [command.help.name]
                    }

                    categories.push(category)
                } else {
                    categories.find(category => category.name == command.help.category).commands.push(command.help.name)
                }
            })

            for (const category of categories) {
                let commands = category.commands.join("; ")
                commandDescription.addField(category.name, "```css\n" + commands + "\n```")
            }

            break;

        default:
            if (lanisBot.commands.has(command.toUpperCase())) {
                const commandFile = lanisBot.commands.get(command.toUpperCase())
                commandDescription.addField("Description", commandFile.help.explanation)
                commandDescription.addField("Usage", commandFile.help.example)
            } else {
                return await message.channel.send("No such command found, type `-commands` for a full list.");
            }
    }

    await message.channel.send(commandDescription);
}

module.exports.help = {
    name: "commands",
    category: "Bot",
    example: "`-commands` | `-commands afk`",
    explanation: "Lists all loaded commands with no arguments, otherwise attempts to search the list of commands to show an indepth explanation."
}