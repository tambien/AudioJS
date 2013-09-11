"use strict";

var AUDIO = {
	/* 
		@const 
	*/
	version : "0.0.2",
	/* the audio context */
	context : new webkitAudioContext(),
	/* 
		set the bpm 
		@param {number} bpm
	*/
	setTempo : function( bpm ){
		// this.METRO.setTempo(bpm);
	}
}
/*=============================================================================
	METRONOME

	beat durations into seconds
=============================================================================*/

AUDIO.METRO = {
	//defaults to 120 in 4/4
	bpm : 120,
	timeSignature : [4,4],
	/** 
		@dict 
		@private
		the durations of the beats in seconds
	*/
	beatDurations : {
		"1n": 2,
		"2n": 1,
		"2t": 2/3,
		"4n": 0.5,
		"4t": 1/3,
		"8n": 0.25,
		"8t": 1/6,
		"16n": 0.125,
		"16t": 1/12,
		"32n": 0.0625,
		"32t": 1/24
	},
	/**
		@dict 
		@private
		the number of beats in a measure in 4/4
	*/
	beatsPerMeasure : {
		"1n" : 1,
		"2n" : 2,
		"2t" : 3,
		"4n" : 4,
		"4t" : 6,
		"8n" : 8,
		"8t" : 12,
		"16n" : 16,
		"16t" : 24,
		"32n" : 32,
		"32t" : 48
	},
	/**
		@dict 
		@const
		@private
		the number of beats in a measure in 4/4
	*/
	measureSubdivision : {
		"1n" : 1,
		"2n" : 2,
		"2t" : 3,
		"4n" : 4,
		"4t" : 6,
		"8n" : 8,
		"8t" : 12,
		"16n" : 16,
		"16t" : 24,
		"32n" : 32,
		"32t" : 48
	},
	/**
		@param {number} bpm
		updates the time bpm
	*/
	setTempo : function(bpm) {
		AUDIO.METRO.bpm = bpm;
		var timeSignature = AUDIO.METRO.timeSignature;
		var timeSigRatio = timeSignature[0] / timeSignature[1];
		var measureInSeconds = (60 / bpm) * 4 * timeSigRatio;
		//set the durations of all the subdivisions
		for(var beat in AUDIO.METRO.beatDurations) {
			var BperM = AUDIO.METRO.beatsPerMeasure[beat];
			var subTime = measureInSeconds / BperM;
			AUDIO.METRO.beatDurations[beat] = subTime;
		}
	},
	/**
		@param {Array.<number>} timeSig
		updates the time siganture
	*/
	setTimeSignature : function(timeSig) {
		AUDIO.METRO.timeSignature = timeSig;
		//update the beats per measure object
		for(var subdivision in AUDIO.METRO.measureSubdivision) {
			//don't count 1n since that's always 1
			if(subdivision !== '1n') {
				var beatCount = parseInt(AUDIO.METRO.measureSubdivision[subdivision] * (timeSig[0] / timeSig[1]), 10);
				AUDIO.METRO.beatsPerMeasure[subdivision] = beatCount;
			}
		}
		//update the tempo values
		AUDIO.METRO.setTempo(AUDIO.METRO.bpm);
	},
	/**
		@private
		the regexp that matches beat format
	*/
	beatFormat : new RegExp(/[0-9]+[nt]$/),
	/**
		@param {string} note
		@return {number} duration of a note string
		accepts relative values as well
	*/
	duration : function( note ) {
		var dur = AUDIO.METRO.beatDurations[note];
		if (!_.isUndefined(dur)) {
			return dur;
		} else if (note.charAt(0)==="+") {
			//remove the + and test the note string
			return AUDIO.METRO.duration(note.substr(1)) + AUDIO.context.currentTime;
		} else if (!AUDIO.METRO.beatFormat.test(note)){
			return parseFloat(note);
		} else {
			return 0;
		}
	}
};/*=============================================================================
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
}/*=============================================================================
	SAMPLE PLAYER

	a simple sample player
=============================================================================*/

