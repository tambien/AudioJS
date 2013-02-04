/*
 * METRONOME
 *
 * keeps tempo
 *
 * triggers a callback at subdivisions of 64n
 *
 * units can register to a callback on a particular subdivision (i.e. 1n, 4n, ...., 64n),
 * or on a particular bar and beat in the timeline (i.e. [8,1])
 */

AUDIO.Metronome = Backbone.Model.extend({
	name : "Metronome",

	defaults : {
		//transport attributes
		"beat" : 0,
		"bar" : 0,
		"meter" : [4, 4],
		"bpm" : 120,
		//beat/subdivision
		"2n" : -1,
		"4n" : -1,
		"8n" : -1,
		"16n" : -1,
		//"32n" : 0,
	},

	initialize : function(attributes, options) {
		//create an oscillator at a 64n resolution
		this.clock = AUDIO.context.createOscillator();
		//square wave
		this.clock.type = 1;
		this.phase = 1;
		//the smallest measurement for the metronome
		this.subdivision = 32;
		this.tatum = 0;
		//set bpm
		this.setBPM(this);
		//make the wave watcher
		this.scriptNode = AUDIO.context.createJavaScriptNode(2048, 1, 1);
		//connect it up
		this.clock.connect(this.scriptNode);
		this.scriptNode.connect(AUDIO.context.destination);
		//setup the callback
		this.createScriptCallback();
		//note on for testing
		this.clock.noteOn(0);
		//the amount of delay that's applied to all callbacks
		this.delay = 0.1

		//listen to the changes
		this.on("change:bpm", this.setBPM);
	},
	setBPM : function(model) {
		var bpm = model.get("bpm");
		this.clock.frequency.value = (60 / bpm) * this.subdivision;
	},
	incrementBeat : function(subdivision, time) {
		var count = this.get(subdivision);
		count++;
	},
	//based on a 64th note tick
	tickTatum : function(time) {
		//put a delay on everything to avoid clicks
		time+=this.delay;
		//set the attributes
		var timeSig = this.get("meter");
		var tatum = this.tatum;
		var tatumsPerMeasure = (this.subdivision * timeSig[0]) / timeSig[1];
		//set the subdivisions
		for(var i = 0; i < 4; i++) {
			var sub = Math.pow(2, i + 1);
			var subStr = sub + "n";
			if(tatum % (tatumsPerMeasure / sub) === 0) {
				var count = this.get(subStr);
				count++;
				count = count % sub;
				//set the increment with the time
				this.set(subStr, count, time);
			}
		}
		//increment the tatum
		tatum++;
		tatum = tatum % tatumsPerMeasure;
		this.tatum = tatum;
	},
	createScriptCallback : function() {
		var self = this;
		this.scriptNode.onaudioprocess = function(event) {
			//timing
			var playbackTime = AUDIO.context.currentTime;
			var samplesToSeconds = 1 / AUDIO.context.sampleRate;
			//process samples
			var inputBuffer = event.inputBuffer.getChannelData(0);
			var len = inputBuffer.length;
			for(var i = 0; i < len; ++i) {
				var sample = inputBuffer[i];
				var sampleTime = samplesToSeconds * i + playbackTime;
				if(sample < 0) {
					if(!self.phase) {
						self.tickTatum(sampleTime);
						self.phase = 1;
					}
				} else {
					if(self.phase) {
						self.phase = 0;
					}
				}
			}
		}
	}
});

AUDIO.Metronome.View = Backbone.View.extend({

	className : "metronomeView",

	initialize : function() {

	},
	render : function(model) {

	}
});
