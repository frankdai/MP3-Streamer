var express = require('express');
var app = express();
var id3 = require('id3js');
var fs = require('fs');
var cookieParser = require('cookie-parser')
var crypto=require('crypto');
var bodyParser = require('body-parser')
var sha1sum = function(input){
    return crypto.createHash('sha1').update(input.toString()).digest('hex')
}
var mp3=[];
var user={
  "test":"test123"
}
var urlencodedParser = bodyParser.urlencoded({ extended: false })
app.use(cookieParser());
app.get('/', function (req, res) {
    if (req.cookies.session&&req.cookies.id&&req.cookies.session===sha1sum(user[req.cookies.id])) {
      res.sendFile('index.html',{root: __dirname});
    }
    else {
      res.sendFile('login.html',{root: __dirname});
    }
});
app.use('/songs', express.static('songs'));
app.use('/asset', express.static('asset'));
app.get('/getsongs', function (req, res) {
  if (req.cookies.session
    &&req.cookies.session===sha1sum(user[req.cookies.id])
    ) {
    res.json(mp3);
  } 
});
app.post('/',urlencodedParser, function(req,res){
  var username=req.body.username;
  var password=req.body.password;
  var hash=sha1sum(password);
  if (user[username]&&user[username]===password) {
    res.cookie('session',hash,{maxAge:900000,httpOnly:true});
    res.cookie('id',username,{maxAge:900000,httpOnly:true});
    res.sendFile('index.html',{root: __dirname});
  }
  else {
    res.send("<strong>Access denied</strong>");
  }
});
fs.readdir('./songs',function(err,files){
	if (err) {throw err};
	files.forEach(function(file){
		id3({ file:"./songs/"+file, type: id3.OPEN_LOCAL }, function(err, tags) {
        if (err) {return;}
        else {
          typeof tags.artist=='string'?tags.artist=tags.artist.toLowerCase():tags.artist='unknown';
          typeof tags.title=='string'?tags.title=tags.title.toLowerCase():tags.title='unknown';
          typeof tags.album=='string'?tags.album=tags.album.toLowerCase():tags.album='unknown';
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