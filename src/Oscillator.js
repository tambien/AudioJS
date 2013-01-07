/*
 * OSCILLATOR
 *
 */
AUDIO.Oscillator = AUDIO.Unit.extend({

	name : "Oscillator",

	initialize : function(attributes, options) {
		this.superInit(attributes, options);
		//connect it up
		this.oscillator.connect(this.output);
		//the input controls the frequency
		this.input.connect(this.oscillator.frequency);
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
	},

	//the oscillator
	oscillator : AUDIO.context.createOscillator(),

	changeType : function(model) {
		this.oscillator.type = model.get("type");
	},
	changeDetune : function(model) {
		var detune = model.get("detune");
		this.oscillator.detune.value = detune;
	},
	changeFreq : function(model) {
		var freq = model.get("frequency");
		var now = AUDIO.context.currentTime;
		this.setFrequency(freq, now, .005);
	},
	//set frequency from the outside
	setFrequency : function(freq, time, portamentoTime) {
		//cancel previously scheduled things
		this.oscillator.frequency.cancelScheduledValues(time);
		//go to the frequency
		if(portamentoTime) {
			//portamento to freq
			this.oscillator.frequency.exponentialRampToValueAtTime(freq, time + portamentoTime);
		} else {
			this.oscillator.frequency.setValueAtTime(freq, time);
		}
		//update the attributes
		this.set({
			frequency : freq
		}, {
			silent: true
		});
	}
});

/*
 * OSCILLATOR VIEW
 *
 */
AUDIO.Oscillator.View = AUDIO.Unit.View.extend({

	className : "oscillatorView halfUnit blackBackground",

	events : {
		"spin #detuneSpinner" : "detuneChange",
		"spin #typeSpinner" : "typeChange",
		"spin #frequencySpinner" : "freqChange",
		"spinchange" : "spinChange",
	},

	initialize : function() {
		this.superInit();
		//detune knob
		$("<div class='detune'><label for='detuneSpinner' class='whitefont smallTitle'>DETUNE</label> <input id='detuneSpinner' class='whitefont' name='value'/></div>").appendTo(this.$el);
		this.$detune = this.$el.find("#detuneSpinner");
		//frequency indicator
		$("<div class='frequency'><label for='frequencySpinner' class='whitefont smallTitle'>FREQUENCY</label> <input id='frequencySpinner' class='whitefont' name='value'/></div>").appendTo(this.$el);
		this.$freq = this.$el.find("#frequencySpinner");
		//type indicator
		$("<div class='type'><label for='typeSpinner' class='whitefont smallTitle'>TYPE</label> <input id='typeSpinner' class='whitefont' name='value'/></div>").appendTo(this.$el);
		this.$type = this.$el.find("#typeSpinner");
		this.render(this.model);
		//this.on("change .detuneKnob", this.detuneChange);
	},
	render : function(model) {
		//setup the knob
		this.$detune.spinner({
			min : -50,
			max : 50,
		});
		this.$detune.spinner("value", model.get("detune"));
		//setup the freq spinner
		this.$freq.spinner({
			min : 0,
			max : 20000,
		});
		this.$freq.spinner("value", model.get("frequency"));
		//setup the type
		this.$type.spinner({
			min : 0,
			max : 3,
		});
		this.$type.spinner("value", model.get("type"));
		return this;
	},
	typeChange : function(event, ui) {
		this.model.set("type", ui.value);
	},
	freqChange : function(event, ui) {
		this.model.set("frequency", ui.value);
	},
	detuneChange : function(event, ui) {
		this.model.set("detune", ui.value);
	}, 
	spinChange : function (event, ui){
		var value = $(event.target).spinner("value");
		if (event.target.id===this.$freq.attr("id")){
			this.model.set("frequency", value);
		} else if (event.target.id===this.$detune.attr("id")){
			this.model.set("detune", value);
		} else if (event.target.id===this.$type.attr("id")){
			this.model.set("type", value);
		}
	}
});
