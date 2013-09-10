"use strict";

/*=============================================================================
	OSC-Style message/event mediatator pattern with timing
=============================================================================*/

(function(){
	/*
		@private
		@dict
		a dictionary of all the routes and callbacks
	*/
	var routes = {};
	/* 
		subscribe method
		@param {string} address
		@param {function(AUDIO.MESSAGE)} callback
		@param {Object=} context optional context
	*/
	AUDIO.route  = function(address, callback, context){
		//bind the context
		if (context){
			callback = _.bind(callback, context);
		}
		// to keep the OSC-look,
		// the address should start with a leading slash (remove it)
		if (address.charAt(0) !== '/'){
			address = address.substr(1);
		}
		//split the address by '/'
		var splitted = address.split('/');
		//insert the route into the routes object
		var routeLevel = routes;
		for (var depth = 0; depth < splitted.length; depth++){
			if (_.isUndefined(routeLevel[splitted[depth]]){
				routeLevel[splitted[depth]].callbacks = [callback];
			} else {
				routeLevel = routeLevel[splitted[depth]];
				if ()
			}
		}
	},
	/*
		schedule / trigger a message
		@param {string} pattern
		@param {number} timestamp
		@param {Object=} data
	*/
	AUDIO.schedule = function(pattern, timestamp, data){

	},
	/*
		trigger a message immediately
		@param {string} pattern
		@param {Object=} data
	*/
	AUDIO.trigger = function(pattern, data){

	}
}());

/*=========================================================================
		SCHEDULER
=========================================================================*/


AUDIO.SCHEDULER = (function(){
	/* @const */
	var bufferSize = 1024;

	/* the javascript node used as the scheduler loop */
	var jsNode  = AUDIO.context.createJavaScriptNode(bufferSize, 1, 1);
	jsNode.connect(AUDIO.context.destination);
	jsNode.onaudioprocess = loop;

	/* @private */
	var scheduledMsgs = [];
	
	/*
		callback loop for audio processing
		@param {AudioProcessingEvent} event
	*/
	function loop ( event ){
		var bufferSize = event.inputBuffer.length;
		var bufferTime = bufferSize / AUDIO.context.sampleRate;
		//when are they going to implement the playbackTime?
		var playbackTime = event.playbackTime || AUDIO.context.currentTime;
		var bufferPeriod = playbackTime + bufferTime;
		//route all of the message's whose timetag is <= the current time period
		while(scheduledMsgs.length > 0 && scheduledMsgs[0].timetag <= bufferPeriod) {
			var msg = scheduledMsgs.shift();
			// match(msg);
		}
	}

	return {
		/* @private */
		jsNode : jsNode,
		/* @private */
		loop : loop,
		/*
			@param {Object} msg
		*/
		add : function(msg){
			
		}
	}
}());

/* 
	@param {string} address
	@param {Object=} callback
	@struct
	@constructor
*/
AUDIO.SCHEDULER.ROUTE = function(address, callback){
	this.address = address
}

/*
AUDIO.SCHEDULER.ROUTE.prototype.patternToRegex = function(pattern) {
	if (context){
		_.bind(callback, context);
	}
	//translate osc-style patterns into RegExp
	pattern = pattern.replace("*", ".+");
	pattern = pattern.replace('{', "(");
	pattern = pattern.replace('}', ")");
	pattern = pattern.replace(',', "|");
	pattern = pattern.replace('?', '.');
	//match '!' only if after '['
	pattern = pattern.replace('[!', '[^');
	//add the end-of-line to the pattern so that it stops matching
	pattern += '$';
	var regExp = new RegExp(pattern);
	return regExp;
};*/

	

/*=========================================================================
	MESSAGE
=========================================================================*/
/* 
	@param {string} address
	@param {Object=} data
	@param {Object=} timestamp
	@struct
	@constructor
*/
AUDIO.MESSAGE = function(address, data, timestamp){
	this.address = address;
	this.data = data;
	this.timestamp = parseInt(timestamp)||1;
	/* @private */
	this.pattern = this.hasPattern();
	/* @private */
	this.addressArray = address.split("/");
	// //add it to the scheduler
	// AUDIO.OSC.SCHEDULER.schedule(this);
};

/*
	@private
*/
AUDIO.MESSAGE.prototype.hasPattern = function(){
	return this.address.match(/[\*\[\]\{\}\-\,?]/)==null;
}