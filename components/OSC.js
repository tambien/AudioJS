"use strict";

/*=============================================================================
	OSC-Style message/event mediatator pattern
=============================================================================*/

AUDIO.OSC = {};

/*=========================================================================
		SCHEDULER
=========================================================================*/

AUDIO.OSC.SCHEDULER = function(){
	addMessage : function ( msg ){

	}
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
};

/* 
	@param {Object | Array.<Object>=} messages
*/
AUDIO.OSC.PACKET.prototype.addMessage = function(messages){
	Object.prototype.toString.call(messages) == "[object Array]";
}