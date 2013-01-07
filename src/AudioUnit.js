/*
 * AUDIO UNIT
 *
 *
 * this is the basic object from which all the components inherit
 * 
 * default : 1 input, 1 output
 */

AUDIO.Unit = Backbone.Model.extend({
	//every unit has a name
	name : "Unit",
	//the initializer
	initialize : function() {
		this.superInit();
		//default routing = pass through
		this.input[0].connect(this.output[0]);
	},
	//the super initializer
	superInit : function(attributes, options) {
		//make the input and output
		this.input = AUDIO.context.createGainNode(),
		this.output = AUDIO.context.createGainNode();
		//setup the uniqe id
		this.id = this.name + AUDIO.units.length;
		//set the visibility to false by default
		if(this.get("visible") === undefined) {
			this.set("visible", false);
		}
		//set the name if one wasn't passed in
		if(this.get("title") === undefined) {
			this.set("title", this.id);
		}
		//setup the incoming and outgoing node arrays
		if(this.get("inputs")=== undefined){
			this.set("inputs", []);
		}
		//setup the incoming and outgoing node arrays
		if(this.get("outputs")=== undefined){
			this.set("outputs", []);
		}
		
		//add it to the collection
		AUDIO.units.add(this);
	},
	//connects this node's output to the next ones input
	connect : function(node) {
		this.output.connect(node.input);
		//create a reference to to the connected nodes
		this.get("outputs").push(node);
		node.get("inputs").push(this);
	},
	//disconnect from all the proceeding nodes
	disconnect : function() {
		
	},
});

AUDIO.Unit.View = Backbone.View.extend({

	tagName : "div",

	className : "Unit",

	initialize : function() {

	},
	superInit : function() {
		//listen for model changes
		this.listenTo(this.model, "change", this.render);
		this.listenTo(this.model, "change:visible", this.changeVisible);
		//add the div to the model's container
		this.$el.attr({
			'id' : this.model.id
		});
		//add the title at the top
		this.$el.append("<div class='unitTitle whiteFont'>" + this.model.get("title") + "</div>");
	},
	render : function() {

	},
	changeVisible : function(unit) {
		//became visible
		if (unit.get("visible")){
			AUDIO.container.append(this.$el);
			//this.delegateEvents();
		} else {
			//became invisible
			//this.undelegateEvents();
			this.$el.detach();
		}
	}
});
