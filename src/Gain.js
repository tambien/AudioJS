/*
 * GAIN
 *
 * @input 
 * input 0 = audio
 * input 1 = gain param
 * 
 * @output
 * output 0 = audio
 * 
 */
AUDIO.Gain = AUDIO.Unit.extend({

	name : "Gain",

	initialize : function(attributes, options) {
		this.superInit(attributes, options);
		//create the gain node
		this.gain = AUDIO.context.createGainNode();
		//set the second input is the output[0] gain param
		this.input[1] = this.output[0].gain;
		//make the connections
		//input0->gain->output0
		this.input[0].connect(this.gain);
		this.gain.connect(this.output[0]);
		var self = this;
		//make the view
		this.view = new AUDIO.Gain.View({
			model : this
		});
		//callbacks for setting the gain
		this.on("change:mute", this.changeMute)
		this.on("change:gain", this.changeGain)
	},
	validate : function(attrs) {
		if(attrs.gain < 0) {
			return "gain cannot be set below 0";
		}
	},
	defaults : {
		"gain" : 1,
		"mute" : false,
	},
	//the gain
	gain : AUDIO.context.createGainNode(),
	//callbacks for model changes
	changeGain : function(model) {
		var targetGain = model.get("gain");
		//5ms ramp
		var muted = model.get("mute");
		if(!muted) {
			var rampTime = .005;
			var now = AUDIO.context.currentTime;
			var gain = model.gain.gain
			var currentGain = gain.value;
			//change the gain with a ramp so there is no click
			gain.setValueAtTime(currentGain, now);
			gain.linearRampToValueAtTime(targetGain, now + rampTime);
		}
	},
	changeMute : function(model) {
		var muted = model.get("mute");
		//5ms ramp
		var rampTime = .005;
		var now = AUDIO.context.currentTime;
		var gain = model.gain.gain
		var currentGain = gain.value;
		gain.setValueAtTime(currentGain, now);
		if(muted) {
			gain.linearRampToValueAtTime(0, now + rampTime);
		} else {
			gain.linearRampToValueAtTime(model.get("gain"), now + rampTime);
		}
	}
});

/*
 * GAIN VIEW
 */
