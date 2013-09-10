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
		} else if (!this.beatFormat.test(note)){
			return parseFloat(note);
		} else {
			return 0;
		}
	}
};