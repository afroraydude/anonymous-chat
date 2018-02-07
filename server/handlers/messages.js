
exports.RiddletMessage = RiddletMessage

var Realm = require("realm");
var FastRateLimit = require("fast-ratelimit").FastRateLimit;
var jwt = require("jsonwebtoken");
var io, socket, code, serverInfo;
require("dotenv").config();

const MessageSchema = {
  name: "Message",
  properties: {
    client: "string",
    color: "string",
    room: "string",
    data: "string"
  }
};

var messageLimiter = new FastRateLimit({
  threshold: 5, // available tokens over timespan
  ttl: 5 // time-to-live value of token bucket (in seconds)
});

function makeid(chars) {
  var len = chars || 15;
  var text = "";
  var possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < len; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function RiddletMessage(rio, rsocket, message, sockets, messages, rcode, rserverInfo) {
  io = rio;
  socket = rsocket;
  code = rcode;
  serverInfo = rserverInfo;

  var maxmsg = process.env.maxmsg || 15;
  if (messages.length > maxmsg) {
    messages.shift();
  }

  /** TODO: encrypted sending and recievingh
      var xx = crypto.createDecipher(algorithm,socket.crypto);
      var yy = xx.update(message.data, 'hex', 'utf8');
      message.data = yy;
    */

  if (message.data.startsWith("/join")) {
    console.log("handled join");
    JoinMessage(message);
  } else if (message.data.startsWith("/leave")) {
    console.log("handled leave");
    LeaveMessage(message);
  } else {
    console.log("handled normal message");
    NormalMessage(message);
  }
}

function NormalMessage(message) {
  var decoded;
  try {
    decoded = jwt.verify(message.token, code);
    console.log("MessageHandler was able to decode message");
    let realm = new Realm({ schema: [MessageSchema] });
    realm.write(() => {
      let x = realm.create("Message", { client: decoded.name || crypto
            .createHash("md4")
            .update(socket.id)
            .digest("hex"), color: decoded.color || "black", room: message.room || "#default", data: message.data || "" });
    });
    var namespace = decoded.name;
    if (process.env.ratelimit === "true") {
      messageLimiter
        .consume(namespace)
        .then(() => {
          if (message.data !== " " && message.data.length > 0 && message.data.length <= serverInfo.maxcharlen) {
            message.client = decoded.name;
            message.token = null;
            message.color = decoded.color;
            io.emit("message", message);
            messages.push(message);
          } else {
            socket.emit("message", {
              id: String(Date.now()),
              client: "Server",
              color: "red",
              room: "#all",
              data:
                "Message is too long, the server did not send it. Contact the server admin to change the server message max character length ('maxcharlen')"
            });
          }
        })
        .catch(() => {
          socket.emit("message", {
            id: String(Date.now()),
            client: "Server",
            color: "red",
            room: "#all",
            data:
              "You have been ratelimited, please wait 5 seconds before messaging again"
          });
        });
    } else {
      if (message.data !== " " && message.data.length > 0 && message.data.length <= serverInfo.maxcharlen) {
        message.client = decoded.name;
        message.color = decoded.color;
        message.token = null;
        io.emit("message", message);
        messages.push(message);
      } else {
        socket.emit("message", {
          id: String(Date.now()),
          client: "Server",
          color: "red",
          room: "#all",
          data:
            "Message is too long, the server did not send it. Contact the server admin to change the server message max character length ('maxcharlen')"
        });
      }
    }
    console.log("processed a message");
    //socket.emit("message", {id: String(Date.now()), client: "Server", color: "red", room: "#all", data: "Message not sent, you are being ratelimited"})
  } catch (err) {
    require('./auth').RiddletReIdentify(io, socket, sockets, messages, code, serverInfo)
  }
}

function JoinMessage(message) {
  var room = message.data.split(" ")[1];
  if (room.startsWith("#")) {
    socket.emit("join", room);
    socket.join(room);
    socket.emit("message", {
      id: String(Date.now()),
      client: "Server",
      color: "red",
      room: "#all",
      data: `You have joined the ${room} room, type '/switch ${room}' to switch to that room`
    });
  } else {
    socket.emit("message", {
      id: String(Date.now()),
      client: "Server",
      color: "red",
      room: "#all",
      data: 'Rooms must start with the "#" sign (ex: #default)'
    });
  }
}

function LeaveMessage(message) {
  var room = message.data.split(" ")[1];
  if (room.startsWith("#")) {
    socket.emit("leave", room);
    socket.leave(room);
    socket.emit("message", {
      id: String(Date.now()),
      client: "Server",
      color: "red",
      room: "#all",
      data: `You have left the ${room} room, you have now been switched into another room`
    });
  } else {
    socket.emit("message", {
      id: String(Date.now()),
      client: "Server",
      color: "red",
      room: "#all",
      data: 'Rooms must start with the "#" sign (ex: #default)'
    });
  }
}