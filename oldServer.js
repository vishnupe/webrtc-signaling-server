var os = require('os');
var static = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new(static.Server)();
var app = http.createServer(function (req, res) {
  fileServer.serve(req, res);
}).listen(process.env.PORT || 2013);

var io = socketIO.listen(app);
io.sockets.on('connection', function (socket){
	console.log('client connected>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>.');
    // convenience function to log server messages on the client
    function log(){
		var array = [">>> Message from server:"];
        array.push.apply(array, arguments);
	    socket.emit('log', array);
	}

	socket.on('create or join', function (room) {
        log('Request to create or join room ' + room);

		var numClients = findClientsSocket(room).length;
		log('Room ' + room + ' has ' + numClients + ' client(s)');

		if (numClients === 0){
			socket.join(room);
            socket.emit('created', room, socket.id);
            socket.on('message', function (message) {
                socket.broadcast.to(room).emit('message', message);
            });

		} else if (numClients == 1) {
			socket.join(room);
            socket.emit('joined', room, socket.id);
            io.sockets.in(room).emit('ready');
            socket.on('message', function (message) {
                socket.broadcast.to(room).emit('message', message);
            });

		} else { // max two clients
			socket.emit('full', room);
		}
	});

    socket.on('ipaddr', function () {
        var ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].forEach(function (details) {
                if (details.family=='IPv4' && details.address != '127.0.0.1') {
                    socket.emit('ipaddr', details.address);
                }
          });
        }
    });

});
function findClientsSocket(roomId, namespace) {
    var res = []
    // the default namespace is "/"
    , ns = io.of(namespace ||"/");

    if (ns) {
        for (var id in ns.connected) {
            if(roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId);
                if(index !== -1) {
                    res.push(ns.connected[id]);
                }
            } else {
                res.push(ns.connected[id]);
            }
        }
    }
    return res;
}

