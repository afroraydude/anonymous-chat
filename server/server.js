http = require('http');
//fs = require('fs');
/*
var httpsoptions = {
  key: fs.readFileSync(process.env.key),
  cert: fs.readFileSync(process.env.cert)
};
*/
require('dotenv').config();
app = http.createServer();
io = require('socket.io')(app);
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var jwt = require("jsonwebtoken");
sockets = [];
messages = [];
var Realm = require('realm');
colors = ["black", "blue", "green", "orange", "sienna", "coral", "purple", "gold", "royalblue", "silver", "olive", "orchid"];
const MessageSchema = {
  name: 'Message',
  properties: {
    client: 'string',
    color: 'string',
    room: 'string',
    data: 'string'
  }
}

var FastRateLimit = require("fast-ratelimit").FastRateLimit;

var messageLimiter = new FastRateLimit({
      threshold : 6, // available tokens over timespan
      ttl       : 60  // time-to-live value of token bucket (in seconds)
});

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
console.log(code)

var serverInfo = {
  version: "5",
  title: "Test Server",
  rooms: ['/'],
  maxcharlen: parseInt(process.env.maxcharlen) || 500
};

io.on('connection', (socket) => {
  socket.emit("serverinfo", "nullbyte");
  socket.on("identification", function(token) {
    var decoded;
    try {
      decoded = jwt.verify(token, code);
    } catch (err) {
      console.log("Someone tried to connect with invalid token, reasigning token");
    }
    if (decoded) {
      socket.name = decoded.name;
      socket.emit("identification", {
        id: decoded.name,
        color: decoded.color,
        token: jwt.sign(decoded, code)
      });
      socket.emit("messagelist", messages);
      socket.emit("message", {
        id: String(Date.now()),
        client: "Server",
        color: "red",
        room: "#all",
        data: "Welcome!"
      });
      socket.emit("version", serverInfo.version);
    } else {
      socket.name = makeid(15);
      var colorChoice = colors[Math.floor(Math.random() * colors.length)];
      token = jwt.sign({name: socket.name, color: colorChoice}, code)
      socket.emit("identification", {
        id: socket.name,
        color: colorChoice,
        token: token
      });
      socket.emit("messagelist", messages);
      socket.emit("message", {
        id: String(Date.now()),
        client: "Server",
        color: "red",
        room: "#all",
        data: "Welcome!"
      });
      socket.emit("version", serverInfo.version);
    }
    sockets.push(socket);
    socket.join("#default");
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
  })
  socket.on('disconnect', function () {
    sockets.splice(sockets.indexOf(socket), 1);
    console.log('client left');
  });
  socket.on('message', function(message) {
    console.log("got a message");
    var maxmsg = process.env.maxmsg || 15
    if (messages.length > maxmsg) {
      messages.shift();
    }
    /** TODO: encrypted sending and recievingh
      var xx = crypto.createDecipher(algorithm,socket.crypto);
      var yy = xx.update(message.data, 'hex', 'utf8');
      message.data = yy;
    */

    if (message.data.startsWith("/join")) {
      var room = message.data.split(" ")[1];
      if (room.startsWith("#")) {
        socket.emit("join", room);
        socket.join(room);
      } else {
        socket.emit("message", {id: String(Date.now()), client: "Server", color: "red", room: "#all", data: "Rooms must start with the \"#\" sign (ex: #default)"})
      }
    } else {
      var decoded;
      try {
          decoded = jwt.verify(message.token, code)
          let realm = new Realm({schema: [MessageSchema]});
          realm.write(() => {
            let x = realm.create('Message', {
              client: decoded.name || crypto.createHash('md4').update(socket.id).digest("hex"),
              color: decoded.color || "black",
              room: message.room || "#default",
              data: message.data || ""
            });
          });
          var namespace = decoded.token
          messageLimiter.consume(namespace)
              .then(() => {
                  if (message.data !== " " && message.data.length > 0 && message.data.length <= serverInfo.maxcharlen) {
                    message.client = decoded.name;
                    message.color = decoded.color;
                    io.emit("message", message);
                    messages.push(message);
                  } else {
                    socket.emit("message", {id: String(Date.now()), client: "Server", color: "red", room: "#all", data: "Message is too long, the server did not send it. Contact the server admin to change the server message max character length ('maxcharlen')"})
                  }
                }).catch(() => {
                  console.log("Rate limiting");
                })
          console.log("processed a message");
          //socket.emit("message", {id: String(Date.now()), client: "Server", color: "red", room: "#all", data: "Message not sent, you are being ratelimited"})
      } catch(err) {
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
        socket.emit("message", {
          id: String(Date.now()),
          client: "Server",
          color: "red",
          room: "#all",
          data: "Your user data was corrupted, you have been re-registered with new data."
        });
        socket.emit("version", serverInfo.version);
        socket.join("#default");
      }
    }
  });
});

setInterval(function () {
    io.emit("version", serverInfo.version);
}, 60000);

const port = process.env.port || 8080;
app.listen(port);
console.log('listening on port ', port);

process.on('uncaughtException', function (err) {
      console.log('Caught exception: ', err);
});
