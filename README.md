# MP3 Streamer

Mobile Web Music Player Made of HTML5, CSS3, Bootstrap, Backbone.js in frontend and Node.js/Express.js in the backend.

Checkout the demo: [107.191.53.111:3000](http://107.191.53.111:3000)
Use username "test" and password "test123" to login.

To use, first clone this respoitory,

```shell
git clone https://github.com/frankdai/MP3-Streamer.git
cd MP3-Streamer
```

Then install the necessary dependencies (you need to install node.js in your system) 

```shell
npm install
mkdir songs
```

Copy your songs to the /songs folder and enter 

```shell
npm start
```

All set. You can visit [localhost:3000](http://localhost:3000) to listen to your favorite music. If you are operating on a server, you can point your mobile browser to http://your-ip-address:3000 for listening music on-the-go

### Known Issue

* It often fail to correctly render ID3 tags for CJK characters. It has to do with encoding problems.
* In debian/ubuntu system, the 'npm start' command might fail because you haven't install nodejs-legacy. You can use 'nodejs index.js' as alternative command
* Please do not include sub-folder in the /songs directory. The directory scan hasn't implemented yet recursive file reading. Will be done in the future. 
* If you add songs while the server is running, please stop the server firstly by ctrl+c and restart the service. An refresh function will be updated in future.  
