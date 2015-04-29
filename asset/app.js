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
			player.src=this.get('file');
			player.play();
		},
		updateInfo:function(){
			var artist=$('#song-info .artist');
			var title=$('#song-info .title');
			var album=$('#song-info .album');
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
	  		currentSong.set('current',number);
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
			lib.models.forEach(function(model){
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
		},
		initialize:function(){
			this.play();
		},
		prev:function(){
			var current=this.get('current');
			var target=current-1;
			if (target<0){
				target=lib.length-1;
			}
			if (this.attributes.singleRepeat) {
				target=current;
			}
			return target;
		},
		next:function(){
			var current=this.get('current');
			var target=current+1;
			if (target>=lib.length){
				target=0
			}
			if (this.attributes.singleRepeat) {
				target=current;
			}
			return target;
		},
		play:function(){
			var model=lib.models[this.get('current')];
			model.play();
			model.updateInfo();
		}
	});
	var currentSong=new CurrentSong();
	currentSong.on('change:current',function(){
		var current=this.get('current');
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
	//export function for debug purpose
	streamer.collection=lib;
	streamer.order=playModel;
	streamer.control=controlSong;
});

//Put the player manupulation code outside of MVC logic
(function($){
	var player=document.getElementById('player');
	var progress=$('.progress .progress-bar');
	var totalTime=$('.play-time .duration');
	var currentTime=$('.play-time .current');
	var prev=$('.controller .prev');
	var next=$('.controller .next');
	var formatTime=function(seconds) {
		var min=Math.floor(seconds/60);
		var sec=Math.floor(seconds%60);
		min>9?min=min:min='0'+min;
		sec>9?sec=sec:sec='0'+sec;
		return min+':'+sec;
	};
	var timer;
	$('#play .play').on('click',function(){
		var $this=$(this);
		var span=$this.find('span');
		$this.toggleClass('paused')
		if ($this.hasClass('paused')){
			span.addClass('glyphicon-play').removeClass('glyphicon-pause');
			player.pause();
		} else {
			span.removeClass('glyphicon-play').addClass('glyphicon-pause');
			player.play();
		}
	});
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
		streamer.control('next');
	});
	prev.on('click',function(){
		streamer.control('prev');
	});
	next.on('click',function(){
		streamer.control('next');
	});
})(jQuery);