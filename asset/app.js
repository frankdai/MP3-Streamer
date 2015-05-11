var streamer={};
$.getJSON('/getsongs',function(data){
	if (!data.length) {return;}
	//ultility
	function getRandomInt(min, max) {
  		return Math.floor(Math.random() * (max - min)) + min;
	}
	var player=document.getElementById('player');
	//Song,Library MVC
	var Song=Backbone.Model.extend({
		play:function(){
			var span=$('#play .play span')
			span.removeClass('glyphicon-play').addClass('glyphicon-pause');
			if (player.getAttribute('src')!==this.get('file')) {
				player.src=this.get('file')
			}
			player.play();
		},
		pause:function(){
			var span=$('#play .play span')
			span.addClass('glyphicon-play').removeClass('glyphicon-pause');
			player.pause();
		},
		updateInfo:function(){
			var artist=$('#song-info .artist span');
			var title=$('#song-info .title span');
			var album=$('#song-info .album span');
			artist.text(this.get('artist'));
			title.text(this.get('title'));
			album.text(this.get('album'));
		}
	});
	var Library = Backbone.Collection.extend({
  		model: Song,
	});
	var lib=new Library(data);
	var SongView = Backbone.View.extend({
		tagName: "li",
		className:'list',
	  	template: _.template('<div class="name"><%= title %></div><div class="info"><%= artist %> - <%= album %></div><div class="status"></div>'),
	  	render: function() {
	    	this.$el.html(this.template(this.model.attributes));
	    	return this;
	  	}
	}); 
	var musicLibrary=function(collection){
		var wrapper=$('#songlist');
		var ul=document.createElement('ul');
		ul.className="playlist";
		var html='';
		collection.each(function(model,index){
			var songView=new SongView({model:model});
			songView.$el.click(function(){
				currentSong.set({'current':index,'list':collection.models});
			});
			ul.appendChild(songView.render().el);
		});
		wrapper.html('').append(ul);
	}
	musicLibrary(lib,'playlist');
	//song playing model
	var CurrentSong=Backbone.Model.extend({
		defaults:{
			current:0,
			random:false,
			playing:true,
			list:lib.models
		},
		initialize:function(){
			this.play();
		},
		prev:function(){
			var current=this.get('current');
			var target=current-1;
			if (target<0){
				target=this.get('list').length-1;
			}
			return target;
		},
		next:function(){
			var current=this.get('current');
			var target=current+1;
			if (target>=this.get('list').length){
				target=0
			}
			return target;
		},
		play:function(){
			var model=this.get('list')[this.get('current')];
			this.set('playing',true);
			model.play();
			model.updateInfo();
		},
		pause:function(){
			var model=this.get('list')[this.get('current')];
			this.set('playing',false);
			model.pause();
		}
	});
	var currentSong=new CurrentSong();
	currentSong.on('change:current',function(){
		this.play();
	},currentSong);
	currentSong.on('change:playing',function(){
		var playing=this.get('playing');
		if (playing) {
			this.play()
		} else {
			this.pause()
		}
	},currentSong);
	currentSong.on('change:list',function(){
		this.play();
	},currentSong);
	var controlSong=function(type){
		var number;
		if (type==='next') {
			number=currentSong.next();
		}
		if (type==='prev') {
			number=currentSong.prev();
		}
		if (currentSong.get('random')) {
			number=getRandomInt(0,currentSong.get('list').length-1);
		}
		currentSong.set('current',number);
	}
	//shuffle the song list
	var playModel=function(model){
		if (model==='random') {
			currentSong.set('random',true);
		} 
		else if (model==='one') {
			currentSong.set('singleRepeat',true);
		}
		else {
			currentSong.set({'singleRepeat':false,'random':false});
		}
	}
	//artist MVC
	var ArtistModel=Backbone.Model.extend();
	var ArtistView=Backbone.View.extend({
		tagName:'li',
		className:'list',
		events:{
			'click':'showAlbum'
		},
		showAlbum:function(){
			var name=this.model.get('model').cid;
			router.navigate('album/'+name,{trigger:true});
		},
		render:function(){
			this.$el.text(this.model.get('name'));
			return this;
		}
	});
	var allArtist=function(collection) {
		var wrapper=$('#songlist');
		var all=_.uniq(collection.pluck('artist'));
		var ul=$('<ul class="artist-list"></ul>');
		all=_.sortBy(all,function(num){return num});
		all.forEach(function(item){
			var artistModel=new ArtistModel({
				'name':item,
				'model':collection.findWhere({'artist':item}),
			});
			var artistView=new ArtistView({model:artistModel});
			ul.append(artistView.render().el)
		});
		wrapper.html('').append(ul);
	};
	//album MVC
	var AlbumModel=Backbone.Model.extend();
	var AlbumView=Backbone.View.extend({
		tagName:'li',
		className:'list',
		events:{
			'click':'showSongs'
		},
		showSongs:function(){
			var name=this.model.get('model').cid;
			router.navigate('album/songs/'+name,{trigger:true});
		},
		template: _.template('<div class="name"><%= artist %></div><div class="info"><%= album %></div>'),
		render:function(){
			this.$el.html(this.template({"artist":this.model.get('name'),"album":this.model.get('model').get('artist')}))
			return this;
		}
	});
	var allAlbum=function(collection) {
		var wrapper=$('#songlist');
		var all=_.uniq(collection.pluck('album'));
		var ul=$('<ul class="album-list"></ul>');
		all=_.sortBy(all,function(num){return num});
		all.forEach(function(item){
			var albumModel=new AlbumModel({
				'name':item,
				'model':collection.findWhere({'album':item}),
			});
			var albumView=new AlbumView({model:albumModel});
			ul.append(albumView.render().el);
		});
		wrapper.html('').append(ul);
	};
	//router
	var Router=Backbone.Router.extend({
		routes: {
			'library':'library',
			'album':'album',
			'artist':'artist',
			'album/:cid':'renderAlbum',
			'album/songs/:cid':'renderSongs',
		},
		library:function(){
			musicLibrary(lib);
		},
		artist:function(){
			allArtist(lib);
		},
		album:function(){
			allAlbum(lib);
		},
		renderAlbum:function(cid){
			var artist=lib.get(cid);
			var songs=lib.filter(function(model){
				return model.get('artist')==artist.get('artist');
			})
			var list=new Backbone.Collection(songs);
			allAlbum(list);
		},
		renderSongs:function(cid){
			var album=lib.get(cid);
			var songs=lib.filter(function(model){
				return model.get('album')==album.get('album')&&model.get('artist')==album.get('artist');
			})
			var list=new Backbone.Collection(songs);
			musicLibrary(list);
		}
	});
	var router=new Router();
	Backbone.history.start();
	//export function for debug purpose
	streamer.collection=lib;
	streamer.order=playModel;
	streamer.control=controlSong;
	streamer.current=currentSong;
	streamer.router=router;
});

