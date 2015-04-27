var $player=$('#player');
$.getJSON('/getsongs',function(data){
	var Song=Backbone.Model.extend({
		play:function(){
			$player.attr('src',this.attributes.file);
			$player[0].play();
		},
	});
	var Library = Backbone.Collection.extend({
  		model: Song,
	});
	var lib=new Library;
	lib.add(data);
	var SongView = Backbone.View.extend({
		tagName: "li",
		className:'list',
	  	events:{
	  		'click':'play'
	  	},
	  	play:function(){
	  		var number=lib.models.indexOf(this.model);
	  		currentSong=new CurrentSong({current:number});
	  	},
	  	template: _.template("Artist: <%= artist %>,Title:<%= title %>,Ablum:<%= album %>"),
	  	render: function() {
	    	this.$el.html(this.template(this.model.attributes));
	    	return this;
	  	}
	}); 
	var CurrentSong=Backbone.Model.extend({
		defaults:{
			current:0,
			random:false,
			repeat:true,
			singleRepeat:false,
		},
		initialize:function(){
			lib.models[this.attributes.current].play();
		},
		prev:function(){
			var current=this.attributes.current;
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
			var current=this.attributes.current;
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
		currentSong=new CurrentSong({current:number});
	});
	$('#play .prev').on('click',function(){
		var number=currentSong.prev();
		currentSong=new CurrentSong({current:number});
	});
	$('#play .play').on('click',function(){
		var $this=$(this);
		$this.toggleClass('paused');
		if ($this.hasClass('paused')){
			$player[0].pause();
		} else {
			$player[0].play();
		}
	});
	$player.on('ended',function(event){
		var number=currentSong.next();
		currentSong=new CurrentSong({current:number});
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
});
