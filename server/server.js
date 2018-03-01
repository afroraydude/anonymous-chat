/**
 * OPTIONAL STUFF AKA EXTRA ADAPTERS
 */

var http = require('http');

app = http.createServer();

var riddlet = require("./index").Riddlet()

const port = process.env.port || 8080;
app.listen(port);
console.log("listening on port ", port);

process.on("uncaughtException", function(err) {
  console.log("Caught exception: ", err);
});