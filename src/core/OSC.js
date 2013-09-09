"use strict";

/*=============================================================================
	OSC-Style message/event mediatator pattern
=============================================================================*/

AUDIO.OSC = {
	/*
		@private
	*/
	routes : [],
	/* 
		@param {string} route
		@param {function(AUDIO.OSC.MESSAGE)} callback
	*/
	route : function(route, callback){
		var r = new AUDIO.OSC.SCHEDULER.ROUTE(route, callback);
		this.routes.push(r);
	}
};

/*=========================================================================
		SCHEDULER
=========================================================================*/

AUDIO.OSC.SCHEDULER = {
	/* 
		@param {AUDIO.OSC.PACKET} pkt
	*/
	addPacket : function ( pkt ){

	},
	/*
		@private
	*/
	loop : function(){
		
	}
};

/*=========================================================================
		ROUTE

		a route and callback
=========================================================================*/

/*
	@constructor
	@param {string} pattern
	@param {function(AUDIO.OSC.MESSAGE)} callback
*/

AUDIO.OSC.SCHEDULER.ROUTE = function(pattern, callback){
	this.pattern = pattern;
	this.callback = callback;
	this.regex = this.patternToRegex(pattern);
}

/*
	@private
	@param {string} pattern
	@param {function(AUDIO.OSC.MESSAGE)} callback
	@return {Object} a RegExp form of the pattern
*/
AUDIO.OSC.SCHEDULER.ROUTE.prototype.patternToRegex = function(pattern) {
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
};

AUDIO.OSC.SCHEDULER.ROUTE.prototype.match = function(address){

}
	

/*=========================================================================
	MESSAGE
=========================================================================*/
/* 
	@param {string} address
	@param {Object} data
	@constructor
*/
AUDIO.OSC.MESSAGE  = function(address, data){
	this.address = address;
	this.data = data;
};


/*=========================================================================
	PACKET
=========================================================================*/
/* 
	@param {number} timestamp (in milliseconds)
	@param {Array.<Object>=} messages
	@constructor
*/
AUDIO.OSC.PACKET  = function(timestamp, messages){
	this.timestamp = parseInt(timestamp);
	this.messages = messages||[];
	//add it to the scheduler
	AUDIO.OSC.SCHEDULER.addPacket(this);
};

/* 
	adds either an array or a message to the array
	@param {AUDIO.OSC.MESSAGE | Array.<AUDIO.OSC.MESSAGE>=} messages
*/
AUDIO.OSC.PACKET.prototype.addMessage = function(messages){
	if(Object.prototype.toString.call(messages) == "[object Array]"){
		this.messages = this.messages.concat(messages);
	} else {
		this.messages.push(messages);
	}
}