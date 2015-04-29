var express = require('express');
var app = express();
var id3 = require('id3js');
var fs = require('fs');
var mp3=[];
app.get('/', function (req, res) {
    res.sendFile('index.html',{root: __dirname});
});
app.use('/songs', express.static('songs'));
app.use('/asset', express.static('asset'));
app.get('/getsongs', function (req, res) {
    res.json(mp3);
});
fs.readdir('./songs',function(err,files){
	if (err) {throw err};
	files.forEach(function(file){
		id3({ file:"./songs/"+file, type: id3.OPEN_LOCAL }, function(err, tags) {
        if (err) {return;}
        else {
     			var song={'artist':tags.artist||'unknown','title':tags.title||'unknown','album':tags.album||'unknown','file':"./songs/"+file};
     			mp3.push(song);
        }
		});
	});
});
var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('MP3 Streamer listening at http://%s:%s', host, port);
});