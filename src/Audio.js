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
		var osc = new AUDIO.Oscillator().connect(AUDIO.output);
		//create the master track
		//masterTrack = new AUDIO.MasterChannel();
		//push the master track to the array
		//masterTrack = new AUDIO.Channel($masterContainer);
		//the master track connects to the audio output
		//masterTrack.connect(context.destination);
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
