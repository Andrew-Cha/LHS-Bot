const Discord = require("discord.js");

module.exports.run = async (lanisBot, message, args) => {
    const MongoClient = require('mongodb').MongoClient;

    MongoClient.connect("mongodb://localhost:27017/exampleDb", function (err, db) {
        if (!err) {
            console.log("We are connected");
        }
    });
}

module.exports.help = {
    name: "db"
}