/*=============================================================================
	TRANSPORT

	keeps track of the duration of the 
=============================================================================*/

"use strict";

AUDIO.TRANS = {
	/* @private */
	startTime : 0,
	/* @private */
	pauseDuration : 0,
	/* @private */
	pausedTime : 0,
	/* @private */
	state : 'READY',
	/* start / restart the transport */
	start : function(){
		if (this.state === "READY" || this.state === "STOPPED"){
			this.startTime = AUDIO.context.currentTime;
		} else if (this.state ==="PAUSED"){
			this.pauseDuration += AUDIO.context.currentTime - this.pausedTime;
		}
		this.state = "STARTED";
	},
	/* stop the metro */
	stop : function(){
		this.state = "STOPPED";
		this.startTime = 0;
		this.pauseDuration = 0;
		this.pausedTime = 0;
	},
	/* pause it */
	pause : function(){
		if (this.state === "STARTED"){
			this.state = "PAUSED";
			this.pausedTime = AUDIO.context.currentTime;
		}
	},
	/*
		@return {number} elapsed time in seconds
	*/
	getTime : function(){
		if (this.state === "STARTED"){
			return AUDIO.context.currentTime - this.startTime - this.pauseDuration;
		} else if (this.state === "PAUSED"){
			return this.pausedTime - this.startTime - this.pauseDuration ;
		} else {
			return 0;
		}
	},
	/*
		@return {number} the measure number
	*/
	getMeasure : function(){
		var elapsedTime = this.getTime();
	},
	/*
		@return {number} the beat number
	*/
	getBeat : function(){

	}
}