const fs = require("fs");
const path = require("path");

const express = require('express');

const validators = require('../validators');
const services = require('../services');

const router = express.Router();

fs.readdirSync(__dirname)
  .filter(file => (file.indexOf(".") !== 0 && file !== "index.js" && file.slice(-3) === ".js"))
  .forEach(file => require(path.join(__dirname, file))(router, services, validators));

module.exports = router;