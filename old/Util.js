/*
 * things that are useful
 */

AUDIO.Util = function() {

	// From http://baagoe.com/en/RandomMusings/javascript/
	// Johannes BaagÃ¸e <baagoe@baagoe.com>, 2010
	function Mash() {
		var n = 0xefc8249d;
		var mash = function(data) {
			data = data.toString();
			var i;
			for( i = 0; i < data.length; i++) {
				n += data.charCodeAt(i);
				var h = 0.02519603282416938 * n;
				n = h >>> 0;
				h -= n;
				h *= n;
				n = h >>> 0;
				h -= n;
				n += h * 0x100000000;
				// 2^32
			}
			return (n >>> 0) * 2.3283064365386963e-10;
			// 2^-32
		};

		mash.version = 'Mash 0.9';
		return mash;
	};

	// From http://baagoe.com/en/RandomMusings/javascript/
	function Alea() {
		return ( function(args) {
			// Johannes BaagÃ¸e <baagoe@baagoe.com>, 2010
			var s0 = 0;
			var s1 = 0;
			var s2 = 0;
			var c = 1;

			if(args.length == 0) {
				args = [+new Date];
			}
			var mash = Mash();
			s0 = mash(' ');
			s1 = mash(' ');
			s2 = mash(' ');

			for(var i = 0; i < args.length; i++) {
				s0 -= mash(args[i]);
				if(s0 < 0) {
					s0 += 1;
				}
				s1 -= mash(args[i]);
				if(s1 < 0) {
					s1 += 1;
				}
				s2 -= mash(args[i]);
				if(s2 < 0) {
					s2 += 1;
				}
			}
			mash = null;

			var random = function() {
				var t = 2091639 * s0 + c * 2.3283064365386963e-10;
				// 2^-32
				s0 = s1;
				s1 = s2;
				return s2 = t - ( c = t | 0);
			};
			random.uint32 = function() {
				return random() * 0x100000000;
				// 2^32
			};
			random.fract53 = function() {
				return random() + (random() * 0x200000 | 0) * 1.1102230246251565e-16;
				// 2^-53
			};
			random.version = 'Alea 0.9';
			random.args = args;
			return random;

		}(Array.prototype.slice.call(arguments)));
	};

	/*
	 * random number generator that's better than Math.random().
	 * @parameters seed value if reproducibility is desired.
	 * @returns random value between 0. and 1.
	 * @example var random = Alea(); random(); // returns 0.6198398587293923
	 */
	var random = Alea();

	/*
	 * pass in an array, and it will choose randomly one of the elements.
	 */
	var choose = function(arg) {
		var winner = toInt(arg.length * random());
		return arg[winner];
	};
	/*
	 * sourced from http://snippets.dzone.com/posts/show/849
	 * @parameter array to be shuffled
	 * @returns a shuffled copy of the input array
	 */
	var shuffleArray = function(arr) {
		var o = arr.slice(0);
		for(var j, x, i = o.length; i; j = parseInt(random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	};
	/*
	 * returns a random integer in the range of min to max
	 */
	var randomInt = function(min, max) {
		return (~~((random() * (max - min)) + min));
	};
	/*
	 * returns a random float in the range of min to max
	 */
	var randomFloat = function(min, max) {
		var scaled = min + random() * (max - min);
		return scaled;
	};
	/*
	 * flips a coin to give a random binary outcome
	 */
	var flipCoin = function() {
		return random() < .5;
	}
	/*
	 * scales an input value from the range min to max to the new range of minScale to maxScale
	 */
	var scale = function(value, min, max, minScale, maxScale) {
		var scaled = minScale + (value - min) / (max - min) * (maxScale - minScale);
		return scaled;
	}
	/*
	 * scales an input value from the range min to max to the new range of minScale to maxScale
	 */
	var scaleInt = function(value, min, max, minScale, maxScale) {
		var scaled = minScale + (value - min) / (max - min) * (maxScale - minScale);
		return toInt(scaled);
	}
	/*
	 * logarithmically scales an input value
	 */
	var scaleLog = function(value, min, max, minScale, maxScale) {

		if(minScale < 1 || maxScale < 1) {
			console.error("the scaled to values must be at least 1");
			return value;
		}

		var minv = Math.log(minScale);
		var maxv = Math.log(maxScale);

		// calculate adjustment factor
		var scaled = (maxv - minv) / (max - min);

		return Math.exp(minv + scaled * (value - min));
	}
	/*
	 * exponentially scale a value
	 */
	var scaleExp = function(value, minScale, maxScale, min, max) {
		var minv = Math.log(minScale);
		var maxv = Math.log(maxScale);

		// calculate adjustment factor
		var scaled = (maxv - minv) / (max - min);
		
		return (Math.log(value) - minv) / scaled + min;
	}
	/*
	 * faster than Math.abs, but not really necessary
	 */
	var abs = function(x) {
		return (x < 0 ? -x : x);
	};
	/*
	 * fastest way to truncate a value into an integer
	 */
	var toInt = function(x) {
		return ~~x;
	};
	/*
	 * ensures that value is between min and max
	 */
	var clip = function(value, min, max) {
		if(value < min)
			return min;
		if(value > max)
			return max;
		return value;
	};
	//INTERFACE////////////////////////////////////////////////////////////////
	return {
		//RANDOM
		random : random,
		choose : choose,
		shuffleArray : shuffleArray,
		flipCoin : flipCoin,
		randomInt : randomInt,
		randomFloat : randomFloat,
		//SCALING
		scale : scale,
		scaleInt : scaleInt,
		scaleLog : scaleLog,
		scaleExp : scaleExp,
		//NUMBERS
		abs : abs,
		toInt : toInt,
		clip : clip,
	}

}();
