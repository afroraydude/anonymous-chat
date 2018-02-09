var Riddlet = function(app) {
  http = require("http");

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

  var makeid = require('./handlers/util').randtext

  var code = process.env.jwtcode || makeid(25);
  console.log(code);

  var ip = require("ip");

  var serverInfo = { version: "7", title: "Test Server", rooms: ["/"], maxcharlen: parseInt(process.env.maxcharlen) || 500,  ip: ip.address(), logo: process.env.logourl || "https://d30y9cdsu7xlg0.cloudfront.net/png/29558-200.png", users: 0 };

  io.on("connection", socket => {
    console.log("connection")
    socket.emit("serverinfo", serverInfo);
    socket.on("identification", function(token) {
      require("./handlers/auth").RiddletIdentification(token, io, socket, sockets, messages, code, serverInfo);
      socket.didauth = true;
      serverInfo.users = sockets.length
      console.log("user count: " + sockets.length);
    });

    socket.on("noid", function() {
      require("./handlers/auth").RiddletNonIdentification(io, socket, sockets, messages, code, serverInfo);
      socket.didauth = true;
      serverInfo.users = sockets.length
      console.log("user count: "+sockets.length)
    });

    socket.on("disconnect", function() {
      if (socket.didauth) {
        sockets.splice(sockets.indexOf(socket), 1);
      }
      // TODO: User count check if user authenticated before removing
      serverInfo.users = sockets.length;
      console.log("user count: " + sockets.length);
      console.log("client left");
    });
    socket.on("message", function(message) {
      const messageHandler = require("./handlers/messages").RiddletMessage;
      messageHandler(io, socket, message, sockets, messages, code, serverInfo);
    });
  });
  setInterval(function() {
    io.emit("version", serverInfo.version);
  }, 60000);
}

exports.Riddlet = Riddlet
