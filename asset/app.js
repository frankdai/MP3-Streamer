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
	  	events:{
	  		'click':'play'
	  	},
	  	play:function(){
	  		var number=lib.indexOf(this.model);
	  		currentSong.set({'current':number,'playing':true,'list':lib.models});
	  	},
	  	template: _.template('<div class="name"><%= title %></div><div class="info"><%= artist %> - <%= album %></div><div class="status"></div>'),
	  	render: function() {
	    	this.$el.html(this.template(this.model.attributes));
	    	return this;
	  	}
	}); 
	var PlayList=Backbone.View.extend({
		tagName:'ul',
		className:'playlist',
		initialize:function(){
			$('#songlist').html('').append(this.render().el);
		},
		render:function(){
			var that=this.$el;
			this.collection.forEach(function(model){
				var songView=new SongView({model:model});
				that.append(songView.render().$el);
			});
			return this;
		}
	});
	var playList=new PlayList({collection:lib});
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
			var current=this.get ('current');
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
		this.set('current',0);
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
			number=getRandomInt(0,lib.length-1);
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
	var allArtist=_.uniq(lib.pluck('artist'));
	var ArtistModel=Backbone.Model.extend();
	var ArtistView = Backbone.View.extend({
		tagName: "li",
		className:'list',

	  	events:{
	  		'click':'showSongs'
	  	},
	  	showSongs:function(){
	  		currentSong.set('list',this.model.get('album'))
	  	},

	  	render: function() {
	    	this.$el.text(this.model.get('name'));
	    	return this;
	  	}
	}); 
	var ArtistCollection=Backbone.Collection.extend();
	var artistCollection=new ArtistCollection();
	artistCollection.comparator='name';
	allArtist.forEach(function(artist){
		var artistModel=new ArtistModel({
			name:artist,	
			album:lib.where({artist:artist})
		});
		artistCollection.add(artistModel);
	})
	var ArtistCollectionView=Backbone.View.extend({
		tagName:'ul',
		className:'artist-list',
		render:function(){
			var that=this.$el
			artistCollection.each(function(model){
				var artistView=new ArtistView({model:model});
				that.append(artistView.render().$el);
			})
			return this;
		},
		initialize:function(){
			this.render();
			$('#artist').append(this.el);
		}
	});
	var artistView=new ArtistCollectionView();
	streamer.art=artistCollection;
	//export function for debug purpose
	streamer.collection=lib;
	streamer.order=playModel;
	streamer.control=controlSong;
	streamer.current=currentSong;
});

//Put the player manupulation code outside of MVC logic
(function($){
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
			streamer.control('prev');
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
	function scrollText(){
		var artist=$('#song-info .artist');
		var title=$('#song-info .title');
		var artText=artist.find('span');
		var titleText=title.find('span');
		if (titleText.width()>title.width()) {
			title.animate({'text-indent':title.width()-titleText.width()},2000,function(){
				title.css('text-indent',0);
			})
		}
		if (artText.width()>artist.width()) {
			artist.animate({'text-indent':artist.width()-artText.width()},2000,function(){
				artist.css('text-indent',0);
			})
		}
	}
	window.setInterval(scrollText,4000)
})(jQuery);

//here goes misc controls for non-essential
(function($){
	//nav 
	var nav=$('nav.nav ul li');
	var wrapper=$('.wrapper');
	var width=$(window).width();
	var height=$(window).height();
	var sections=$('.wrapper>section');
	sections.css('width',width).css('height',height-90);
	wrapper.css('height',height-90);
	nav.each(function(index){
		$(this).click(function(){
			wrapper.css({
				'transform':'translateX(-'+width*index+'px)'});
			nav.removeClass('active').eq(index).addClass('active');
		})
	});
})(jQuery)