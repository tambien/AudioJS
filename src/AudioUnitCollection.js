/*
 * AUDIO UNIT COLLECTION
 *
 */

AUDIO.UnitCollection = Backbone.Collection.extend({
	//the channel contains audio modules
	model : AUDIO.Unit,

	addUnit : function(unit) {

	},
	initialize : function(attributes, options) {
		this.bind('add', this.addUnit, this);
		this.view = new AUDIO.UnitCollection.View({
			model : this
		});
	},
});

/*
 * AUDIO UNIT COLLECTION
 */
AUDIO.UnitCollection.View = Backbone.View.extend({

	tagName : "div",

	className : "unitCollection",

	events : {
		"click .unitItem" : "unitSelected"
	},
	initialize : function() {
		//listen for added units
		this.listenTo(this.model, "add", this.addUnit);
		//the container
		//this.$container = .appendTo(this.$el);
		//create the three lists
		this.$inputs = $("<div id='inputList' class='collectionList'><div class='unitCollectionTitle unitTitle whitefont'>INPUTS</div></div>").appendTo(this.$el);
		this.$list = $("<div id='unitList' class='collectionList'><div class='unitCollectionTitle unitTitle whitefont'>UNITS</div></div>").appendTo(this.$el);
		this.$outputs = $("<div id='outputList'class='collectionList'><div class='unitCollectionTitle unitTitle whitefont'>OUTPUTS</div></div>").appendTo(this.$el);
		//add them to the dom
		$("#unitBrowser").append(this.$el);
	},
	render : function(collection) {

	},
	addUnit : function(addedUnit) {
		//add the unit to the unit list
		var $newUnit = $("<div id=" + addedUnit.id + " class='unitItem whitefont blackBackground'>" + addedUnit.get("title") + "</div>")
		$newUnit.appendTo(this.$list);
		//offset the height so that it stays in the center
		//this.$list.append()
	},
	unitSelected : function(event) {
		//clear the input and output lists
		this.$inputs.find(".unitItem").remove();
		this.$outputs.find(".unitItem").remove();
		//remove all of the other selected tags
		$(".unitItem").removeClass("selected");
		//add the selected tag to this item
		var $target = $("#"+event.target.id);
		$target.addClass("selected");
		//get the model
		var modelID = $(event.target).attr("id");
		var selected = this.model.get(modelID);
		var inputs = selected.get("inputs")
		//put the inputs in the list
		for(var i = 0, j = inputs.length; i < j; i++) {
			var unit = inputs[i];
			var $newUnit = $("<div id=" + unit.id + " class='unitItem whitefont selected'>" + unit.get("title") + "</div>")
			$newUnit.appendTo(this.$inputs);
		};
		var outputs = selected.get("outputs")
		//put the inputs in the list
		for(var i = 0, j = outputs.length; i < j; i++) {
			var unit = outputs[i];
			var $newUnit = $("<div id=" + unit.id + " class='unitItem whitefont selected'>" + unit.get("title") + "</div>")
			$newUnit.appendTo(this.$outputs);
		};
		//make all the other models invisible
		this.model.models.forEach(function(model){
			model.set("visible", false);
		});
		//change it's visibility
		selected.set("visible", true);
	}
});

/*
 * EACH OF THE ITEMS IN THE LIST
 */
AUDIO.UnitCollection.ListItem = Backbone.View.extend({

	tagName : "li",

	className : "unitListItem",

	initialize : function() {

	}
});
