/*
 * ADSR
 *
 * creates a envelope between 0 and 1;
 *
 * @input
 * 	0 = gate (0->1 causes triggerAttack) (1->0 causes triggerRelease);
 *
 * @output
 * 	1 = ADSR envelope
 */
AUDIO.ADSR = AUDIO.Unit.extend({

	name : "ADSR",

	initialize : function(attributes, options) {
		this.superInit(attributes, options);
		//the script node
		this.scriptNode = AUDIO.context.createJavaScriptNode(1024, 0, 1);
		//the script node is the output
		//this.scriptNode.connect(this.output[0]);
		this.output[0] = this.scriptNode;
		//the release value for smooth retriggering
		this.releaseValue = 0;
		this.createScriptNode();
		//make the view
		this.view = new AUDIO.ADSR.View({
			model : this
		});
	},
	validate : function(attrs) {

	},
	defaults : {
		"attack" : 0.01,
		"decay" : 0.1,
		"sustain" : .5,
		"release" : .7,
	},
	//the current state in the envelope
	phase : function(time) {
		if(time < this.attackStart) {
			//waiting
			return 0;
		} else if(time < this.decayStart) {
			//attack
			return 1;
		} else if(time < this.sustainStart) {
			//decay
			return 2;
		} else if(time < this.releaseStart || this.releaseStart === 0) {
			//sustain
			return 3
		} else if(time < this.releaseEnd) {
			//release
			return 4
		} else {
			return 0;
		}
	},
	triggerAttack : function(time) {
		this.attackStart = time;
		time += this.get("attack");
		this.decayStart = time;
		time += this.get("decay");
		this.sustainStart = time;
		//cancel the release if one had been set
		this.releaseStart = 0;
		this.releaseEnd = 0;
	},
	triggerRelease : function(time) {
		//if the release is triggered before the sustain
		//delay the release until after the sustain
		if(time < this.sustainStart) {
			time = this.sustainStart;
		}
		//set the values
		this.releaseStart = time;
		this.releaseEnd = time + this.get("release");
	},
	//the script node that makes the envelope
	createScriptNode : function() {
		var self = this;
		this.scriptNode.onaudioprocess = function(event) {
			//this should work?
			//var playbackTime = event.playbackTime;
			var playbackTime = AUDIO.context.currentTime;
			var outputBuffer = event.outputBuffer.getChannelData(0);
			var n = outputBuffer.length;
			var samplesToSeconds = 1 / AUDIO.context.sampleRate;
			//local scale functions
			var scale = AUDIO.Util.scale;
			var scaleExp = AUDIO.Util.scaleExp;
			//timing values
			var attackStart = self.attackStart;
			var decayStart = self.decayStart;
			var sustainStart = self.sustainStart;
			var sustainVal = self.get("sustain");
			var releaseStart = self.releaseStart;
			var releaseEnd = self.releaseEnd;
			//the starting sample value
			var sampleValue = self.sampleValue;
			//process samples
			for(var i = 0; i < n; ++i) {
				//get the phase
				var sampleTime = samplesToSeconds * i + playbackTime;
				var phase = self.phase(sampleTime);
				//set the samples
				switch(phase) {
					//phase 0 = silent
					case 0:
						sampleValue = 0;
						break;
					//attack  starting -> 1
					case 1:
						sampleValue = scale(sampleTime, attackStart, decayStart, 0, 1);
						break;
					//release 1->sustainVal
					case 2:
						sampleValue = scale(sampleTime, decayStart, sustainStart, 1, sustainVal);
						break;
					//sustain
					case 3:
						sampleValue = sustainVal;
						break;
					//release sustainVal->0
					case 4:
						sampleValue = scale(sampleTime, releaseStart, releaseEnd, sustainVal, 0);
						break;
				}
				//set the sample
				outputBuffer[i] = sampleValue;
			}
			//set the last sample for smooth retriggering
			//self.sampleValue = sampleValue;
		}
	}
});

/*
 * ADSR VIEW
 *
 */
AUDIO.ADSR.View = AUDIO.Unit.View.extend({

	className : "adsrView fullUnit blackBackground",

	events : {
		//the trigger button
		"mousedown #triggerButton" : "triggerPressed",
		"mouseup #triggerButton" : "triggerReleased",
		//adsr anchors
		"drag" : "anchorMoved",
	},

	initialize : function() {
		this.superInit();
		//attack
		this.attack = new AUDIO.Interface.SmallNumber({
			container : this.$el,
			model : this.model,
			attribute : "attack",
			label : "ATTACK",
			min : 0.001,
			max : 10,
			step : .001,
			top : 220,
			precision : 3,
		});
		this.sustain = new AUDIO.Interface.SmallNumberdB({
			container : this.$el,
			model : this.model,
			attribute : "sustain",
			label : "SUSTAIN",
			min : -60,
			max : 0,
			top : 260,
			precision : 1,
		})
		
		this.decay = new AUDIO.Interface.SmallNumber({
			container : this.$el,
			model : this.model,
			attribute : "decay",
			label : "DECAY",
			min : 0.001,
			max : 10,
			step : .001,
			top : 220,
			left: 140,
			precision : 3,
		})
		
		this.release = new AUDIO.Interface.SmallNumber({
			container : this.$el,
			model : this.model,
			attribute : "release",
			label : "RELEASE",
			min : 0,
			max : 15,
			top : 260,
			left: 140,
			precision : 3,
		})
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
		this.model.triggerAttack(now + .1);
	},
	triggerReleased : function(event) {
		var now = AUDIO.context.currentTime;
		this.model.triggerRelease(now + .1);
	},
});
