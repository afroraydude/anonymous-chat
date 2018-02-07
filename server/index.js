var Riddlet = function(io) {
  http = require("http");
  //fs = require('fs');
  /*
var httpsoptions = {
  key: fs.readFileSync(process.env.key),
  cert: fs.readFileSync(process.env.cert)
};
*/
  require("dotenv").config();
  
  io = require("socket.io")(app);

  var crypto = require("crypto");
  var algorithm = "aes-256-ctr";
  var jwt = require("jsonwebtoken");
  sockets = [];
  messages = [];
  colors = ["black", "blue", "green", "orange", "sienna", "coral", "purple", "gold", "royalblue", "silver", "olive", "orchid"];

  var FastRateLimit = require("fast-ratelimit").FastRateLimit;

  var messageLimiter = new FastRateLimit({ threshold: 5, ttl: 5 }); // available tokens over timespan // time-to-live value of token bucket (in seconds)

  function makeid(chars) {
    var len = chars || 15;
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < len; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

  var code = process.env.jwtcode || makeid(25);
  console.log(code);

  var ip = require("ip");

  var serverInfo = { version: "6", title: "Test Server", rooms: ["/"], maxcharlen: parseInt(process.env.maxcharlen) || 500,  ip: ip.address(), logo: process.env.logourl || "https://d30y9cdsu7xlg0.cloudfront.net/png/29558-200.png" };

  io.on("connection", socket => {
    console.log("connection")
    socket.emit("serverinfo", serverInfo);
    socket.on("identification", function(token) {
      require("./handlers/auth").RiddletIdentification(token, io, socket, sockets, messages, code, serverInfo);
    });

    socket.on("noid", function() {
      require("./handlers/auth").RiddletNonIdentification(io, socket, sockets, messages, code, serverInfo);
    });
    socket.on("disconnect", function() {
      sockets.splice(sockets.indexOf(socket), 1);
      console.log("client left");
    });
    socket.on("message", function(message) {
      const messageHandler = require("./handlers/messages").RiddletMessage;
      messageHandler(io, socket, message, sockets, messages, code, serverInfo);
    });
    console.log(sockets.length)
  });

  setInterval(function() {
    io.emit("version", serverInfo.version);
  }, 60000);
}

exports.Riddlet = Riddlet
