https = require('https');
require('dotenv').config();
app = https.createServer(httpsoptions);
io = require('socket.io',{secure: true})(app);
require('dotenv').config();
var crypto = require('crypto');
sockets = [];
messages = [];
colors = ["black", "blue", "green", "orange", "sienna", "coral", "purple", "gold", "khaki", "royalblue", "silver", "olive", "orchid"];
var serverInfo = {version: "1", title: "Test Server", rooms: ['/']};
io.on('connection', (socket) => {
  var code = crypto.createHash('md4').update(socket.id).digest("hex");
  socket.name = String(x);
  sockets.push(socket);
  var colorChoice = colors[Math.floor(Math.random() * colors.length)];
  socket.emit("identification", {id: x, color: colorChoice});
  socket.emit("messagelist", messages);
  socket.emit("message", {client: "Server", color: "red", data: "Welcome!"});
  socket.emit("version", serverInfo.version);
  socket.emit("serverinfo", serverInfo);
  socket.on('disconnect', function () {
    sockets.splice(sockets.indexOf(socket), 1);
  });
  socket.on('message', function(message) {
    messages.push(message);
    io.emit("message", message);
  });
});
const port = process.env.port || 1234;
app.listen(port);
console.log('listening on port ', port);
