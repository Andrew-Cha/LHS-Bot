const Discord = require("discord.js");
const Roles = require("../dataFiles/roles.json")
const Channels = require("../dataFiles/channels.json");

module.exports.run = async (lanisBot, message, args) => {
    const setupEmbed = new Discord.MessageEmbed()
        .setDescription(`Setup for ${lanisBot.user.username}`)
        .setColor("#5042f4")
        .setFooter("⚠ Keep in mind that Lanis has to add these roles and channels manually for security reasons, this is an indicator of how much is ready for the current server.");

    const category = args[0];

    let actionCapitalized = "";
    if (category === undefined) {
        actionCapitalized = "DEFAULT";
    } else if (category.toUpperCase() === "CHANNELS") {
        actionCapitalized = "CHANNELS";
    } else if (category.toUpperCase() === "ROLES") {
        actionCapitalized = "ROLES";
    }

    console.log(actionCapitalized);
    switch (actionCapitalized) {
        case "CHANNELS":
            let channelString = " ";
            let crossedLimit = false;

            for (const key in Channels) {
                const currentChannel = Channels[key];
                let isMultiple = false;
                if (Array.isArray(currentChannel.id)) isMultiple = true;
                let channelTag = "";

                if (currentChannel.id) {
                    if (isMultiple) {
                        let names = [];
                        for (const id of currentChannel.id) {
                            const channel = await message.guild.channels.get(id);
                            let channelName = ""
                            if (channel) {
                                channelName = channel.name;
                            } else {
                                channelName = "Invalid Channel"
                            }
                            names.push(channelName);
                        }

                        for (const name of names) {
                            channelTag = channelTag + "`" + name + "` "
                        }
                    } else {
                        const channel = await message.guild.channels.get(currentChannel.id);
                        if (channel) {
                            channelTag = "`" + channel.name + "`";
                        } else {
                            channelTag = "**Invalid channel**"
                        }
                    }
                } else {
                    channelTag = "**Not Yet Added**";
                }

                const newChannelString = channelString + `\n • ${currentChannel.name} - ${channelTag}`;
                if (newChannelString.length > 1024) {
                    if (!crossedLimit) {
                        setupEmbed.addField("Available Channels To Setup", channelString);
                        crossedLimit = true;
                    } else {
                        setupEmbed.addField(" ឵឵ ឵឵", channelString);
                    }
                    channelString = `\n • ${currentChannel.name} - ${channelTag}`;
                } else {
                    channelString = newChannelString;
                }
            }

            if (!crossedLimit) {
                setupEmbed.addField("Available Channels To Setup", channelString);
            } else {
                setupEmbed.addField(" ឵឵ ឵឵", channelString);
            }
            break;

        case "ROLES":
            let roleString = " ឵឵ ឵឵";

            for (const key in Roles) {
                const currentRole = Roles[key];
                let roleTag;
                if (!currentRole.id) {
                    roleTag = "**Not Yet Added**"
                } else {
                    const role = message.guild.roles.get(currentRole.id);
                    if (!role) {
                        roleTag = "**Role ID Invalid**"
                    } else {
                        roleTag = role.toString();
                    }
                }
                const newRoleString = roleString + `\n • ${currentRole.name} - ${roleTag}`
                roleString = newRoleString
            }

            setupEmbed.addField("Available Roles to Setup", roleString);
            break;

        case "DEFAULT":
            setupEmbed.addField("Channels", "To enter the setup for channels that are needed for the bot use:\n`-setup channels`\n")
                .addField("Roles", "To enter the setup for the roles that are needed for the bot use:\n`-setup roles`\n")
            break;

        default:
            await message.channel.send("Uh oh.. Something went wrong.\nPlease check your input to be:\n`-setup (Roles / Channels)`");
            return;
    }
    await message.channel.send(setupEmbed);
}

module.exports.help = {
    name: "setup"
}
