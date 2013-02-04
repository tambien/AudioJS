//initialize the application once the page has loaded
$(function() {
	AUDIO.initialize();
})
/*
 * AUDIO
 *
 * some necessary structure and control for Web Audio applications
 *
 * construct, control, visualize components
 */
var AUDIO = function() {

	//GLOBALS//////////////////////////////////////////////////////////////////

	var version = "0.0.1";

	//the audio context
	var context = new webkitAudioContext();

	//array of all of the audio nodes
	var audioNodes = [];

	//all of the audio units
	var allUnits;

	//the jquery selector for the container
	var $audioContainer;

	//the master fader
	var mainOutput;

	//INITIALIZATION////////////////////////////////////////////////////////////////

	function init() {
		console.log("AUDIO.js version " + version);
		//reference the unit container
		AUDIO.container = $("#unitContainer");
		//the collection of units
		AUDIO.units = new AUDIO.UnitCollection();
		//the master output
		AUDIO.output = new AUDIO.MasterGain();
		//the metronome
		AUDIO.metronome = new AUDIO.Metronome();
		//a little sample synthesizer
		var gain = new AUDIO.Gain({
			title : "synth level"
		}).connect(AUDIO.output);
		var filter = new AUDIO.Filter().connect(gain);
		var osc = new AUDIO.Oscillator({
			title : "tone"
		}).connect(filter);
		var tremolo = new AUDIO.Oscillator({
			title : "tremolo"
		}).connect(osc);
		var adsr = new AUDIO.ADSR({
			release : .1
		}).connect(osc, 0, 1);
		var scale = new AUDIO.Scale({
			toMin : 30,
			toMax : 400
		});
		var filterAdsr = new AUDIO.ADSR({
			attack : .1,
			title : "filterADSR"
		}).connect(scale);
		scale.connect(filter, 0, 1);
		//have the adsr trigger each quarter
		adsr.listenTo(AUDIO.metronome, "change:2n", function(model, value, time) {
			filterAdsr.triggerAttack(time);
			filterAdsr.triggerRelease(time);
			this.triggerAttack(time);
			this.triggerRelease(time);
			/*
			filter.input[1].setValueAtTime(0, time);
			filter.input[1].linearRampToValueAtTime(200, time+.1);
			filter.input[1].linearRampToValueAtTime(300, time+.15);
			filter.input[1].linearRampToValueAtTime(0, time+.2);
			*/
			//osc.set("frequency", AUDIO.Util.randomInt(200, 1000), time);
		});
	}

	//CHANNELS//////////////////////////////////////////////////////////////////////

	//creates a channel
	function addChannel() {
		var channel = new AUDIO.Channel();
	}

	//SYNTHESIZERS/////////////////////////////////////////////////////////////
	function addONEZER(channelNum) {
		//audioChannels[channelNum].add(new AUDIO.Oscillator());
	}

	//GUI//////////////////////////////////////////////////////////////////////

	//INTERFACE////////////////////////////////////////////////////////////////

	return {
		initialize : init,
		/*
		 * CORE
		 */
		context : context,
		nodes : audioNodes,
		//transport: transport,
		/*
		* VISUAL CONTEXT
		*/
		//show: show,
		//hide: hide,
		/*
		* COMPONENTS
		*/
		//addGain: addGain,
		//addCompressor: addCompressor,
		//addReverb: addReverb,
		//addFilter: addFilter,
		//addEQ3: addEQ3,
		//addEQ8: addEQ8,
		/*
		* AUDIO SOURCES
		*/
		//addBufferPlayer: addBufferPlayer,
		/*
		* SYNTHESIZERS
		*/
		//addTHREEZER: addTHREEZER,
		//addONEZER : addONEZER,
	}
}();
