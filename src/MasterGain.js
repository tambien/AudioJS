/*
 * MASTER GAIN
 *
 * this node connects to the output
 * all other nodes connect to it
 */
AUDIO.MasterGain = AUDIO.Gain.extend({
	
	name : "MasterGain",

	initialize : function(attributes, options) {
		this.superInit(attributes, options);
		//make the connections
		this.input.connect(this.gain);
		this.gain.connect(this.output);
		//connects to the main
		this.output.connect(AUDIO.context.destination);
		//has a stereo gain view
		this.view = new AUDIO.Gain.View({
			model : this
		});
		//callbacks for setting the gain
		this.on("change:mute", this.changeMute)
		this.on("change:gain", this.changeGain)
	},
	defaults : {
		"gain" : 1,
		"mute": false,
		"title": "Master Gain"
	},
});

/*
 * MASTER GAIN VIEW
 */
AUDIO.MasterGain.View = AUDIO.Gain.View.extend({
	
	className : "masterGainView",

	events : {
		"slide" : "sliderChanged",
		"click #masterGainMuteCheck" : "muteButtonToggle"
	},

	template : _.template("<span class='gainIndicator whiteFont'>0</span><div class='gainControl'><div class='gainSlider'></div><canvas class='gainMeter'></canvas></div><div class='gainMute'><input type='checkbox' id='masterGainMuteCheck'/><label for='masterGainMuteCheck'>MUTE</label></div>"),

	initialize : function() {
		this.superInit();
		//add it to master for now
		this.$el.appendTo($("#masterGain"));
		//fix the height when resized
		$(window).bind("resize", _.bind(this.resizeUI, this));
		//setup UI
		this.setupUI();
		//render the view for the first time
		this.render(this.model);
	},
	setupUI : function() {
		//setup the template
		this.$el.append(this.template(this.model.toJSON()));
		//gain controls
		this.$fader = this.$el.find(".gainSlider");
		this.$number = this.$el.find(".gainIndicator");
		this.$mute = this.$el.find("#masterGainMuteCheck");
		this.$canvas = this.$el.find(".gainMeter");
		this.context = this.$canvas[0].getContext('2d');
		this.context.canvas.height = this.$el.height();
		this.context.canvas.width = this.$el.width();
		//make the level meter
		this.setupMeters();
	},
	//called when the UI needs resizing
	resizeUI : function(){
		this.$fader.height(this.$canvas.height());
	},
	//overwrite this function so that it's not dropped in the container by default
	changeVisible : function(){
		
	}, 
	//whenever the mute button is clicked
	muteButtonToggle : function(event) {
		event.preventDefault();
		console.log(this.model.id);
		this.model.set({
			mute : this.$mute[0].checked
		}, {
			silent : false
		});
	},
	//whenever the mute button is clicked
	muteButtonToggle : function(event) {
		console.log(this.model.id);
		this.model.set({
			mute : event.target.checked
		}, {
			silent : false
		});
	},
})