const Discord = require("discord.js");

const Roles = require("../dataFiles/roles.json")
const path = require('path');
const leadingLogsFile = path.normalize(__dirname + "../../dataFiles/leadingLogs.json");
const leadingLogs = require(leadingLogsFile);

module.exports.run = async (lanisBot, message, args) => {
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
    let activeLeaders = [];
    for (let i = 0; i < leadingLogs.leaders.length; i++) {
        const currentLeader = await message.guild.members.fetch(leadingLogs.leaders[i].id).catch(async e => {
            await message.channel.send("Found a member with an invalid ID, continuing.")
        });
        if (currentLeader) activeLeaders.push(leadingLogs.leaders[i]);
    }

    function compare(a, b) {
        if (a.runs < b.runs) {
            return 1;
        }
        if (a.runs > b.runs) {
            return -1;
        }
        return 0;
    }

    activeLeaders.sort(compare);
    let totalRuns = 0
    let assistedRuns = 0
    for (const leader of activeLeaders) {
        const currentLeader = await message.guild.members.fetch(leader.id).catch(async e => {
            await message.channel.send("Found a member with an invalid ID, continuing.")
        });
        if (!currentLeader) continue;

        const leaderName = currentLeader.id === message.author.id ? currentLeader.toString() : currentLeader.displayName;
        const newReportMessage = reportMessage + "\n" + leaderName + " Raids Completed: `" + leader.runs + "`, Assisted Runs: `" + leader.assistedRuns + "`";
        totalRuns += parseInt(leader.runs)
        assistedRuns += parseInt(leader.assistedRuns)
        if (newReportMessage.length > 1024) {
            reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
            reportMessage = leaderName + " Raids Completed: `" + leader.runs + "`, Assisted Runs: `" + leader.assistedRuns + "`";
        } else {
            reportMessage = newReportMessage;
        }
    }

    let inactiveRaidLeaders = [];
    const arlRole = message.guild.roles.find(role => role.id === Roles.almostRaidLeader.id);
    const rlRole = message.guild.roles.find(role => role.id === Roles.raidLeader.id);

    await message.guild.members.fetch().then(members => {
        for (const member of members.values()) {
            let isLeader = false;
            if (member.user.bot === false) {
                for (role of member.roles.values()) {
                    if (role.id === arlRole.id || role.id === rlRole.id) {
                        isLeader = true;
                        break;
                    }
                }
                if (isLeader) {
                    let leaderAdded = false;
                    for (let i = 0; i < leadingLogs.leaders.length; i++) {
                        if (leadingLogs.leaders[i].id === member.id) {
                            leaderAdded = true;
                            break;
                        }
                    }
                    if (leaderAdded === false) {
                        inactiveRaidLeaders.push(member);
                    }
                }
            }
        }
    });

    for (const leader of inactiveRaidLeaders) {
        const leaderName = leader.id === message.author.id ? leader.toString() : leader.displayName;
        const newReportMessage = reportMessage + "\n" + leaderName + " hasn't completed or assisted a single run this week.";
        if (newReportMessage.length > 1024) {
            reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
            reportMessage = leaderName + " hasn't completed or assisted a single run this week.";
        } else {
            reportMessage = newReportMessage;
        }
    }

    reportEmbed.addField(" ឵឵ ឵឵", reportMessage)
        .setFooter("Total Runs: " + totalRuns + "; Assisted Runs: " + assistedRuns)
    await message.channel.send(reportEmbed);
}

module.exports.help = {
    name: "currentWeek",
    category: "Raiding",
    example: "`-currentWeek`",
    explanation: "Displays all the runs from the current week, includes people who haven't done any but are raid leaders too."
}