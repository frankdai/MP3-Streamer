var $player=$('#player');
var songs;
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
	songs=lib;
	var SongView = Backbone.View.extend({
		tagName: "li",
		className:'list',
	  	events:{
	  		'click':'play'
	  	},
	  	play:function(){
	  		this.model.play();
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
});
