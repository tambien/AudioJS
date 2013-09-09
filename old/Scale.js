/*
 * SCALE
 *
 * scales values from the input to the output
 *
 * @input
 * 	0 = values as audio
 *
 * @output
 * 	1 = scaled values
 */
AUDIO.Scale = AUDIO.Unit.extend({

	name : "Scale",

	initialize : function(attributes, options) {
		this.superInit(attributes, options);
		//the script node
		this.scriptNode = AUDIO.context.createJavaScriptNode(1024, 1, 1);
		//so that it doesn't get garbage collected!
		this.gain = AUDIO.context.createGainNode();
		this.gain.connect(AUDIO.context.destination);
		this.gain.gain.value = 0;
		this.scriptNode.connect(this.gain);
		//the script node is the input and output
		//this.scriptNode.connect(this.output[0]);
		//this.scriptNode.connect(this.input[0]);
		this.input[0] = this.scriptNode;
		this.output[0] = this.scriptNode;
		this.createScriptNode();
		//make the view
		this.view = new AUDIO.Scale.View({
			model : this
		});
	},
	validate : function(attrs) {

	},
	defaults : {
		"fromMin" : 0,
		"fromMax" : 1,
		"toMin" : 0,
		"toMax" : 1,
	},
	//the script node that makes the envelope
	createScriptNode : function() {
		var self = this;
		this.scriptNode.onaudioprocess = function(event) {
			var inputBuffer = event.inputBuffer.getChannelData(0);
			var outputBuffer = event.outputBuffer.getChannelData(0);

			var scale = AUDIO.Util.scale;
			var fromMin = self.get("fromMin");
			var fromMax = self.get("fromMax");
			var toMin = self.get("toMin");
			var toMax = self.get("toMax");

			var len = inputBuffer.length;
			for(var i = 0; i < len; ++i) {
				outputBuffer[i] = scale(inputBuffer[i], fromMin, fromMax, toMin, toMax);
			}
		}
	}
});

/*
 * SCALE VIEW
 *
 */
AUDIO.Scale.View = AUDIO.Unit.View.extend({

	className : "scaleView halfUnit blackBackground",

	initialize : function() {
		this.superInit();

		this.$el.append("<div id='fromLabel'>FROM:</div>");
		this.$el.append("<div id='toLabel'>TO:</div>");
		//mapFrom
		this.fromMin = new AUDIO.Interface.SmallNumber({
			container : this.$el,
			model : this.model,
			attribute : "fromMin",
			label : "MIN",
			precision : 1,
			top : 60
		});
		this.fromMax = new AUDIO.Interface.SmallNumber({
			container : this.$el,
			model : this.model,
			attribute : "fromMax",
			label : "MAX",
			precision : 1,
			top : 90
		});
		//mapTo
		this.toMin = new AUDIO.Interface.SmallNumber({
			container : this.$el,
			model : this.model,
			attribute : "toMin",
			label : "MIN",
			precision : 1,
			top : 160
		});
		this.toMax = new AUDIO.Interface.SmallNumber({
			container : this.$el,
			model : this.model,
			attribute : "toMax",
			label : "MAX",
			precision : 1,
			top : 190
		});

		this.render(this.model);
	},
	render : function(model) {

		return this;
	},
});
