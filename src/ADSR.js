/*
 * ADSR
 *
 * creates a volume envelope
 * 
 * attack and release function trigger the envelope
 */
AUDIO.ADSR = AUDIO.Unit.extend({

	name : "ADSR",

	initialize : function(attributes, options) {
		this.superInit(attributes, options);
		
		//make the view
		this.view = new AUDIO.ADSR.View({
			model : this
		});
		//bind the listeners
		/*
		this.on("change:attack", this.changeAttack)
		this.on("change:decay", this.changeDecay)
		this.on("change:sustain", this.changeFreq)
		this.on("change:release", this.changeFreq)
		*/
	},
	validate : function(attrs) {
		
	},
	defaults : {
		"attack" : 0,
		"decay" : 440,
		"sustain" : 0, 
		"release" : 0,
	},
	attack : function (time){
		
	}, 
	release : function (time) {
		
	}
	
});

/*
 * ADSR VIEW
 *
 */
AUDIO.ADSR.View = AUDIO.Unit.View.extend({

	className : "adsrView fullUnit blackBackground",

/*
	events : {
		"spin #detuneSpinner" : "detuneChange",
		"spin #typeSpinner" : "typeChange",
		"spin #frequencySpinner" : "freqChange",
		"spinchange" : "spinChange",
	},
*/
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
