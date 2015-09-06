/**
 * This class represent an cross-browser 'wheel' event listener.<br />
 *
 * @author Nikolay Zamulov <zamulov8@gmail.com>
 * @version 0.0.1
 *
 * @constructor
 * @public
 **/
function WheelEventListener() { }



/**
 * Static method that attached to element 'wheel' event.<br />
 *
 * @function
 * @public
 * @static
 * @return {void}
 * @param {Object} elem - Element that must attach 'wheel' event.
 * @param {Function} func - Callback for event occured.
 **/
WheelEventListener.addHandler = function(elem, func) {
	if (elem.addEventListener) {
		if ('onwheel' in document) {
			// IE9+, FF17+
			elem.addEventListener("wheel", func);
		} else if ('onmousewheel' in document) {
			// old event variant
			elem.addEventListener("mousewheel", func);
		} else {
			// Firefox < 17
			elem.addEventListener("MozMousePixelScroll", func);
		}
	} else { // IE8-
		elem.attachEvent("onmousewheel", func);
    }
}