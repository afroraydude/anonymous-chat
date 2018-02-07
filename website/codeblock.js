// Setup is very simple, just start by creating the HTTP or HTTPS server
var http = require('http');
app = http.createServer();

// Then integrate Riddlet
require("./index").Riddlet(app)

// All other integrations can go here... Lastly, turn on your server
const port = process.env.port || 8080;
app.listen(port);
console.log("listening on port ", port);