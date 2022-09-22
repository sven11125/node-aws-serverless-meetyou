const url = require("url");
const path = require("path");
const http = require("http");
const https = require("https");
const config = require("./config");

function request(options) {
  return new Promise((resolve, reject) => {
    const httpObj = options.port == 443 ? https : http;
    const req = httpObj.request(options, function(res) {
      let output = "";
      res.setEncoding("utf8");
      res.on("data", function(chunk) {
        output += chunk;
      });
      res.on("end", function() {
        try {
          const obj = JSON.parse(output);
          if (res.statusCode >= 400) {
            const err = new Error(obj.message);
            err.code = res.statusCode;
            reject(err);
          } else {
            resolve(obj);
          }
        } catch (err) {
          reject(err);
        }
      });
    });
    req.on("error", function(err) {
      reject(err);
    });
    req.end();
  });
}

exports.getConversations = async function(token) {
  const options = url.parse(config.api.url);
  if(options.protocol === 'https:' && !options.port) {
    options.port = 443;
  } else if(options.protocol === 'http:' && !options.port) {
    options.port = 80;
  }
  options.path = path.join(options.path, "conversations");
  if (options.headers) {
    options.headers.Authorization = token;
  } else {
    options.headers = {
      Authorization: token
    };
  }
  return request(options);
};
