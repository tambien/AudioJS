/*
 * FILTER
 *
 * @input
 * 	0 = audio
 * 	1 = filter freq param
 *
 * @output
 * output 0 = audio
 */
AUDIO.Filter = AUDIO.Unit.extend({

	name : "Filter",

	initialize : function(attributes, options) {
		this.superInit(attributes, options);
		//make the filter
		this.filter = AUDIO.context.createBiquadFilter();
		//connect it up
		this.filter.connect(this.output[0]);
		//the input controls the frequency
		this.input[0].connect(this.filter);
		this.input[1] = this.filter.frequency;
		//make the view
		this.view = new AUDIO.Filter.View({
			model : this
		});
		//bind the listeners
		this.on("change:type", this.changeType);
		this.on("change:Q", this.changeQ);
		this.on("change:gain", this.changeGain);
		this.on("change:frequency", this.changeFreq);
	},
	//set some initial values
	validate : function(attrs) {
		if (attrs.type < 0 || attrs.type>3){
			return attrs.type+" is not a value filter type";
		}
	},
	defaults : {
		"Q" : 1,
		"gain" : 1,
		"frequency" : 440,
		"type" : 0, //lowpass
	},
	//setters
	changeType : function(model, type) {
		model.filter.type = type;
	},
	changeQ : function(model, Q) {
		model.filter.Q.value = Q;
	},
	changeGain : function(model, gain) {
		model.filter.gain.value = gain;
	},
	changeFreq : function(model, frequency) {
		model.filter.frequency.value = frequency;
	},
});

/*
 * FILTER VIEW
 *
 */
AUDIO.Filter.View = AUDIO.Unit.View.extend({

	className : "filterView fullUnit blackBackground",

	events : {
		"drag" : "anchorMoved",
	},

	initialize : function() {
		this.superInit();
		//the freq number
		this.frequency = new AUDIO.Interface.SmallNumber({
			container : this.$el,
			model : this.model,
			attribute : "frequency",
			label : "FREQ",
			min : 20,
			max : 20000,
			top : 240,
		})
		this.Q = new AUDIO.Interface.SmallNumber({
			container : this.$el,
			model : this.model,
			attribute : "Q",
			label : "Q",
			min : 0,
			max : 20,
			precision : 1,
			top : 240,
			left : 140,
		})
		this.type = new AUDIO.Interface.SmallNumber({
			container : this.$el,
			model : this.model,
			attribute : "type",
			label : "TYPE",
			min : 0,
			max : 3,
			top : 280,
			left : 70,
		})
		//the interface
		$("<div class='filterInterface'> <canvas id='filterDisplay'> </canvas> <div id='freqAnchor' class='anchor'> </div>  </div> ").appendTo(this.$el);
		this.$canvas = this.$el.find("#filterDisplay");
		this.context = this.$canvas[0].getContext('2d');
		this.$anchor = this.$el.find("#freqAnchor");
		this.render(this.model);

	},
	render : function(model) {
		//set the anchor
		this.$anchor.draggable({
			containment : ".filterInterface",
		});
		//position the attack anchor
		var anchorLeft = AUDIO.Util.scaleExp(model.get("frequency"), 20, 20000, 0, this.$canvas.width() - this.$anchor.width());
		var anchorTop = AUDIO.Util.scaleExp(model.get("Q")+1, 1, 21, this.$canvas.height() - this.$anchor.height(), 0);
		this.$anchor.css({
			top: anchorTop,
			left : anchorLeft,
		})
		//draw the filter curve
		this.drawFilter();
		return this;
	},
	drawFilter : function() {
		//setup the canvas
		var height = this.$canvas.height();
		var width = this.$canvas.width();
		var context = this.context;
		context.canvas.height = height;
		context.canvas.width = width;
		//clear it
		context.clearRect(0, 0, width, height);

		var dbScale = 60;
		var pixelsPerDb = (0.5 * height) / dbScale;

		var noctaves = 11;

		var frequencyHz = new Float32Array(width);
		var magResponse = new Float32Array(width);
		var phaseResponse = new Float32Array(width);
		var nyquist = 0.5 * AUDIO.context.sampleRate;
		// First get response.
		for(var i = 0; i < width; ++i) {
			var f = i / width;

			// Convert to log frequency scale (octaves).
			f = nyquist * Math.pow(2.0, noctaves * (f - 1.0));

			frequencyHz[i] = f;
		}

		//draw the lines
		/*
		 context.beginPath();
		 context.lineWidth = 1;
		 var gridColor = "#555"
		 context.strokeStyle = gridColor;

		 //the 0db line
		 context.beginPath();
		 context.moveTo(0, 0.5 * height);
		 context.lineTo(width, 0.5 * height);
		 context.stroke();
		 */
		this.model.filter.getFrequencyResponse(frequencyHz, magResponse, phaseResponse);

		// Draw frequency scale.
		/*
		for(var octave = 0; octave <= noctaves; octave++) {
		var x = octave * width / noctaves;

		context.strokeStyle = gridColor;
		context.moveTo(x, 30);
		context.lineTo(x, height);
		context.stroke();

		var f = nyquist * Math.pow(2.0, octave - noctaves);
		context.textAlign = "center";
		//context.strokeStyle = textColor;
		//context.strokeText(f.toFixed(0) + "Hz", x, 20);
		}
		*/
		//draw the freq response curve
		context.strokeStyle = "#fff";
		context.lineWidth = 5;
		context.lineJoin = 'round';
		context.beginPath();
		context.moveTo(0, 0);

		for(var i = 0; i < width; ++i) {
			var f = magResponse[i];
			var response = magResponse[i];
			var dbResponse = 20.0 * Math.log(response) / Math.LN10;
			dbResponse *= 2;
			// simulate two chained Biquads (for 4-pole lowpass)

			var x = i;
			var y = (0.5 * height) - pixelsPerDb * dbResponse;

			if(i == 0)
				context.moveTo(x, y);
			else
				context.lineTo(x, y);
		}
		context.stroke();
		/*

		 */

		/*
		 // Draw decibel scale.

		 for(var db = -dbScale; db < dbScale; db += 10) {
		 var y = dbToY(db);
		 canvasContext.strokeStyle = textColor;
		 canvasContext.strokeText(db.toFixed(0) + "dB", width - 40, y);
		 canvasContext.strokeStyle = gridColor;
		 canvasContext.beginPath();
		 canvasContext.moveTo(0, y);
		 canvasContext.lineTo(width, y);
		 canvasContext.stroke();
		 }
		 */
	},
	anchorMoved : function(event, ui) {
		var width = this.$canvas.width() - this.$anchor.width();
		var height = this.$canvas.height();
		var freq = ui.position.left + 1;
		var Q = ui.position.top + 1;
		var freqVal = AUDIO.Util.scaleLog(freq, 1, width, 20, 20000);
		var qVal = AUDIO.Util.scaleLog(Q, height, 1, 1.01, 21);
		qVal -= 1;
		this.model.set("Q", qVal);
		this.model.set("frequency", freqVal);
	}
});
