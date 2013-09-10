/*=============================================================================
	TRANSPORT

	does not handle tempo changes once the metronome is started
=============================================================================*/

AUDIO.TRANS = {
	/**	@private */
	startTime : 0,
	/**	@private */
	pauseDuration : 0,
	/**	@private */
	pausedTime : 0,
	/**	@private */
	state : 'READY',
	/* start / restart the transport */
	start : function(){
		var self = AUDIO.TRANS;
		if (self.state === "READY" || self.state === "STOPPED"){
			self.startTime = AUDIO.context.currentTime;
		} else if (self.state ==="PAUSED"){
			self.pauseDuration += AUDIO.context.currentTime - self.pausedTime;
		}
		self.state = "STARTED";
	},
	/* stop the metro */
	stop : function(){
		var self = AUDIO.TRANS;
		self.state = "STOPPED";
		self.startTime = 0;
		self.pauseDuration = 0;
		self.pausedTime = 0;
	},
	/* pause it */
	pause : function(){
		var self = AUDIO.TRANS;
		if (self.state === "STARTED"){
			self.state = "PAUSED";
			self.pausedTime = AUDIO.context.currentTime;
		}
	},
	/*
		@return {number} elapsed time in seconds
	*/
	getTime : function(){
		var self = AUDIO.TRANS;
		if (self.state === "STARTED"){
			return AUDIO.context.currentTime - self.startTime - self.pauseDuration;
		} else if (self.state === "PAUSED"){
			return self.pausedTime - self.startTime - self.pauseDuration ;
		} else {
			return 0;
		}
	},
	/**
		@return {number} the measure number
	*/
	getMeasure : function(){
		var self = AUDIO.TRANS;
		return parseInt(self.getTime() / AUDIO.METRO.duration("1n"), 10);
	},
	/**
		@return {number} the beat number
	*/
	getBeat : function(){
		var self = AUDIO.TRANS;
		return parseInt(self.getTime() / AUDIO.METRO.duration("4n"), 10) % AUDIO.METRO.timeSignature[0];
	}
}