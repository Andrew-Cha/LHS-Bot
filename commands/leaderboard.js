const Discord = require("discord.js");
const Roles = require("../dataFiles/roles.json")

module.exports.run = async (lanisBot, message, args) => {
    const guild = lanisBot.guilds.get("343704644712923138");
    let reportEmbed = new Discord.MessageEmbed()
        .setColor("3ea04a")
        .setTimestamp()
        .setDescription("Leaderboard of Runs");

    let reportMessage = "";
    let activeMembers = [];

    function compare(a, b) {
        return (b.cultsDone * 0.75 + b.voidsDone + b.otherDungeonsDone * 0.25) - (a.cultsDone * 0.75 + a.voidsDone + a.otherDungeonsDone * 0.25)
    }

    lanisBot.database.all(`SELECT * FROM stats WHERE cultsDone >= 0 OR voidsDone >= 0 OR otherDungeonsDone >= 0;`, async (error, rows) => {
        rows.forEach(member => {
            activeMembers.push(member)
        })

        activeMembers.sort(compare);
        let memberPlace = 1
        for (const member of activeMembers) {
            const currentMember = guild.members.get(member.ID)
            if (!currentMember) continue;

            const memberName = currentMember.id === message.author.id ? currentMember.toString() : currentMember.displayName;
            const newReportMessage = reportMessage + "\n**[#" + memberPlace + "]** " + memberName + "\n Cults Done - " + member.cultsDone + " | Voids Done - " + member.voidsDone + " | Other Dungeons Done - " + member.otherDungeonsDone + "\n";
            if (newReportMessage.length > 1024) {
                reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
                reportMessage = "**[#" + memberPlace + "]** " + memberName + "\n Cults Done - " + member.cultsDone + " | Voids Done - " + member.voidsDone + " | Other Dungeons Done - " + member.otherDungeonsDone + "\n";
            } else {
                reportMessage = newReportMessage
            }

            memberPlace += 1
            if (memberPlace >= rows.length || memberPlace > 25) {
                const authorMember = activeMembers.find(member => member.ID === message.author.id)
                let authorPlace = activeMembers.indexOf(authorMember) + 1

                reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
                    .setFooter("Your Rank: #" + authorPlace + "")

                await message.react("✅")
                await message.author.send(reportEmbed);

                const historyDMs = lanisBot.channels.get("396694518738714634")
                let historyReport = new Discord.MessageEmbed()
                    .addField("Sent Leaderboard", `User <@${message.author.id}> has received the run leaderboard after requesting it.`)
                    .setColor("3ea04a")
                    .setFooter("User ID: " + message.author.id)
                    .setTimestamp()


                if (message.channel.type === "dm") {
                    historyReport.addField("Channel Type", "Direct Message")
                } else {
                    historyReport.addField("Channel Type", `<#${message.channel.id}>`)
                }

                await historyDMs.send(historyReport)

                if (message.channel.type !== "dm") {
                    await sleep(30000)
                    await message.delete()
                }

                return
            }
        }
    })
}

module.exports.help = {
    name: "leaderboard",
    category: "Bot",
    example: "`-leaderboard`",
    explanation: "Displays the people who have done the most runs."
}

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}