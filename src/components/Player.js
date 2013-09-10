/*=============================================================================
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
	//load it up
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';
	// Decode asynchronously
	var self = this;
	request.onload = function() {
		AUDIO.context.decodeAudioData(request.response, function(b) {
			self.buffer = b;
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
	time = time || AUDIO.context.currentTime;
	start = start || 0;
	duration = duration || (this.buffer.duration - start);
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
}

/**
	@param {number=} time
	@param {number=} start
	@param {number=} duration
*/
AUDIO.SAMPLE.prototype.loop = function(time, start, duration){
	time = time || AUDIO.context.currentTime;
	start = start || 0;
	duration = duration || (this.buffer.duration - start);
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
}

/**
	@param {number=} time
*/
AUDIO.SAMPLE.prototype.stop = function(time){
	time = time || AUDIO.context.currentTime;
	if (!_.isUndefined(source.stop)){
		this.source.stop(time);
	} else {
		//fall back to older web audio implementation
		this.source.noteOff(time);
	}
	
}

/**
	@enum
*/
AUDIO.SAMPLE.states = {
	LOADING : 0,
	READY : 1,
	PLAYING : 2
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