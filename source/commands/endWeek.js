const Discord = require("discord.js");

const Channels = require("../../data/channels.json");
const Roles = require("../../data/roles.json")

module.exports.run = async (client, message, args) => {
    if (args[0] !== "automaticEnd" && message.author.bot === false) {
        return message.channel.send("Only the bot can end the week automatically.")
    } 
    //142250464656883713
    let month = new Date().getUTCMonth() + 1;
    const day = new Date().getUTCDate();
    const week = Math.floor(day / 8) + 1;
    let weekSuffix = "";
    switch (week) {
        case 1:
            weekSuffix = "st";
            break;
        case 2:
            weekSuffix = "nd";
            break;
        case 3:
            weekSuffix = "rd";
            break;
        case 4:
            weekSuffix = "th";
            break;
        default:
            weekSuffix = "st";
            break;
    }
    switch (month) {
        case 1:
            month = "January";
            break;
        case 2:
            month = "February";
            break;
        case 3:
            month = "March";
            break;
        case 4:
            month = "April";
        case 5:
            month = "May";
            break;
        case 6:
            month = "June";
            break;
        case 7:
            month = "July";
            break
        case 8:
            month = "August";
            break;
        case 9:
            month = "September";
            break;
        case 10:
            month = "October"
            break;
        case 11:
            month = "November";
            break;
        case 12:
            month = "December";
            break;
        default:
            month = "Unknown Month";
            break;
    }

    let reportEmbed = new Discord.MessageEmbed()
        .setColor("3ea04a");
    const weekMessage = "**" + week + weekSuffix + " week of " + month + "**\n";
    let reportMessage = "";
    reportEmbed.setDescription(weekMessage);

    const templateEmbed = reportEmbed

    let activeLeaders = [];
    client.database.all(`SELECT * FROM stats WHERE currentCultsLed > 0 OR currentVoidsLed > 0 OR currentAssists > 0;`, async (error, rows) => {
        rows.forEach(member => {
            activeLeaders.push(member)
        })

        function compare(a, b) {
            return (b.currentCultsLed + b.currentVoidsLed) - (a.currentCultsLed + a.currentVoidsLed)
        }

        activeLeaders.sort(compare);
        let totalRuns = 0
        let assistedRuns = 0
        let leaderPlace = 1
        let embedCount = 0
        for (const leader of activeLeaders) {
            const currentLeader = await message.guild.members.fetch(leader.ID).catch(async e => {
                await message.channel.send("Found a member with an invalid ID, continuing.")
            });
            if (!currentLeader) continue;

            const leaderName = currentLeader.id === message.author.id ? currentLeader.toString() : currentLeader.displayName;
            const newReportMessage = reportMessage + "\n**[#" + leaderPlace + "]** " + leaderName + "\n Cults Led - " + leader.currentCultsLed + " | Voids Led - " + leader.currentVoidsLed + " | Assisted Runs - " + leader.currentAssists + "\n";
            totalRuns += leader.currentCultsLed
            totalRuns += leader.currentVoidsLed
            assistedRuns += leader.currentAssists
            if (newReportMessage.length > 1024) {
                reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
                embedCount += 1
                if (embedCount >= 5) {
                    channel.send(reportEmbed)
                    embedCount = 0
                    reportEmbed = templateEmbed
                }
                reportMessage = "**[#" + leaderPlace + "]** " + leaderName + "\nCults Led - " + leader.currentCultsLed + " | Voids Led - " + leader.currentVoidsLed + " | Assisted Runs - " + leader.currentAssists + "\n";
            } else {
                reportMessage = newReportMessage;
            }
            leaderPlace += 1
        }

        leaderPlace += 1

        const arlRole = message.guild.roles.find(role => role.id === Roles.almostRaidLeader.id);
        const rlRole = message.guild.roles.find(role => role.id === Roles.raidLeader.id);

        let raidLeaders = []
        const guildMembers = await message.guild.members.fetch()
        for (const member of guildMembers.values()) {
            if (member.user.bot === false && member.roles.find(role => role.id === arlRole.id || role.id === rlRole.id)) {
                raidLeaders.push(member)
            }
        }

        let membersChecked = 0
        await new Promise(async (resolve, reject) => {
            raidLeaders.forEach(member => {
                client.database.get(`SELECT * FROM stats WHERE ID = '${member.id}'`, async (error, row) => {
                    membersChecked += 1
                    if (row.currentCultsLed + row.currentVoidsLed + row.currentAssists === 0) {
                        const leader = message.guild.members.get(member.id)
                        const leaderName = member.id === message.author.id ? leader.toString() : leader.displayName;
                        const newReportMessage = reportMessage + "\n" + leaderName + " hasn't completed or assisted a single run this week.";

                        if (newReportMessage.length > 1024) {
                            embedCount += 1
                            reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
                            if (embedCount >= 5) {
                                channel.send(reportEmbed)
                                embedCount = 0
                                reportEmbed = templateEmbed
                            }
                            reportMessage = leaderName + " hasn't completed or assisted a single run this week.";
                        } else {
                            reportMessage = newReportMessage;
                        }
                    }

                    if (membersChecked === raidLeaders.length) {
                        resolve("SUCCESS")
                    }
                })
            })
        }).then(async () => {
            reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
                .setFooter("Total Runs: " + totalRuns + "; Assisted Runs: " + assistedRuns)
                const guild = client.guilds.get(`343704644712923138`)
                const channel = guild.channels.get(Channels.leadingActivityLogs.id)
                await channel.send(reportEmbed)
        }).catch(console.error)
    })

    client.database.all(`SELECT * FROM stats WHERE currentCultsLed > 0 OR currentVoidsLed > 0 OR currentAssists > 0;`, async (error, rows) => {
        rows.forEach(member => {
            client.database.run(`UPDATE stats SET currentCultsLed = 0, currentVoidsLed = 0, currentAssists = 0 WHERE ID = ${member.ID};`)
        })
    })

    await message.channel.send("Done.");
}


module.exports.help = {
    name: "endWeek",
    category: "Raiding",
    example: "The bot uses this one!",
    explanation: "Ends the week and logs all the runs that were done during it."
}