const fs = require("fs");
const path = require("path");

const models = require('../models');

const services = {};
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf(".") !== 0 && file !== "index.js" && file.slice(-3) === ".js"
    );
  })
  .forEach(file => {
    console.log(file);
    const service = require(path.join(__dirname, file))(models);
    const key = Object.keys(service)[0];
    services[key] = service[key];
  });

module.exports = services;
