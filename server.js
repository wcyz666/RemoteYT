var express = require('express');
var app = express();
var api = require( './routes/api' );
var bodyParser = require('body-parser');
var utils = require('./my_modules/utils');
var path = require('path');
var roomList = {};


var currentRooms = [];


app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.use( express.static( __dirname + '/public' ) );

app.all('/', function(req, res, next){
    var room = utils.getNewRoom(currentRooms);
    res.redirect("/session/" + room);
});

/* GET users listing. */
app.all('/session/:id([0-9]+)', function(req, res) {
    currentRooms.push(req.params.id);
    res.sendFile( path.resolve(__dirname + '/views/index.html') );
});


app.use( '/api', api );



app.use(function (req, res) {
    res.status(404);
    res.send("Not Found");
});

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port)

});
var io = require( 'socket.io' )( server );
io.on( 'connection', function( socket ) {
    console.log( 'New user connected' );
    socket.on('control', function (data) {
        console.log(data);
        if (data.action == "clearall")
            roomList = {};
        socket.broadcast.to(data["room"]).emit('control', data);
    });

    socket.on('add', function (data) {
        console.log(data);
        roomList[data.room] = data.playlist;
        socket.broadcast.to(data["room"]).emit('add', data);
    });

    socket.on('remove', function (data) {
        console.log(data);
        roomList[data.room] = data.playlist;
        socket.broadcast.to(data["room"]).emit('remove', data);
    });

    socket.on("subscribe", function(data) {
        socket.join(data);
        console.log(io.sockets.adapter.rooms[data].length);
        socket.emit("suback", {"clientCount": io.sockets.adapter.rooms[data]});
        console.log("subscribe", data);
    });

    socket.on("synclist", function(data){
        roomList[data.room] = data.playlist;
        socket.broadcast.to(data.room).emit("synclist", data.playlist);
        console.log("aynclist", data);
    });

    socket.on("sync", function(data){
        socket.emit("synclist", roomList[data.room]);
        console.log("aync", data);
    });
} );