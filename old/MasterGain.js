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
		this.input[0].connect(this.gain);
		this.gain.connect(this.output[0]);
		//connects to the main
		this.output[0].connect(AUDIO.context.destination);
		//has a stereo gain view
		this.view = new AUDIO.Gain.View({
			model : this
		});
		this.masterView = new AUDIO.MasterGain.View({
			model : this
		});
		//callbacks for setting the gain
		this.on("change:mute", this.changeMute)
		this.on("change:gain", this.changeGain)
	},
	defaults : {
		"gain" : 1,
		"mute" : false,
		"title" : "Master Gain"
	},
});

/*
 * MASTER GAIN VIEW
 * 
 * same as gain but with no Mute button and it's always visible
 */
AUDIO.MasterGain.View = AUDIO.Gain.View.extend({

	className : "masterGainView",
	
	template : _.template("<span class='gainIndicator whiteFont'>0</span><div class='gainControl'><div class='gainSlider'></div><canvas class='gainMeter'></canvas></div>"),

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
		this.javascriptNode = AUDIO.context.createJavaScriptNode(2048, 1, 1);
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
			//drawing stuff
			//TODO cache the height and width
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
	},
	render : function(model) {
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
		//return this
		return this;
	},
	//called when the UI needs resizing
	resizeUI : function() {
		this.$fader.height(this.$canvas.height());
	},
	//overwrite this function so that it's not dropped in the container by default
	changeVisible : function() {

	},
})