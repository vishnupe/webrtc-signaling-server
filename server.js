const static = require("node-static");
const http = require("http");
const socketIO = require("socket.io");

const fileServer = new static.Server();
const app = http
  .createServer(function(req, res) {
    fileServer.serve(req, res);
  })
  .listen(process.env.PORT || 2013);

var io = socketIO.listen(app);

io.sockets.on("connection", (socket) => {

  console.log("client connected: ", socket.id);
  socket.emit("connected", socket.id);

  socket.on("create or join", (room) => {

    var currentClients = findClientsSocket(room);
    console.log(currentClients);

    socket.join(room);
    socket.emit("joined", currentClients);
    socket.broadcast.to(room).emit("new_client_joined", socket.id, currentClients.length + 1);

    // socket.on("message", (message) => {
    //   socket.broadcast.to(room).emit("message", message);
    // });
    socket.on('message', (toId, message) => {
      // relay the message to the recipient including the sender's id
      io.to(toId).emit('message', socket.id, message);
    });

    socket.on('disconnect', function () {
        console.log("client disconnected: ", socket.id);
        socket.emit('disconnected', socket.id);
    });

  });

});

function findClientsSocket(roomId, namespace) {
  var res = [],
    // the default namespace is "/"
    ns = io.of(namespace || "/");

  if (ns) {
    for (var id in ns.connected) {
      if (roomId) {
        var index = ns.connected[id].rooms.indexOf(roomId);
        if (index !== -1) {
          res.push(id);
        }
      } else {
        res.push(id);
      }
    }
  }
  return res;
}
