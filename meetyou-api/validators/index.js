const fs = require("fs");
const path = require("path");

const validators = {};
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf(".") !== 0 && file !== "index.js" && file.slice(-3) === ".js"
    );
  })
  .forEach(file => {
    console.log(file);
    const validator = require(path.join(__dirname, file));
    const key = Object.keys(validator)[0];
    validators[key] = validator[key];
  });

module.exports = validators;
