/*=============================================================================
	METRONOME

	beat durations into seconds
=============================================================================*/

AUDIO.METRO = {
	//defaults to 120 in 4/4
	bpm : 120,
	timeSignature : [4,4],
	/* 
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
	/* 
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
		"32t" : 48,
	},
	/* 
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
		"32t" : 48,
	},
	/*
		@param {number} bpm
		updates the time bpm
	*/
	setTempo : function(bpm) {
		this.bpm = bpm;
		var timeSigRatio = this.timeSignature[0] / this.timeSignature[1];
		var measureInSeconds = (60 / bpm) * 4 * timeSigRatio;
		//set the durations of all the subdivisions
		for(beat in this.beatDurations) {
			var BperM = this.beatsPerMeasure[beat];
			var subTime = measureInSeconds / BperM;
			this.beatDurations[beat] = subTime;
		}
	},
	/*
		@param {Array.<number>} timeSig
		updates the time siganture
	*/
	setTimeSignature : function(timeSig) {
		this.timeSignature = timeSig;
		//update the beats per measure object
		for(subdivision in this.measureSubdivision) {
			//don't count 1n since that's always 1
			if(subdivision !== '1n') {
				var beatCount = parseInt(this.measureSubdivision[subdivision] * (timeSig[0] / timeSig[1]));
				this.beatsPerMeasure[subdivision] = beatCount;
			}
		}
		//update the tempo values
		this.setTempo(this.bpm);
	},
	/*
		@param {string} note
		@return {number} duration of a note string
		accepts relative values as well
	*/
	duration : function( note ) {
		var dur = this.beatDurations[note];
		if (!_.isUndefined(dur)) {
			return dur;
		} else if (note.charAt(0)==="+") {
			//remove the + and test the note string
			return this.duration(note.substr(1)) + AUDIO.context.currentTime;
		} else {
			return 0;
		}
	}
};