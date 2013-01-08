/*
 * ADSR
 *
 * creates a envelope
 *
 * attack and release function trigger the envelope
 *
 * can also be applied to any parameter using setParam
 */
AUDIO.ADSR = AUDIO.Unit.extend({

	name : "ADSR",

	initialize : function(attributes, options) {
		this.superInit(attributes, options);
		//the gain for the default volume envelope
		this.gain = AUDIO.context.createGainNode();
		this.input.connect(this.gain);
		//the default parameter is the internal gain
		this.setParameter(this.gain.gain);
		this.gain.connect(this.output);
		//make the view
		this.view = new AUDIO.ADSR.View({
			model : this
		});
		this.lastAttackEnd = 0;
		this.lastReleaseEnd = 0;
	},
	validate : function(attrs) {

	},
	defaults : {
		"attack" : 0.01,
		"decay" : 0.1,
		"sustain" : .5,
		"release" : .7,
		"min" : 0,
		"max" : 1,
		"parameter" : "internal gain",
	},
	//the current state in the envelope
	//0->ready 1->attack/decay 2->release
	//if no time is given, the time is set as now
	state : function(time) {
		time = time || AUDIO.context.currentTime;
		//if it's after the last release, it's ready to go
		//console.log(time, this.lastAttackEnd, this.lastReleaseEnd);
		if (this.lastReleaseEnd > time){
			return 2;
		} else if (this.lastAttackEnd > time) {
			return 1;
		} else {
			return 0;
		}
	},
	triggerAttack : function(time) {
		var attack = this.get("attack");
		var decay = this.get("decay");
		var sustain = this.get("sustain");
		var max = this.get("max");
		var min = this.get("min");
		var state =this.state(time);
		//only play the note if it's ready
		if(state === 0) {
			//cancel the previous stuff
			this.parameter.cancelScheduledValues(time);
			//start at the min
			time += .001;
			this.parameter.setValueAtTime(min, time);
			//attack
			time += attack;
			this.parameter.linearRampToValueAtTime(max, time);
			//decay to sustained level
			time += decay;
			this.parameter.linearRampToValueAtTime(max * sustain, time);
			this.lastAttackEnd = time;
		}

	},
	triggerRelease : function(time) {
		//can't schedule the values if the attack is still going
		//instead wait for it to finish
		var state = this.state(time);
		console.log(state);
		//if(state=== 1) {
		//	time = this.lastAttackEnd + .001;
		//}
		if(state === 1) {
			//cancel the previous stuff
			this.parameter.cancelScheduledValues(time);
			time += .001;
			//start at the min
			//this.parameter.setValueAtTime(this.parameter.value, time);
			var sustain = this.get("sustain");
			var release = this.get("release");
			var min = this.get("min");
			//should be at the sustain
			this.parameter.setValueAtTime(sustain, time);
			//release
			time += release;
			this.parameter.linearRampToValueAtTime(min, time);
			//this.parameter.setValueAtTime(min, time+.001);
			this.lastReleaseEnd = time;
		}

	},
	//sets a parameter to apply the envelope to
	setParameter : function(parameter) {
		this.parameter = parameter;
		this.set("parameter", parameter.name);
		//set the parameter to the minimum value
		this.parameter.setValueAtTime(this.get("min"), AUDIO.context.currentTime);
	}
});

/*
 * ADSR VIEW
 *
 */
