/**
 * OPTIONAL STUFF AKA EXTRA ADAPTERS
 */

var http = require('http')

app = http.createServer()

riddlet = require("./index").Riddlet(app)

const port = process.env.port || 8080
app.listen(port)

process.on("uncaughtException", function(err) {
})