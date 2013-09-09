/*
 * AUDIO MODULE
 *
 *
 * a collection of Audio Units
 */

AUDIO.Module = AUDIO.Unit.extend({
	
	units : [],
	
	addUnit : function (unit){
		unit.set("container", this.id);
	},
	
	//the initializer
	initialize : function() {
		this.superInit();
	},
	//the super initializer
	superInit : function() {
		this.id="Module"+AUDIO.nodes.length;
		AUDIO.modules.push(this);
	},
});

AUDIO.Module.View = AUDIO.Unit.View.extend({

	tagName : "div",

	className : "audioModule",

	initialize : function() {
		//listen for model changes
		this.listenTo(this.model, "change", this.render);
	},
	render : function() {

	},
});

