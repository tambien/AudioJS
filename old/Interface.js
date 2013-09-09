/*
 * INTERFACE
 *
 */
AUDIO.Interface = {
	halfUnit : 100,
	fullUnit : 220,
	//fullUnit : 220,
	channelHeight : 180,
};

/*
 * INTERFACE ELEMENTS
 *
 * binds to an "attribute" and keeps in sync with that attribute
 */
AUDIO.Interface.View = Backbone.View.extend({

	tagName : "div",

	className : "interface",

	events : {
		"change" : "valueChanged",
	},
	//update the model when the value has changed
	valueChanged : function(event) {
		var val = parseFloat($(event.target).val());
		this.model.set(this.options.attribute, val);
	},
	superInit : function() {
		//listen for changes in the passed in attribute
		this.listenTo(this.model, "change:" + this.options.attribute, this.render);
		//set the container
		this.$container = this.options.container
		this.$container.append(this.$el);
	},
});

/*
 * SMALL BALANCE KNOB
 *
 * a small knob
 */
AUDIO.Interface.SmallBalanceKnob = AUDIO.Interface.View.extend({

	tagName : "div",

	className : "smallBalanceKnob",

	initialize : function() {
		this.superInit();
		//add the title
		this.$el.append("<span>" + this.options.attribute + "</span><br>");
		//and then the knob
		this.$knob = $("<input type='text' value='" + this.model.get(this.options.attribute) + "'/>").appendTo(this.$el);
		this.$knob.knob({
			width : AUDIO.Interface.halfUnit,
			min : -50,
			max : 50,
			angleOffset : -125,
			angleArc : 250,
			displayInput : true
		});
		this.$knob.height("50%");
	},
	render : function(model) {
		var value = model.get(this.options.attribute);
		this.$knob.val(value).change();
		return this;
	},
});

/*
 * FADER
 *
 */
AUDIO.Interface.Fader = AUDIO.Interface.View.extend({

	tagName : "div",

	className : "fader",

	initialize : function() {
		this.superInit();
		//add the elements
		this.$fader = $("<input type='range' max='112' style='-webkit-appearance: slider-vertical;'/><br>").appendTo(this.$el);
		this.$number = $("<span>0</span>").appendTo(this.$el);
		this.$el.width(AUDIO.Interface.halfUnit);
		this.$fader.addClass("halfUnit topLeft")
		this.$number.addClass("halfUnit bottomLeft")
		this.$fader.height("80%");
		//this.$number.width(AUDIO.Interface.halfUnit);
		this.render(this.model);
	},
	render : function(model) {
		var value = model.get(this.options.attribute);
		//show the dB value
		var db = 10 * (Math.log(value) / Math.LN10);
		this.$number.html(db.toFixed(1));
		//position the slider
		var scale = 0.11512925464970229
		var val = (Math.log(value * 100) - 4.605170185988092) / scale;
		this.$fader.val(val + 100);
		return this;
	},
	//update the model when the value has changed
	valueChanged : function(event) {
		// calculate adjustment factor
		var scale = 0.11512925464970229
		var val = Math.exp(4.605170185988092 + scale * ($(event.target).val()));
		val /= 10000000;
		this.model.set(this.options.attribute, val, {
			silent : true
		});
		//set the db meter
		var db = 10 * (Math.log(val) / Math.LN10);
		this.$number.html(db.toFixed(1));
	},
});

/*
 * SMALL NUMBER
 *
 */
AUDIO.Interface.SmallNumber = AUDIO.Interface.View.extend({

	tagName : "div",

	className : "smallNumber",

	initialize : function() {
		this.superInit();
		//add the elements
		var inputString = "<input type='number'";
		if (this.options.min!==undefined){
			inputString += ("min='"+this.options.min+"'");
		}
		if (this.options.max!==undefined){
			inputString += ("max='"+this.options.max+"'");
		}
		if (this.options.step!==undefined){
			inputString += ("step='"+this.options.step+"'");
		}
		inputString+="/>";
		this.$title = $("<div class='label'>" + this.options.label + "</div>").appendTo(this.$el);
		this.$number = $(inputString).appendTo(this.$el);
		//set the position
		this.$el.css({
			top : this.options.top,
			left : this.options.left,
		});
		this.render(this.model);
	},
	render : function(model) {
		var precision = this.options.precision||0
		this.$number.val(model.get(this.options.attribute).toFixed(precision));
		return this;
	},
});

AUDIO.Interface.SmallNumberdB = AUDIO.Interface.SmallNumber.extend({

	className : "smallNumber smallNumberdB",

	render : function(model) {
		var attrTodB = 10 * (Math.log(model.get(this.options.attribute)) / Math.LN10);
		this.$number.val(attrTodB.toFixed(1));
		return this;
	},
	valueChanged : function(event) {
		var val = parseFloat($(event.target).val());
		val/=10;
		val = Math.pow(10, val);
		this.model.set(this.options.attribute, val);
	},
});
