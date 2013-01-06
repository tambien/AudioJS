/*
 * OSCILLATOR
 *
 */
AUDIO.Oscillator = AUDIO.Unit.extend({

	initialize : function(attributes, options) {
		//this.getContainer(options);
		this.superInit();
		//connect it up
		this.oscillator.connect(this.output);
		//the input controls the frequency
		this.input.connect(this.oscillator.frequency);
		//make the controls
		this.controls = {
			detuneKnob : new AUDIO.Interface.SmallBalanceKnob({
				model : this,
				attribute : "detune"
			})
		};
		/*
		 this.view = new AUDIO.Oscillator.View({
		 model : this
		 });
		 */
	},
	//set some initial values
	validate : function(attrs) {
		if(attrs.type) {
			this.oscillator.type = attrs.type;
		}
		if(attrs.detune) {
			this.oscillator.detune.value = attrs.detune;
		}
	},
	defaults : {
		"detune" : 0,
		"frequency" : 440,
		"type" : 0, //sine tone
	},

	//the oscillator
	oscillator : AUDIO.context.createOscillator(),

	//oscillator method
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
		});
	}
});
