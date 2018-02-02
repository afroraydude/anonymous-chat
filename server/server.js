https = require('https');
fs = require('fs');
require('dotenv').config();
var httpsoptions = {
    key: fs.readFileSync(process.env.key),
    cert: fs.readFileSync(process.env.cert)
};
app = https.createServer(httpsoptions);
io = require('socket.io',{secure: true})(app);
require('dotenv').config();
var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
sockets = [];
messages = [];
var Realm = require('realm');
colors = ["black", "blue", "green", "orange", "sienna", "coral", "purple", "gold", "khaki", "royalblue", "silver", "olive", "orchid"];
const MessageSchema = {
  name: 'Message',
  properties: {
    client: 'string',
    color: 'string',
    data: 'string'
  }
}

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 15; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

var serverInfo = {version: "2", title: "Test Server", rooms: ['/']};

io.on('connection', (socket) => {
  console.log("new socket with id "+socket.id+" has connected and is ready to recieve messages.");
  var x = crypto.createHash('md4').update(socket.id).digest("hex");
  console.log("socket with id "+socket.id+"has been sent it's anonid which is "+x);
  socket.name = String(x);
  socket.crypto = makeid();
  console.log(socket.crypto);
  sockets.push(socket);
  var colorChoice = colors[Math.floor(Math.random() * colors.length)];
  socket.emit("identification", {id: x, color: colorChoice, crypto: socket.crypto});
  socket.emit("messagelist", messages);
  socket.emit("message", {client: "Server", color: "red", data: "Welcome!"});
  socket.emit("version", serverInfo.version);
  socket.emit("serverinfo", serverInfo);
  socket.on('disconnect', function () {
    sockets.splice(sockets.indexOf(socket), 1);
    console.log('client left');
  });
  socket.on('message', function(message) {
    messages.push(message);
    if (messages.length > process.env.maxmsg) {
      messages.shift();
    }
    var xx = crypto.createDecipher(algorithm,socket.crypto);
    var yy = xx.update(message.data, 'hex', 'utf8');
    message.data = yy;
    let realm = new Realm({schema: [MessageSchema]});
    realm.write(() => {
        let x = realm.create('Message', {
            client: message.client,
            color: message.color,
            data: yy
        });
    });
    io.emit("message", message);
    console.log("sent a message");
  });
});

setInterval(function () {
    io.emit("version", serverInfo.version);
}, 60000);

const port = process.env.port || 1234;
app.listen(port);
console.log('listening on port ', port);

process.on('uncaughtException', function (err) {
      console.log('Caught exception: ', err);
});
