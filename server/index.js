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

  var serverInfo = { version: "6", title: "Test Server", rooms: ["/"], maxcharlen: parseInt(process.env.maxcharlen) || 500 };

  io.on("connection", socket => {
    console.log("connection")
    socket.emit("serverinfo", serverInfo);
    socket.on("identification", function(token) {
      require("./handlers/auth").RiddletIdentification(token, io, socket, sockets, messages, code, serverInfo);
    });

    socket.on("noid", function() {
      console.log("new user");
      var x = makeid(15);
      console.log("made id");
      socket.name = x;
      console.log("set name");
      var colorChoice = colors[Math.floor(Math.random() * colors.length)];
      console.log("set color");
      token = jwt.sign({ name: socket.name, color: colorChoice }, code);
      console.log("created token");
      socket.emit("identification", {
        id: x,
        color: colorChoice,
        token: token
      });
      console.log("sent identification");
      socket.emit("messagelist", messages);
      socket.emit("message", {
        id: String(Date.now()),
        client: "Server",
        color: "red",
        room: "#all",
        data: "Welcome!"
      });
      socket.emit("version", serverInfo.version);
      socket.join("#default");
    });
    socket.on("disconnect", function() {
      sockets.splice(sockets.indexOf(socket), 1);
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