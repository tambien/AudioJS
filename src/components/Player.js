/*=============================================================================
	SAMPLE PLAYER

	a simple sample player
=============================================================================*/

AUDIO.SAMPLE = function(params){

	this.output = AUDIO.context.createGainNode();

	//the buffer
	var buffer, source;

	//load it up
	var url = params.url;
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';
	// Decode asynchronously
	request.onload = function() {
		AUDIO.context.decodeAudioData(request.response, function(b) {
			buffer = b;
			params.onload();
		});
	}
	request.send();

	//play
	this.start = function(time){
		time = time || AUDIO.context.currentTime;
		source = AUDIO.context.createBufferSource();
		source.buffer = buffer;
		source.connect(this.output);
		source.noteOn(time);
		//set the loop
		var loop = params.loop || false;
		source.loop = loop;
	}
	//pause
	this.pause = function(time){
		time = time || AUDIO.context.currentTime;
		source.noteOff(time);
	}
	//stop
	this.stop = function(time){
		time = time || AUDIO.context.currentTime;
		source.noteOff(time);
	}
}

/*=============================================================================
	SONG PLAYER

	used for longer sounds
	if MediaElementAudioSourceNode is not supported, falls back to SAMPLE
=============================================================================*/

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
}