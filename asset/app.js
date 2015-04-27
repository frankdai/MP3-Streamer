var streamer={};
$.getJSON('/getsongs',function(data){
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
	  	template: _.template("Artist: <%= artist %>,Title:<%= title %>,Ablum:<%= album %>"),
	  	render: function() {
	    	this.$el.html(this.template(this.model.attributes));
	    	return this;
	  	}
	}); 
	var PlayList=Backbone.View.extend({
		tagName:'ul',
		className:'playlist',
		initialize:function(){
			$('#songlist').append(this.render().el);
		},
		render:function(){
			var that=this.$el;
			this.collection.models.forEach(function(model){
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
			repeat:true,
			singleRepeat:false,
		},
		initialize:function(){
			var model=lib.models[this.attributes.current]
			model.play();
			model.updateInfo();
		},
		prev:function(){
			var current=this.get('current');
			var target=current-1;
			if (target<0&&this.attributes.repeat){
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
			if (target>=lib.length&&this.attributes.repeat){
				target=0
			}
			if (this.attributes.singleRepeat) {
				target=current;
			}
			return target;
		},
	});
	var currentSong=new CurrentSong();
	$('#play .next').on('click',function(){
		var number=currentSong.next();
		currentSong.set('current',number);
	});
	$('#play .prev').on('click',function(){
		var number=currentSong.prev();
		currentSong.set('current',number);
	});
	$('#play .play').on('click',function(){
		var $this=$(this);
		$this.toggleClass('paused');
		if ($this.hasClass('paused')){
			player.pause();
		} else {
			player.play();
		}
	});
	currentSong.on('change',function(){
		var current=this.get('current');
		var model=lib.models[current];
		model.play();
		model.updateInfo();
	},currentSong);
	streamer.collection=lib;
	streamer.current=currentSong;
	player.addEventListener('ended',function(event){
		var number=currentSong.next();
		currentSong.set('current',number);
	});
	
});
