const url = require("url");
const path = require("path");
const http = require("http");
const https = require("https");
const config = require("../config");

function request(options, bodyData) {
  return new Promise((resolve, reject) => {
    const httpObj = options.port == 443 ? https : http;
    const req = httpObj.request(options, function(res) {
      let output = "";
      res.setEncoding("utf8");
      console.log('statusCode' + res.statusCode);
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
    req.write(bodyData);
    req.end();
  });
}

exports.postOperation = async function(data) {
  console.log(data);
  const options = url.parse(config.socketio.url);
  if(options.protocol === 'https:' && !options.port) {
    options.port = 443;
  } else if(options.protocol === 'http:' && !options.port) {
    options.port = 80;
  }
  data = JSON.stringify(data);
  options.path = path.join(options.path, "api/socketio/operations");
  options.method =  "POST";
  options.headers = {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data)
  };
  
  return request(options, data);
};
