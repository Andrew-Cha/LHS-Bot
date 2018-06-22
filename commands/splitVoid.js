const Discord = require("discord.js");
const channels = require("../channels.json");

module.exports.run = async (lanisBot, message, args) => {
  const raidingChannelCount = Object.keys(channels.raidingChannels).length;
  let channelNumber;
  let raidingChannel;
  let voidImage = "/files/images/voidImage.png";

  if (0 < args && args <= raidingChannelCount) {
    channelNumber = args - 1;
    raidingChannel = lanisBot.channels.get(channels.raidingChannels[channelNumber]);
  } else {
    const error = "**Can't find such a channel to set up the void split for.**";
    await message.channel.send(error);
    return;
  }

  const reactEmojis = [lanisBot.emojis.find("name", "voidentity"),
  lanisBot.emojis.find("name", "warrior"),
  lanisBot.emojis.find("name", "paladin"),
  lanisBot.emojis.find("name", "knight"),
  lanisBot.emojis.find("name", "priest"),
    "❌"
  ];

  let voidCheckEmbed = new Discord.RichEmbed()
    .addField("Splitting **Raiding Channel Number " + (channelNumber + 1) + "** into groups!", "React below with the classes that you are bringing to void.")
    .addField("If you do not have any of the classes shown below react with: ", reactEmojis[0]);
  const voidCheckMessage = await lanisBot.channels.get(channels.raidStatusAnnouncements).send(voidCheckEmbed);

  const filter = (reaction, user) => reaction.emoji.name === "❌" ||
    reaction.emoji === lanisBot.emojis.find("name", "voidentity") ||
    reaction.emoji === lanisBot.emojis.find("name", "warrior") ||
    reaction.emoji === lanisBot.emojis.find("name", "paladin") ||
    reaction.emoji === lanisBot.emojis.find("name", "knight") ||
    reaction.emoji === lanisBot.emojis.find("name", "priest");

  const collector = new Discord.ReactionCollector(voidCheckMessage, filter, { time: 120000 });
  collector.on("collect", async (reaction, collector) => {
    if (!reaction.users.last().bot && reaction.emoji.name === "❌") {
      const currentMember = voidCheckMessage.guild.member(reaction.users.last()) || await voidCheckMessage.guild.fetchMember(reaction.users.last());
      if (currentMember && currentMember.hasPermission("MOVE_MEMBERS")) {
        collector.stop();
        const editedEmbed = new Discord.RichEmbed()
          .setThumbnail(voidImage)
          .addField("The Void check has been stopped by " + currentMember.displayName + ".", "Please wait for the next run to start.");
        await voidCheckMessage.edit(editedEmbed);
      }
    }
  })

  for (const emoji of reactEmojis) {
    await voidCheckMessage.react(emoji)
      .catch(console.error);
  }

  collector.on("end", async (collected, reason) => {
    if (reason !== "user") {
      const editedEmbed = new Discord.RichEmbed()
        .setThumbnail(voidImage)
        .addField("The Void check has run out of time.", "Please wait for the next run to start.");
      await voidCheckMessage.edit(editedEmbed);
    }

    const members = raidingChannel.members;

    let peopleActive = [];
    let duplicateReactors = [];
    const voidEntityEmoji = lanisBot.emojis.find("name", "voidentity");
    const warriorEmoji = lanisBot.emojis.find("name", "warrior");
    const paladinEmoji = lanisBot.emojis.find("name", "paladin");
    const knightEmoji = lanisBot.emojis.find("name", "knight");
    const priestEmoji = lanisBot.emojis.find("name", "priest");

    const voidEntityReacts = (collected.get(voidEntityEmoji.id) ? collected.get(voidEntityEmoji.id).users : null);
    const warriorReacts = (collected.get(warriorEmoji.id) ? collected.get(warriorEmoji.id).users : null);
    const paladinReacts = (collected.get(paladinEmoji.id) ? collected.get(paladinEmoji.id).users : null);
    const knightReacts = (collected.get(knightEmoji.id) ? collected.get(knightEmoji.id).users : null);
    const priestReacts = (collected.get(priestEmoji.id) ? collected.get(priestEmoji.id).users : null);

    const allReacts = [voidEntityReacts, warriorReacts, paladinReacts, knightReacts, priestReacts];
    const usefulReacts = [warriorReacts, paladinReacts, knightReacts, priestReacts];

    for (reaction of allReacts) {
      if (reaction && reaction.size - 1 > 0) {
        for (const member of reaction.values()) {
          if (peopleActive.includes(member) === false && !member.bot) peopleActive.push(member);
        }
      }
    }

    for (const member of members.values()) {
      if (!member.bot) {
        if (peopleActive.includes(member.user) === false && !member.hasPermission("MOVE_MEMBERS")) {
          await member.setVoiceChannel(channels.cultChannels[channelNumber]);
        }
      }
    }

    let index = 0;
    for (reaction of usefulReacts) {
      if (reaction && reaction.size - 1 > 0) {
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

    let index2 = 0;
    for (usefulReact of usefulReacts) {
      for (const member of usefulReact.values()) {
        if (allReacts[0].has(member.id)) {
          allReacts[0].delete(member.id);
        }

        for (reaction of usefulReacts) {
          if (usefulReact !== reaction) {
            if (reaction.has(member.id)) {
              usefulReacts[index2].delete(member.id);
              if (!duplicateReactors.includes(member)) {
                if (!member.bot) {
                  duplicateReactors.push(member);
                }
              }
            }
          }
        }
      }
      index2 += 1;
    }

    if (duplicateReactors.length > 0) {
      await message.channel.send("These people had duplicate reactions:\n" + duplicateReactors.join("\n"));
    }

    let maxGroups = 2;

    for (reaction of usefulReacts) {
      if (reaction.size < maxGroups) {
        maxGroups = reaction.size;
      }
    }

    if (maxGroups <= 1) {
      await message.channel.send("Can't form any groups, too few of the needed classes.");
      return;
    }

    //await message.channel.send("Can form " + maxGroups + " groups.");

    let groups = [];
    for (let i = 0; i < maxGroups; i++) {
      let group = [];
      groups.push(group);
    }

    let usefulReactsToArray = [];
    let voidEntityReactsToArray = Array.from(allReacts[0].values());

    for (usefulReact of usefulReacts) {
      const usefulReactArray = Array.from(usefulReact.values());
      usefulReactsToArray.push(usefulReactArray);
    }

    for (let i = 0; i < usefulReactsToArray.length; i++) {
      while (usefulReactsToArray[i].length) {
        for (let j = 0; j < maxGroups; j++) {
          if (usefulReactsToArray[i][0]) {
            groups[j].push(usefulReactsToArray[i].shift());
          } else {
            break;
          }
        }
      }
    }


    while (voidEntityReactsToArray.length) {
      for (let i = 0; i < maxGroups; i++) {
        if (voidEntityReactsToArray[0]) {
          groups[i].push(voidEntityReactsToArray.shift());
        } else {
          break;
        }
      }
    }

    for (let i = 0; i < groups.length; i++) {
      await lanisBot.channels.get(channels.groupAssignments).send("Group " + (i + 1) + " :\n" + groups[i].join("\n"));
    }
  })
}

module.exports.help = {
  name: "splitVoid"
}

Object.assign(Discord.Collection.prototype, {
  partition(fn, thisArg) {
    if (typeof thisArg !== 'undefined') fn = fn.bind(thisArg);
    const results = [new Discord.Collection(), new Discord.Collection()];
    for (const [key, val] of this) {
      if (fn(val, key, this)) {
        results[0].set(key, val);
      } else {
        results[1].set(key, val);
      }
    }
    return results;
  }
})

/* DONE
Grabs all the people that reacted to useful classes (paladin, warrior, knight, priest)
*/

/* DONE2
remove all the people from warrior, paladin, knight, priest in that order from ANY other groups to avoid duplicates or troll reacts. Spit out the names of people who reacted twice in this whole check to useful classes.
*/

/* DONE
and sets a max group count. If more than 2 useful class groups have only 1 or less members, then throw that error that it can not form any groups.
*/

/*DONE
Split useful classes evenly among X amount of groups
*/

/* DONE
Split all the other people (non-usefull classes) into all of those x groups
*/

/* DONE
Print out the groups in the format
Group X:
Person1 is a :emoji: (for example marble seal)
*/