//Put the player manupulation code outside of MVC logic
window.addEventListener('load',function(){
	var player=document.getElementById('player');
	var progress=$('.progress .progress-bar');
	var totalTime=$('.play-time .duration');
	var currentTime=$('.play-time .current');
	var prev=$('.controller .prev');
	var next=$('.controller .next');
	var play=$('.controller .play');
	var model=$('.play-model');
	var clicks=0;
	var formatTime=function(seconds) {
		var min=Math.floor(seconds/60);
		var sec=Math.floor(seconds%60);
		min>9?min=min:min='0'+min;
		sec>9?sec=sec:sec='0'+sec;
		return min+':'+sec;
	};
	var timer;
	var repeatFlag;
	player.addEventListener('play',function(){
		timer=window.setInterval(function(){
			var percent=Math.ceil(player.currentTime/player.duration*100)+'%';
			progress.css('width',percent);
			currentTime.text(formatTime(player.currentTime));
		},1000)
	});
	player.addEventListener('loadedmetadata',function(){
		totalTime.text(formatTime(player.duration));
	});
	player.addEventListener('ended',function(){
		window.clearInterval(timer);
		if (!repeatFlag) {
			streamer.control('next');
		} else {
			player.loop=true;
		}
	});
	prev.on('click',function(){
		if (!repeatFlag) {
			streamer.control('prev');
		}
	});
	next.on('click',function(){
		if (!repeatFlag) {
			streamer.control('next');
		}
	});
	play.on('click',function(){
		var $this=$(this);
		$this.toggleClass('paused');
		if ($this.hasClass('paused')){
			streamer.current.set('playing',false);
		} else {
			streamer.current.set('playing',true);
		}
	})
	model.click(function(event){
		var $this=$(this);
		var icon=$this.find('span').eq(0);
		var text=$this.find('span').eq(1);
		switch (clicks) {
			case 0:
			streamer.order('one');
			icon.attr('class','glyphicon glyphicon-repeat');
			player.loop=true;
			repeatFlag=true;
			clicks++;
			break;
			case 1:
			streamer.order('random');
			icon.attr('class','glyphicon glyphicon-random');
			text.text('Shuffle');
			player.loop=false;
			repeatFlag=false;
			clicks++
			break;
			case 2:
			streamer.order();
			icon.attr('class','glyphicon glyphicon-refresh');
			text.text('All')
			clicks=0
			break;
			default:
			return;
		}
	});
	var scrollText=function(){
		var title=$('#song-info .title');
		var span=title.find('span');
		var reset=function(){
			title.css({'text-indent':0,'transition':'none'});
			title.off('transitionend',reset);
		}
		if (span.width()>title.width()) {
			title.css({'text-indent':0-(span.width()-title.width())*1.3+'px','transition':'all 2s linear'});
		}
		title.on('transitionend',reset)
	}
	window.setInterval(scrollText,4000);
//here goes misc controls for non-essential
	var nav=$('nav.nav ul li');
	nav.each(function(index){
		$(this).click(function(){
			nav.removeClass('active').eq(index).addClass('active');
		})
	});
})