AUDIO.Gain.View = AUDIO.Unit.View.extend({

	className : "gainView halfUnit blackBackground",

	events : {
		"slide" : "sliderChanged",
		"click #gainMuteCheck" : "muteButtonToggle"
	},

	template : _.template("<span class='gainIndicator whiteFont'>0</span><div class='gainControl'><div class='gainSlider'></div><canvas class='gainMeter'></canvas></div><div class='gainMute'><input type='checkbox' id='gainMuteCheck'/><label for='gainMuteCheck'>MUTE</label></div>"),

	initialize : function() {
		this.superInit();
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
		this.$mute = this.$el.find("#gainMuteCheck");
		this.$canvas = this.$el.find(".gainMeter");
		this.context = this.$canvas[0].getContext('2d');
		//this.context.canvas.height = this.$el.height();
		//this.context.canvas.width = this.$el.width();
		//make the level meter
		this.setupMeters();
	},
	setupMeters : function() {
		//add a panner node to force upmixing from mono to stereo
		this.panner = AUDIO.context.createPanner(),
		//create the splitter for the two channels
		this.splitter = AUDIO.context.createChannelSplitter();
		//connect the nodes
		this.model.gain.connect(this.panner);
		this.panner.connect(this.splitter);
		//analyzer nodes for each channel
		this.analyserL = AUDIO.context.createAnalyser();
		this.analyserR = AUDIO.context.createAnalyser();
		this.analyserL.smoothingTimeConstant = 0.3;
		this.analyserL.fftSize = 128;
		this.analyserR.smoothingTimeConstant = 0.3;
		this.analyserR.fftSize = 128;
		//connect them to the splitter
		this.splitter.connect(this.analyserL, 0, 0);
		this.splitter.connect(this.analyserR, 1, 0);
		//the javascript nodes
		this.javascriptNode = AUDIO.context.createJavaScriptNode(4096, 1, 1);
		//connect to the JS node
		this.analyserL.connect(this.javascriptNode);
		this.analyserR.connect(this.javascriptNode);
		this.javascriptNode.connect(AUDIO.context.destination);

		//context trickery
		var self = this;
		//the processing callback
		this.javascriptNode.onaudioprocess = function(event) {
			//local references
			var analyserL = self.analyserL;
			var analyserR = self.analyserR;
			var context = self.context;
			//only draw if it's visible
			if(self.model.get("visible")) {
				//drawing stuff
				var height = self.$canvas.height();
				var width = self.$canvas.width();
				self.context.canvas.height = height;
				self.context.canvas.width = width;
				var gradient = self.context.createLinearGradient(0, 0, 0, height);
				gradient.addColorStop(0, "rgb(255, 70, 70)");
				gradient.addColorStop(0.2, "rgb(255, 223, 61)");
				gradient.addColorStop(0.4, "rgb(60, 234, 23)");
				gradient.addColorStop(0.7, "rgb(60, 234, 23)");
				self.context.strokeStyle = gradient;
				var lineWidth = 12;
				self.context.lineWidth = lineWidth;
				self.context.lineCap = 'round';
				//clear the current state
				context.clearRect(0, 0, width, height);
				context.fillStyle = gradient;
				context.rect(0, 0, width, height);
				//first the left channel:
				var arrayL = new Uint8Array(analyserL.frequencyBinCount);
				analyserL.getByteFrequencyData(arrayL);
				//get the peak for the left
				var peakL = 0;
				var length = arrayL.length;
				// get all the frequency amplitudes
				var max = Math.max
				for(var i = 0; i < length; i++) {
					peakL = max(arrayL[i], peakL);
				}
				//scale the value to the correct range
				peakL = (peakL / 255) * height;
				//draw the line
				if(peakL > 0) {
					context.beginPath();
					context.moveTo(width / 4, height - lineWidth / 2);
					context.lineTo(width / 4, height - peakL + lineWidth / 2);
					context.stroke();
				}
				//and then the right channel
				var arrayR = new Uint8Array(analyserR.frequencyBinCount);
				analyserR.getByteFrequencyData(arrayR);
				//get the peak for the left
				var peakR = 0;
				length = arrayR.length;
				// get all the frequency amplitudes
				for(var i = 0; i < length; i++) {
					peakR = max(arrayR[i], peakR);
				}
				//scale the value to the correct range
				peakR = (peakR / 255) * height;
				//draw the gain
				if(peakR > 0) {
					context.beginPath();
					context.moveTo(3 * width / 4, height - lineWidth / 2);
					context.lineTo(3 * width / 4, height - peakR + lineWidth / 2);
					context.stroke();
				}
			}
		}
	},
	render : function(model) {
		//make the mute
		this.$mute.button({
			label : "MUTE"
		});
		//make the slider
		var sliderheight = this.$canvas.height();
		this.$fader.slider({
			orientation : "vertical",
			min : 0,
			max : 112,
			animate : "fast"
		});
		//fix the slider height
		this.$fader.height(sliderheight);
		//setup the canvas
		//set the gain
		var gain = model.get("gain");
		//show the dB value
		var db = 10 * (Math.log(gain) / Math.LN10);
		this.$number.html(db.toFixed(1));
		//position the slider
		var val = AUDIO.Util.scaleExp(gain*1000000, 1, 1000000, 1, 100);
		//var scale = 0.11512925464970229
		//var val = (Math.log(gain * 100) - 4.605170185988092) / scale;
		this.$fader.slider("value", val);
		//set the mute button
		if(model.get("mute")) {
			this.$mute[0].checked = true;
			this.$mute.button("refresh");
		} else {
			this.$mute[0].checked = false;
			this.$mute.button("refresh");
		}
		//return this
		return this;
	},
	//update the model when the value has changed
	sliderChanged : function(event, slider) {
		var initial = slider.value;
		//scale it logarithmically
		var val = AUDIO.Util.scaleLog(initial, 0, 100, 1, 1000000);
		val /= 1000000;		
		this.model.set({
			gain : val
		}, {
			silent : false
		});
	},
	//whenever the mute button is clicked
	muteButtonToggle : function(event) {
		this.model.set({
			mute : event.target.checked
		}, {
			silent : false
		});
	},
})