AUDIO.ADSR.View = AUDIO.Unit.View.extend({

	className : "adsrView fullUnit blackBackground",

	events : {
		//	 "spin #detuneSpinner" : "detuneChange",
		//	 "spin #typeSpinner" : "typeChange",
		//	 "spin #frequencySpinner" : "freqChange",
		//	 "spinchange" : "spinChange",
		//the trigger button
		"mousedown #triggerButton" : "triggerPressed",
		"mouseup #triggerButton" : "triggerReleased",
		//adsr anchors
		"drag" : "anchorMoved",
	},

	initialize : function() {
		this.superInit();
		//detune knob
		$("<div class='attack'><label for='attackSpinner' class='whitefont smallTitle'>attack</label> <input id='attackSpinner' class='whitefont' name='value'/></div>").appendTo(this.$el);
		this.$attack = this.$el.find("#attackSpinner");
		$("<div class='decay'><label for='decaySpinner' class='whitefont smallTitle'>decay</label> <input id='decaySpinner' class='whitefont' name='value'/></div>").appendTo(this.$el);
		this.$decay = this.$el.find("#decaySpinner");
		$("<div class='sustain'><label for='sustainSpinner' class='whitefont smallTitle'>sustain dB</label> <input id='sustainSpinner' class='whitefont' name='value'/></div>").appendTo(this.$el);
		this.$sustain = this.$el.find("#sustainSpinner");
		$("<div class='release'><label for='releaseSpinner' class='whitefont smallTitle'>release</label> <input id='releaseSpinner' class='whitefont' name='value'/></div>").appendTo(this.$el);
		this.$release = this.$el.find("#releaseSpinner");
		$("<div class='min'><label for='minSpinner' class='whitefont smallTitle'>min</label> <input id='minSpinner' class='whitefont' name='value'/></div>").appendTo(this.$el);
		this.$min = this.$el.find("#minSpinner");
		$("<div class='max'><label for='maxSpinner' class='whitefont smallTitle'>max</label> <input id='maxSpinner' class='whitefont' name='value'/></div>").appendTo(this.$el);
		this.$max = this.$el.find("#maxSpinner");
		//trigger button
		$("<div class='trigger'> <button id='triggerButton' class='whitefont smallTitle'>trigger</button> </div>").appendTo(this.$el);
		this.$trigger = this.$el.find("#triggerButton");
		//and the canvas
		//$("<div class='adsrInterface'><canvas id='adsrDisplay'></canvas> <div id='attackAnchor' class='anchor'></div><div id='decayAnchor' class='anchor'></div> <div id='releaseAnchor' class='anchor'></div> </div> ")
		$("<div class='adsrInterface'><canvas id='adsrDisplay'></canvas> <div id='attackDecayContainer'> <div id='attackAnchor' class='anchor'></div> <div id='decayAnchor' class='anchor'></div></div> <div id='releaseContainer' > <div id='releaseAnchor' class='anchor'></div> </div> </div>").appendTo(this.$el);
		this.$canvas = this.$el.find("#adsrDisplay");
		this.context = this.$canvas[0].getContext('2d');
		this.$attackAnchor = this.$el.find("#attackAnchor");
		this.$decayAnchor = this.$el.find("#decayAnchor");
		this.$releaseAnchor = this.$el.find("#releaseAnchor");
		this.$releaseContainer = this.$el.find("#releaseContainer");
		this.$attackDecayContainer = this.$el.find("#attackDecayContainer");
		this.render(this.model);
	},
	render : function(model) {
		//setup the spinners
		this.$attack.spinner({
			min : 0,
			max : 10,
			step : 0.001,
		});
		this.$attack.spinner("value", model.get("attack"));
		this.$decay.spinner({
			min : 0,
			max : 10,
			step : 0.001,
		});
		this.$decay.spinner("value", model.get("decay"));
		this.$sustain.spinner({
			min : -50,
			max : 0,
			step : 0.1,
		});
		var sustainTodB = 10 * (Math.log(model.get("sustain")) / Math.LN10);
		this.$sustain.spinner("value", sustainTodB.toFixed(1));
		this.$release.spinner({
			min : 0,
			max : 15,
			step : 0.001,
		});
		this.$release.spinner("value", model.get("release"));
		this.$min.spinner({
			min : 0,
			max : 20000,
			step : 0.1,
		});
		this.$min.spinner("value", model.get("min"));
		this.$max.spinner({
			min : 0,
			max : 20000,
			step : 0.1,
		});
		this.$max.spinner("value", model.get("max"));
		//the trigger
		this.$trigger.button();
		//the interface
		this.$attackAnchor.draggable({
			containment : "#attackDecayContainer",
			axis : "x",
		});
		//position the attack anchor
		var attackLeft = AUDIO.Util.scaleExp(model.get("attack") * 1000, 1, 6000, 0, this.$attackDecayContainer.width() - this.$attackAnchor.width());
		this.$attackAnchor.css({
			left : attackLeft
		});
		//position the decay/sustain anchor
		this.$decayAnchor.draggable({
			containment : "#attackDecayContainer",
		});
		var decayLeft = AUDIO.Util.scaleExp(model.get("decay") * 1000, 1, 6000, 0, this.$attackDecayContainer.width() - this.$attackAnchor.width() - attackLeft);
		var sustainTop = AUDIO.Util.scaleExp(model.get("sustain") * 100000, 1, 100000, this.$attackDecayContainer.height() - this.$attackAnchor.height(), 1);
		this.$decayAnchor.css({
			left : decayLeft + attackLeft,
			top : sustainTop,
		});
		//position the release
		this.$releaseAnchor.draggable({
			containment : "#releaseContainer",
			axis : "x",
		});
		var releaseLeft = AUDIO.Util.scaleExp(model.get("release") * 1000, 1, 12000, 0, this.$releaseContainer.width() - this.$attackAnchor.width());
		this.$releaseAnchor.css({
			left : releaseLeft
		});
		//draw the envelope
		this.drawEnvelope();
		return this;
	},
	drawEnvelope : function() {
		//setup the canvas
		var height = this.$canvas.height();
		var width = this.$canvas.width();
		this.context.canvas.height = height;
		this.context.canvas.width = width;
		this.context.strokeStyle = "#fff";
		this.context.lineWidth = 5;
		this.context.lineJoin = 'round';
		var halfAnchor = this.$attackAnchor.width() / 2;
		//relevant values
		var attackX = this.$attackAnchor.position().left + halfAnchor;
		var attackY = this.$attackAnchor.position().top + halfAnchor;
		var decayX = this.$decayAnchor.position().left + halfAnchor;
		var decayY = this.$decayAnchor.position().top + halfAnchor;
		var sustainX = this.$releaseContainer.position().left;
		var sustainY = decayY;
		var releaseX = this.$releaseAnchor.position().left + halfAnchor + sustainX;
		var releaseY = this.$releaseAnchor.position().top + halfAnchor;
		//draw the attack line
		this.context.beginPath();
		this.context.moveTo(0, height);
		this.context.lineTo(attackX, attackY);
		//draw the decay slope
		this.context.quadraticCurveTo(attackX, decayY, decayX, decayY);
		//the sustain line
		this.context.lineTo(sustainX, sustainY);
		//the release line
		this.context.quadraticCurveTo(sustainX, releaseY, releaseX, releaseY);
		//stroke!
		this.context.stroke();

	},
	//handles the interface interaction
	anchorMoved : function(event, ui) {
		if(event.target.id === this.$attackAnchor.attr("id")) {
			//the entire width equals ~6 seconds
			var width = this.$attackDecayContainer.width() - this.$attackAnchor.width();
			var attackVal = ui.position.left + 1;
			var scaledAttack = AUDIO.Util.scaleLog(attackVal, 1, width, 1, 6000);
			this.model.set("attack", scaledAttack / 1000);
		}
		if(event.target.id === this.$decayAnchor.attr("id")) {
			if(this.$attackAnchor.position().left >= this.$decayAnchor.position().left) {
				//stop the dragging if it's going too far to the left
				this.$decayAnchor.css({
					left : this.$attackAnchor.position().left + 1
				})
				return false;
			} else {
				this.$decayAnchor.draggable({
					revert : false
				});
				//the entire width equals ~6 seconds
				var width = this.$attackDecayContainer.width() - this.$attackAnchor.width() - this.$attackAnchor.position().left;
				var decayVal = ui.position.left - this.$attackAnchor.position().left + 1;
				var scaledDecay = AUDIO.Util.scaleLog(decayVal, 1, width, 1, 6000);
				this.model.set("decay", scaledDecay / 1000);
				//set the sustain dB
				var height = ui.position.top;
				var val = AUDIO.Util.scaleLog(height, this.$attackDecayContainer.height() - this.$attackAnchor.height(), 1, 1, 100000);
				val /= 100000;

				this.model.set("sustain", val);
			}

		}
		if(event.target.id === this.$releaseAnchor.attr("id")) {
			var width = this.$releaseContainer.width() - this.$attackAnchor.width();
			var releaseVal = ui.position.left + 1;
			var scaledRelease = AUDIO.Util.scaleLog(releaseVal, 1, width, 1, 12000);
			this.model.set("release", scaledRelease / 1000);
		}
	},
	//trigger button
	triggerPressed : function(event) {
		var now = AUDIO.context.currentTime;
		this.model.triggerAttack(now);
	},
	triggerReleased : function(event) {
		var now = AUDIO.context.currentTime;
		this.model.triggerRelease(now);
	},
	//spinner stuff
	spinChange : function(event, ui) {
		var value = $(event.target).spinner("value");
		if(event.target.id === this.$attack.attr("id")) {
			this.model.set("attack", value);
		}
	}
});
