const Discord = require("discord.js");
const Emojis = require("../../data/emojis.json")
const channels = require("../../data/channels.json");
const fs = require('fs');
const path = require('path');
const safeGuardConfigsFile = path.normalize(__dirname + "../../../data/safeGuardConfigs.json");
const safeGuardConfigs = require(safeGuardConfigsFile);

module.exports.run = async (client, message, args) => {
  const raidingChannelCount = Object.keys(channels.raidingChannels.id).length;
  const groupImages = ["https://i.imgur.com/Auj5j8e.png", "https://i.imgur.com/JsxemyK.png", "https://i.imgur.com/M06pChe.png", "https://i.imgur.com/XaxkV7i.png"];
  let channelNumber = args[0];
  let groupParameter = args[1];
  let raidingChannel;
  let maxGroups = 2;

  if (0 < channelNumber && channelNumber <= raidingChannelCount) {
    raidingChannel = client.channels.get(channels.raidingChannels.id[channelNumber - 1]);
  } else {
    const error = "Can't find such a channel to set up the void split for.";
    await message.channel.send(error);
    return;
  }

  if (groupParameter != undefined) {
    if (groupParameter.toUpperCase() === "MEDIUM") {
      maxGroups = 3;
      await message.channel.send("Forming 3 groups.");
    } else if (groupParameter.toUpperCase() === "LARGE") {
      maxGroups = 4;
      await message.channel.send("Forming 4 groups.");
    } else if (groupParameter.toUpperCase() === "SMALL") {
      await message.channel.send("Forming 2 groups by choice.");
    } else {
      await message.channel.send("Invalid input, please put a valid input.");
    }
  } else {
    await message.channel.send("Forming 2 groups by default.");
  }

  let index;
  let currentLeader;
  for (let i = 0; i < safeGuardConfigs.leaders.length; i++) {
    if (safeGuardConfigs.leaders[i].id === message.author.id) {
      index = i;
      break;
    }
  }

  if (index != undefined) {
    currentLeader = safeGuardConfigs.leaders[index];
    if (currentLeader.commands.includes("SPLITVOID")) {
      let abortCheck = false;
      await new Promise(async (resolve, reject) => {
        await message.channel.send("Are you sure you want to form " + maxGroups + " groups?");
        const messageFilter = (responseMessage, user) => responseMessage.content != "" && responseMessage.author === message.author;
        const safeGuardCollector = new Discord.MessageCollector(message.channel, messageFilter, { time: 60000 });
        safeGuardCollector.on("collect", async (responseMessage, user) => {
          if (responseMessage.author === message.author) {
            if (responseMessage.content === "-yes") {
              safeGuardCollector.stop("CONTINUE");
            } else if (responseMessage.content === "-no") {
              safeGuardCollector.stop("STOP");;
            } else {
              await message.channel.send("Please respond with a correct answer: `-yes` or `-no`.");
            }
          }
        });

        safeGuardCollector.on("end", async (collected, reason) => {
          if (reason === "CONTINUE") {
            resolve("SUCCESS");
          } else if (reason === "STOP" || reason === "time") {
            reject("FAILURE");
          }
        })
      }).then(async (successMessage) => {
        await message.channel.send("Starting the Void Split.");
      }).catch(async (failureMessage) => {
        await message.channel.send("Stopping the Void Split.");
        abortCheck = true;
      });
      if (abortCheck) return;
    }
  }

  const reactEmojis = [client.emojis.find(emoji => emoji.id === Emojis.lostHalls.voidEntity),
  client.emojis.find(emoji => emoji.id === Emojis.lostHalls.marbleSeal),
  client.emojis.find(emoji => emoji.id === Emojis.classes.paladin),
  client.emojis.find(emoji => emoji.id === Emojis.classes.warrior),
  client.emojis.find(emoji => emoji.id === Emojis.classes.knight),
  client.emojis.find(emoji => emoji.id === Emojis.classes.priest),
    "❌"
  ];

  let voidCheckEmbed = new Discord.MessageEmbed()
    .addField("Splitting **Raiding Channel Number " + (channelNumber) + "** into groups!", "React below with only one emote from the classes or Marble Seal that you are bringing to void.")
    .addField("If you do not have any of the classes(or the Marble Seal) shown below react with: ", reactEmojis[0]);
  const voidCheckMessage = await client.channels.get(channels.groupAssignments.id).send(voidCheckEmbed);

  const filter = (reaction, user) => (reaction.emoji.name === "❌" ||
    reaction.emoji === client.emojis.find(emoji => emoji.id === Emojis.lostHalls.voidEntity) ||
    reaction.emoji === client.emojis.find(emoji => emoji.id === Emojis.lostHalls.marbleSeal) ||
    reaction.emoji === client.emojis.find(emoji => emoji.id === Emojis.classes.paladin) ||
    reaction.emoji === client.emojis.find(emoji => emoji.id === Emojis.classes.warrior) ||
    reaction.emoji === client.emojis.find(emoji => emoji.id === Emojis.classes.knight) ||
    reaction.emoji === client.emojis.find(emoji => emoji.id === Emojis.classes.priest)) && !user.bot;

  const collector = new Discord.ReactionCollector(voidCheckMessage, filter, { time: 60000 });
  collector.on("collect", async (reaction, user) => {
    if (!reaction.users.last().bot && reaction.emoji.name === "❌") {
      const currentMember = await message.guild.members.fetch(user.id);
      if (currentMember && currentMember.hasPermission("MOVE_MEMBERS")) {
        collector.stop();
        //const editedEmbed = new Discord.MessageEmbed()
        //   .setImage("https://i.imgur.com/ykSCdYt.png")
        //   .addField("The Void check has been stopped by " + currentMember.displayName + ".", "Please wait for the next run to start.");
        // await voidCheckMessage.edit(editedEmbed);
      }
    }
  })

  for (const emoji of reactEmojis) {
    await voidCheckMessage.react(emoji)
      .catch(console.error);
  }

  collector.on("end", async (collected, reason) => {
    // if (reason !== "user") {
    const editedEmbed = new Discord.MessageEmbed()
      .setImage("https://i.imgur.com/ykSCdYt.png")
      .addField("The Void check has been finished.", "Please wait for the next run to start.");
    await voidCheckMessage.edit(editedEmbed);
    //}

    const members = raidingChannel.members;

    let peopleActive = [];
    let duplicateReactors = [];
    const voidEntityEmoji = client.emojis.find(emoji => emoji.id === Emojis.lostHalls.voidEntity);
    const marbleEmoji = client.emojis.find(emoji => emoji.id === Emojis.lostHalls.marbleSeal)
    const paladinEmoji = client.emojis.find(emoji => emoji.id === Emojis.classes.paladin);
    const warriorEmoji = client.emojis.find(emoji => emoji.id === Emojis.classes.warrior);
    const knightEmoji = client.emojis.find(emoji => emoji.id === Emojis.classes.knight);
    const priestEmoji = client.emojis.find(emoji => emoji.id === Emojis.classes.priest);

    const voidEntityReacts = (collected.get(voidEntityEmoji.id) ? collected.get(voidEntityEmoji.id).users : null);
    const marbleReacts = (collected.get(marbleEmoji.id) ? collected.get(marbleEmoji.id).users : null);
    const paladinReacts = (collected.get(paladinEmoji.id) ? collected.get(paladinEmoji.id).users : null);
    const warriorReacts = (collected.get(warriorEmoji.id) ? collected.get(warriorEmoji.id).users : null);
    const knightReacts = (collected.get(knightEmoji.id) ? collected.get(knightEmoji.id).users : null);
    const priestReacts = (collected.get(priestEmoji.id) ? collected.get(priestEmoji.id).users : null);

    const allReacts = [voidEntityReacts, marbleReacts, paladinReacts, warriorReacts, knightReacts, priestReacts];
    const usefulReacts = [marbleReacts, paladinReacts, warriorReacts, knightReacts, priestReacts];

    for (reaction of allReacts) {
      if (reaction && reaction.size - 1 > 0) {
        if (reaction) {
          for (const member of reaction.values()) {
            if (peopleActive.includes(member) === false && !member.bot) peopleActive.push(member);
          }
        }
      }
    }

    let index = 0;
    for (reaction of usefulReacts) {
      if (reaction) {
        for (const member of reaction.values()) {
          if (member.bot) {
            usefulReacts[index].delete(member.id);
          }
          if (allReacts[0].has(member.id)) {
            allReacts[0].delete(member.id);
          }
        }
      }
      index += 1;
    }

    for (let i = 0; i < usefulReacts.length; i++) {
      const usefulReact = usefulReacts[i];
      if (usefulReact) {
        for (const member of usefulReact.values()) {
          let nextIndex = 0;
          for (reaction of usefulReacts) {
            if (reaction) {
              if (usefulReact !== reaction) {
                if (reaction.has(member.id)) {
                  if (nextIndex < usefulReacts.length) {
                    usefulReacts[nextIndex].delete(member.id);
                    if (!duplicateReactors.includes(member)) {
                      if (!member.bot) {
                        duplicateReactors.push(member);
                      }
                    }
                  }
                }
              }
            }
            nextIndex += 1;
          }
        }
      }
    }

    if (duplicateReactors.length > 0) {
      await message.channel.send("These people had duplicate reactions:\n" + duplicateReactors.join("\n"));
    }

    let groups = [];
    for (let i = 0; i < maxGroups; i++) {
      let group = [];
      groups.push(group);
    }

    let usefulReactsToArray = [];
    let voidEntityReactsToArray;
    if (allReacts[0]) {
      voidEntityReactsToArray = Array.from(allReacts[0].values());
    }
    for (usefulReact of usefulReacts) {
      if (usefulReact !== null) {
        const usefulReactArray = Array.from(usefulReact.values());
        usefulReactsToArray.push(usefulReactArray);
      }
    }

    let currentGroup = 0;
    for (let i = 0; i < usefulReactsToArray.length; i++) {
      while (usefulReactsToArray[i].length) {
        for (let j = currentGroup; j < maxGroups; j++) {
          if (usefulReactsToArray[i][0]) {
            groups[j].push(usefulReactsToArray[i].shift());
          } else {
            currentGroup = j;
            break;
          }
          currentGroup = 0;
        }
      }
    }

    if (voidEntityReactsToArray !== undefined) {
      while (voidEntityReactsToArray.length) {
        for (let i = currentGroup; i < maxGroups; i++) {
          if (voidEntityReactsToArray[0]) {
            groups[i].push(voidEntityReactsToArray.shift());
          } else {
            break;
          }
          currentGroup = 0;
        }
      }
    }

    const groupAssignments = client.channels.get(channels.groupAssignments.id);
    for (let i = 0; i < groups.length; i++) {
      await groupAssignments.send("Group " + (i + 1) + " (" + groups[i].length + " people)" + " :\n" + groups[i].join(" "));
    }
  })
}

module.exports.help = {
  name: "splitVoid",
  category: "Raiding",
  example: "`-splitVoid [Raiding Channel Number] [2 / 3 / 4 or Small / Medium / Large]`",
  explanation: "Starts a void split in group assignments."
}