/**
	@constructor
	@param {string} url
	@param {function()=} callback
*/
AUDIO.SAMPLE = function(url, callback){
	this.output = AUDIO.context.createGainNode();
	this.buffer = [];
	this.source = null;
	this.state = AUDIO.SAMPLE.states.LOADING;
	//load it up
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';
	// Decode asynchronously
	var self = this;
	request.onload = function() {
		AUDIO.context.decodeAudioData(request.response, function(b) {
			self.buffer = b;
			self.state = AUDIO.SAMPLE.states.LOADED;
			if (callback){
				callback();
			}
		});
	}
	request.send();
}

/**
	@param {number=} time
	@param {number=} start
	@param {number=} duration
*/
AUDIO.SAMPLE.prototype.start = function(time, start, duration){
	if (this.state === AUDIO.SAMPLE.states.LOADED){
		time = this.parseTime(time);
		start = this.parseTime(start);
		duration = this.parseTime(duration) || (this.buffer.duration - start);
		var source = this.source;
		source = AUDIO.context.createBufferSource();
		source.buffer = this.buffer;
		source.connect(this.output);
		if (!_.isUndefined(source.start)){
			source.start(time, start, duration);
		} else {
			//fall back to older web audio implementation
			source.noteGrainOn(time, start, duration);
		}
	} else {
		throw new Error("cannot play file before loaded");
	}
}

/**
	@param {number=} time
	@param {number=} start
	@param {number=} duration
*/
AUDIO.SAMPLE.prototype.loop = function(time, start, duration){
	if (this.state === AUDIO.SAMPLE.states.LOADED){
		time = this.parseTime(time);
		start = this.parseTime(start);
		duration = this.parseTime(duration) || (this.buffer.duration - start);
		var source = this.source;
		source = AUDIO.context.createBufferSource();
		source.buffer = this.buffer;
		source.loop = true;
		source.connect(this.output);
		if (!_.isUndefined(source.loopStart) && !_.isUndefined(source.loopEnd)){
			source.loopStart = start;
			source.loopEnd = duration + start;
			source.start(time, start, duration);
		} else {
			//fall back to older web audio implementation
			source.noteGrainOn(time, start, duration);
		}
	} else {
		throw new Error("cannot play file before loaded");
	}
}

/**
	@param {number=} time
*/
AUDIO.SAMPLE.prototype.stop = function(time){
	time = this.parseTime(time);
	var source = this.source;
	if (!_.isUndefined(source.stop)){
		source.stop(time);
	} else {
		//fall back to older web audio implementation
		source.noteOff(time);
	}
}

/**
	times can be relative or beat relative
	@example 1, 4n, +.5, +4t
	@private
	@param {number|string|undefined} time
	@return {number} the play time
*/
AUDIO.SAMPLE.prototype.parseTime = function(time){
	if (_.isNumber(time)){
		return parseFloat(time);
	} else if (_.isString(time)){
		//if it's a string it could be 1n or +1 or +1n
		if (time.charAt(0) === "+"){
			return this.parseTime(time.substr(1)) + AUDIO.context.currentTime;
		} else {
			//cast it to a string
			return AUDIO.METRO.duration(time+"");
		}
	} else {
		return 0;
	}
}

/**
	@enum
*/
AUDIO.SAMPLE.states = {
	LOADING : 0,
	LOADED : 1
}

/*=============================================================================
	SONG PLAYER

	used for longer sounds
	if MediaElementAudioSourceNode is not supported, falls back to SAMPLE
=============================================================================*/
/*
AUDIO.SONG = function(params){

	this.output = AUDIO.context.createGainNode();

	//load the file
	var url = params.url;
	var audioElement = document.createElement('audio');
	audioElement.setAttribute('src', url);
	audioElement.load();
	audioElement.addEventListener('canplaythrough', params.onload);
	//the media element
	var mediaElement = AUDIO.context.createMediaElementSource(audioElement);
	mediaElement.connect(this.output);

	//set the loop
	var loop = params.loop || false;
	audioElement.loop = loop;

	//play
	this.start = function(){
		audioElement.play();
	}
	//pause
	this.pause = function(){
		audioElement.pause();
	}
	//stop
	this.stop = function(){
		audioElement.stop();	
	}
}*/