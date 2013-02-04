/*
 * OSCILLATOR
 *
 * @input
 * 	0 = frequency audio param
 * 	1 = output gain param
 *
 * @output
 * output 0 = audio
 */
AUDIO.Oscillator = AUDIO.Unit.extend({

	name : "Oscillator",

	initialize : function(attributes, options) {
		this.superInit(attributes, options);
		//connect it up
		this.oscillator.connect(this.output[0]);
		//the input controls the frequency
		this.input[0] = this.oscillator.frequency;
		this.input[1] = this.output[0].gain;
		//set it to 0 for being controlled by an envelope
		this.output[0].gain.value = 0;
		//start the oscillator
		this.oscillator.noteOn(0);
		//make the view
		this.view = new AUDIO.Oscillator.View({
			model : this
		});
		//bind the listeners
		this.on("change:type", this.changeType)
		this.on("change:detune", this.changeDetune)
		this.on("change:frequency", this.changeFreq)

	},
	//set some initial values
	validate : function(attrs) {
		if(attrs.type < 0 || attrs.type > 3) {
			return "type must be between 0 and 3";
		}
		if(attrs.detune < -50 || attrs.detune > 50) {
			return "detune out of range";
		}
	},
	defaults : {
		"detune" : 0,
		"frequency" : 440,
		"type" : 0, //sine tone
		"portamento" : 0,
	},

	//the oscillator
	oscillator : AUDIO.context.createOscillator(),

	changeType : function(model, type) {
		model.oscillator.type = type;
	},
	changeDetune : function(model, detune) {
		model.oscillator.detune.value = detune;
	},
	changeFreq : function(model, frequency, time) {
		var portamento = model.get("portamento");
		if(time === undefined) {
			time = AUDIO.context.currentTime;
		}
		model.oscillator.frequency.cancelScheduledValues(time);
		if(portamento>0) {
			//portamento to freq
			model.oscillator.frequency.linearRampToValueAtTime(frequency, time + portamento);
		} else {
			model.oscillator.frequency.setValueAtTime(frequency, time);
		}
	},
});

/*
 * OSCILLATOR VIEW
 *
 */
AUDIO.Oscillator.View = AUDIO.Unit.View.extend({

	className : "oscillatorView halfUnit blackBackground",

	initialize : function() {
		this.superInit();
		//frequency indicator
		this.frequency = new AUDIO.Interface.SmallNumber({
			container : this.$el,
			model : this.model,
			attribute : "frequency",
			label: "FREQ",
			min : 20,
			max : 20000, 
			top: 60,
		});
		//detune indicator
		this.detune = new AUDIO.Interface.SmallNumber({
			container : this.$el,
			model : this.model,
			attribute : "detune",
			label: "DETUNE",
			min : -50,
			max : 50, 
			top: 120,
		})
		//type indicator
		this.type = new AUDIO.Interface.SmallNumber({
			container : this.$el,
			model : this.model,
			attribute : "type",
			label: "TYPE",
			min : 0,
			max : 3, 
			top: 180,
		})
		//portamento indicator
		this.port = new AUDIO.Interface.SmallNumber({
			container : this.$el,
			model : this.model,
			attribute : "portamento",
			label: "PORT",
			min : 0,
			max : 2, 
			precision: 2,
			step: .01,
			top: 240,
		})
		this.render(this.model);
		//this.on("change .detuneKnob", this.detuneChange);
	},
	render : function(model) {
		
		return this;
	},
});
