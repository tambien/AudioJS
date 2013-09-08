/******************************************************************************
 __   __  _______  _______  ______    _______ 
|  |_|  ||       ||       ||    _ |  |       |
|       ||    ___||_     _||   | ||  |   _   |
|       ||   |___   |   |  |   |_||_ |  | |  |
|       ||    ___|  |   |  |    __  ||  |_|  |
| ||_|| ||   |___   |   |  |   |  | ||       |
|_|   |_||_______|  |___|  |___|  |_||_______|

keeps time

version 0.1.1
******************************************************************************/

( function() {

	//the METRONOME object
	window.METRO = window.METRO || {};

	/**************************************************************************
	 AUDIO CONTEXT
	 *************************************************************************/

	//if there isn't already an audioContext
	if (!window.audioContext){
		//make a new one
		if ( window.webkitAudioContext ) {
			window.audioContext = new webkitAudioContext();
		} else if ( window.AudioContext ) {
			window.audioContext = new AudioContext();
		}
	}
	//local version
	var audioContext = window.audioContext;

	//test if there is 

	/**************************************************************************
	 SCHEDULER
	 *************************************************************************/

	//the priority queue of scheduled msgs
	var scheduledMsgs = [];
	//the jsnode
	var scheduler;

	function onAudioProcess (event) {
		var bufferSize = event.inputBuffer.length;
		var bufferTime = bufferSize / audioContext.sampleRate;
		//when are they going to implement the playbackTime?
		var playbackTime = event.playbackTime || audioContext.currentTime;
		var bufferPeriod = playbackTime + bufferTime;
		//route all of the message's whose timetag is <= the current time period
		while(scheduledMsgs.length > 0 && scheduledMsgs[0].timetag <= bufferPeriod) {
			var msg = scheduledMsgs.shift();
			match(msg);
		}
	}

	METRO.schedule = function(msg) {
		//make sure the message is formatted correctly
		parseMsg(msg);
		//insert the message in the right position
		var insertIndex = 0;
		var len = scheduledMsgs.length;
		while(insertIndex < len) {
			var testMsg = scheduledMsgs[insertIndex];
			//if the next message is bigger, put it right before
			if(testMsg.timetag >= msg.timetag) {
				break;
			}
			insertIndex++;
		}
		scheduledMsgs.splice(insertIndex, 0, msg);
		return msg;
	};

	/**************************************************************************
	 ROUTING
	 *************************************************************************/

	//the array of listeners waiting for a msg
	var routes = [];

	//the route function adds a listener to a pattern
	//and invokes the callback when a msg matching that pattern is scheduled
	METRO.route = function(pattern, callback) {
		//add a listener to the queue
		var router = {
			pattern : pattern,
			regExp : regExpFromPattern(pattern),
			callback : callback,
		}
		routes.push(router);
		return router;
	};
	//like route, but get's removed from the route array after it's routed
	METRO.routeOnce = function(pattern, callback) {
		//add a listener to the queue
		var router = {
			pattern : pattern,
			regExp : regExpFromPattern(pattern),
			callback : callback,
			once : true,
		}
		routes.push(router);
		return router;
	};
	//remove a route from the list
	METRO.unroute = function(router) {
		for(var i = 0, len = routes.length; i < len; i++) {
			var testRouter = routes[i];
			if(testRouter === router) {
				routes.splice(i, 1);
				break;
			}
		}
	}
	//the match function called by the scheduler when a msgs is invoked
	function match(msg) {
		var newRoutes = [];
		for(var r = 0, len = routes.length; r < len; r++) {
			var router = routes[r];
			if(router.regExp.test(msg.address)) {
				router.callback(msg);
				//if it's a 'once', don't add it to the newRoutes list
				if(!router.once) {
					newRoutes.push(router);
				}
			} else {
				newRoutes.push(router);
			}
		}
		routes = newRoutes;
	};

	//translates OSC regular expressions to RegExp
	function regExpFromPattern(pattern) {
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

	/**************************************************************************
	 MSG PARSER
	 *************************************************************************/

	//make sure all of the fields are in order
	function parseMsg(msg) {
		//messages must have an address
		if(!msg.address) {
			console.error("the message needs an address");
		}
		//handle the timetag
		var timetag = msg.timetag;
		//if it's a string
		if( typeof timetag === 'string') {
			//it could be a relative value: "+1.2"
			//or beat relative like "+1n" happens in 1 measure from now
			if(timetag.charAt(0) === "+") {
				var num = timetag.slice(1);
				//test if it's a beat format
				var beatFormat = new RegExp(/[0-9]+[nt]$/);
				if (beatFormat.test(num)){
					//get the duration of the beat
					msg.timetag = audioContext.currentTime+ beatDurations(num);
				} else {
					msg.timetag = audioContext.currentTime + parseFloat(num);
				}
			} else {
				//or just a number as a string
				msg.timetag = parseFloat(timetag);
			}
		} else if( typeof timetag !== 'number') {
			//otherwise it's 0
			msg.timetag = 0;
		}
	};

	/**************************************************************************
	 TIMING
	 *************************************************************************/

	//the durations of all the beats
	var beatDurations = {
		"1n" : 0,
		"2n" : 0,
		"2t" : 0,
		"4n" : 0,
		"4t" : 0,
		"8n" : 0,
		"8t" : 0,
		"16n" : 0,
		"16t" : 0,
		"32n" : 0,
		"32t" : 0,
	}

	//the durations of all the beats
	var beatsPerMeasure = {
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
	}

	// the subdivisions of the measure in 4/4 time
	var measureSubdivision = {
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
	}

	//timing getter
	METRO.getDuration = function(subdivision){
		var dur = beatDurations[subdivision];
		dur = dur || 0;
		return dur;
	}

	/**************************************************************************
	 TEMPO and TIME SIGNATURE
	 *************************************************************************/

	//some default values
	var bpm = 120;
	var timeSignature = [4, 4];

	//sets the tempo, either instantly or over a period of time
	function setTempo(bpm) {
		var timeSigRatio = timeSignature[0] / timeSignature[1];
		var measureInSeconds = (60 / bpm) * 4 * timeSigRatio;
		//set the durations of all the subdivisions
		for(beat in beatDurations) {
			var BperM = beatsPerMeasure[beat];
			var subTime = measureInSeconds / BperM;
			beatDurations[beat] = subTime;
		}
	};

	//updates the time siganture
	function setTimeSignature(timeSig) {
		timeSignature = timeSig;
		//update the beats per measure object
		for(subdivision in measureSubdivision) {
			//don't count 1n since that's always 1
			if(subdivision !== '1n') {
				var beatCount = parseInt(measureSubdivision[subdivision] * (timeSig[0] / timeSig[1]));
				beatsPerMeasure[subdivision] = beatCount;
			}
		}
	};

	//state is either 'counting', 'stopped', or 'paused'
	var state = 'stopped';

	/**************************************************************************
	 ECHO
	 *************************************************************************/

 	//add the msg listener
	METRO.route("/metro/*", echo);

	//this function schedules a new message when one is recieved
	function echo(msg) {
		//get the subdivision from the address
		var sub = msg.address.split("/")[2];
		//increment the counter
		var count = msg.data + 1;
		//roll over when the beat has reached it's max for that subdivision
		if(sub !== '1n') {
			var max = beatsPerMeasure[sub];
			count = count % max;
		}
		//get the next beat time
		var nextTime = msg.timetag + beatDurations[sub];
		//schedule the new msg
		METRO.schedule({
			address : msg.address,
			timetag : nextTime,
			data : count,
		});
	}

	/**************************************************************************
	 CONTROLS
	 *************************************************************************/

	METRO.start = function(args) {
		//set the state
		state = 'counting';
		//parse the arguments
		args = args || {};
		var tempo = args.bpm || bpm;
		var timeSig = args.timeSignature || timeSignature;
		var subdivision = args.subdivision || ["1n", '4n', '8n'];
		var bufferSize = args.bufferSize || 512;
		var delay = args.delay || 0;
		setTimeSignature(timeSig);
		setTempo(tempo);
		//schedule the first messages
		var now = audioContext.currentTime + delay;
		for(var s = 0; s < subdivision.length; s++) {
			var sub = subdivision[s];
			METRO.schedule({
				address : "/metro/" + sub,
				timetag : now,
				//starts with a count of 0
				data : 0,
			});
		}
		//start the jsnode
		scheduler = audioContext.createJavaScriptNode(bufferSize, 1, 1);
		scheduler.onaudioprocess = onAudioProcess;
		scheduler.connect(audioContext.destination);
	};

	METRO.stop = function(when) {
		//set the state
		state = 'stopped';
		//clear all the messages
		scheduledMsgs = [];
		//disconnect the jsnode
		scheduler.disconnect();
	};
}());
