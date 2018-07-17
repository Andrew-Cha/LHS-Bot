const Discord = require("discord.js");

const channels = require("../channels.json");
const fs = require('fs');
const path = require('path');
const leadingLogsFile = path.normalize(__dirname + "../../leadingLogs.json");
const leadingLogs = require(leadingLogsFile);

module.exports.run = async (lanisBot, message, args) => {
    const hrlRole = message.guild.roles.find(role => role.name === "Raid Leader Council");
    if (message.member.highestRole.position <= hrlRole.position) return await message.channel.send("You can not end the week as a member with a role lower than Raid Leader Council.");
    let month = new Date().getUTCMonth() + 1;
    const day = new Date().getUTCDate();
    const week = parseInt(day / 7) + 1;
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
    let reportMessage = "**" + week + weekSuffix + " week of " + month + "**\n";
    let activeLeaders = [];
    for (let i = 0; i < leadingLogs.leaders.length; i++) {
        const currentLeader = await message.guild.fetchMember(leadingLogs.leaders[i].id);
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
    for (const leader of activeLeaders) {
        const currentLeader = await message.guild.fetchMember(leader.id);
        const newReportMessage = reportMessage + "\n" + currentLeader + " Raids Completed: `" + leader.runs + "`, Assisted Runs: `" + leader.assistedRuns + "`";
        if (newReportMessage.length > 2000) {
            await lanisBot.channels.get(channels.leadingActivityLogs).send(reportMessage);
            reportMessage = currentLeader + " Raids Completed: `" + leader.runs + "`, Assisted Runs: `" + leader.assistedRuns + "`";
        } else {
            reportMessage = newReportMessage;
        }
    }

    let inactiveRaidLeaders = [];
    await message.guild.fetchMembers().then(guild => {
        for (const member of guild.members.values()) {
            let isLeader = false;
            if (member.user.bot === false) {
                for (role of member.roles.values()) {
                    if (role.name === "Almost Raid Leader" || role.name === "Raid Leader") {
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
        const newReportMessage = reportMessage + "\n" + leader + " hasn't completed or assisted a single run this week.";
        if (newReportMessage.length > 2000) {
            await lanisBot.channels.get(channels.leadingActivityLogs).send(reportMessage);
            reportMessage = leader + " hasn't completed or assisted a single run this week.";
        } else {
            reportMessage = newReportMessage;
        }
    }

    await lanisBot.channels.get(channels.leadingActivityLogs).send(reportMessage);

    leadingLogs.leaders = [];
    fs.writeFile(leadingLogsFile, JSON.stringify(leadingLogs), function (err) {
        if (err) return console.log(err);
    });
}


module.exports.help = {
    name: "endWeek"
}