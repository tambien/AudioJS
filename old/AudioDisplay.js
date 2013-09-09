/*
 * DISPLAY
 *
 * displays take an audio param and draw it on the update loop
 */
AUDIO.Display = {

};

/*
 * DISPLAY 
 *
 * main class from which other views are derived.
 * binds to an "attribute"
 * updated with the draw loop
 */
AUDIO.Display.View = Backbone.View.extend({

	tagName : "canvas",

	className : "display",

	//sets the size of the canvas
	//by default it just fill whatever size it's got
	setupSize : function() {
		
	},
	superInit : function() {
		//add it to the displays list
		AUDIO.displays.push(this);
		//get the drawing context
		this.context = this.el.getContext('2d');
		this.setupSize();
		//the param
		this.parameter = this.options.paramater;
		//set the container
		this.$container = this.options.container
		this.$container.append(this.$el);
	},
	initialize : function(){
		this.superInit();
	},
	//gets the value of the audio param
	getValue : function(){
		return this.parameter.value;
	},
	//every display has a draw function
	draw : function() {

	}
});

/*
 * METER DISPLAY
 *
 * level meter to show the current gain
 */
AUDIO.Display.Meter = AUDIO.Display.View.extend({

	className : "levelMeter",

	initialize : function() {
		this.superInit();
	},
	setupSize : function(){
		this.$el.addClass("topLeft")
		var w = this.$el.width(AUDIO.Interface.halfUnit);
		var h = this.$el.height(AUDIO.Interface.channelHeight);
		this.context.canvas.width = AUDIO.Interface.halfUnit;
		this.context.canvas.height = AUDIO.Interface.channelHeight;
		console.log(this.context);
	},
	draw : function() {
		var value = this.getValue();
		
	}
});

