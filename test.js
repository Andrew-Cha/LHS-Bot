const Roles = require("./dataFiles/roles.json")

Object.keys(Roles).map(role => {
    console.log(role);
    console.log(role.id);
})