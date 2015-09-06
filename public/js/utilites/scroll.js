/**
 * Scroll allow you to watch the entire chat history at any moment.<br />
 *
 * This class represent a Scroll object.<br />
 *
 * @author Nikolay Zamulov <zamulov8@gmail.com>
 * @version 0.0.1
 *
 * @constructor
 * @public
 * @param {DOM Element} scroll - Scroll of current chat object.
 * @param {DOM Element} text - All history of chat messages.
 * @param {Number} textWrapperHeight - Height of available region in chat that can be display.
 **/
var Scroll = function(scroll, text, textWrapperHeight) {



    /**
     * Save context.<br />
     *
     * @private
     * @type {Object}
     **/
    var that = this;



	/**
	 * Save 'textWrapperHeight' in current object.<br />
	 *
	 * @public
	 * @type {Number}
	 **/
	this.textWrapperHeight = textWrapperHeight;



	/**
	 * Set the correspondence between available region and all text in chat.
	 * In other words, what part available region takes in all text in chat.<br />
	 *
	 * @public
	 * @type {Number}
	 **/
	this.scale = (this.textWrapperHeight / text.offsetHeight);



	/**
	 * Current height of scroll.<br />
	 *
	 * @public
	 * @type {Number}
	 **/
	this.heightOfScroll = this.scale * this.textWrapperHeight;



	/**
	 * The flag indicates whether the scroll is located at the bottom.<br />
	 *
	 * @public
	 * @default
	 * @type {Boolean}
	 **/
	this.inDown = true;



	// DELETE !?
	scroll.style.height = this.heightOfScroll + 'px';



	/**
	 * Executes whenever new message inserted in chat.
	 * Function change all scroll inner settings and update its height.
	 * If flag 'isDown' was setted then change scroll position.<br />
	 *
	 * @function
	 * @public
	 * @this {Scroll}
	 * @return {void}
	 **/
	this.update = function() {
		if(text.offsetHeight > this.textWrapperHeight) {
			this.scale = (this.textWrapperHeight / text.offsetHeight);
			this.heightOfScroll = this.scale * this.textWrapperHeight;
			scroll.style.height = this.heightOfScroll + 'px';
			if(true === this.inDown) {
				scroll.style.top = (this.textWrapperHeight - scroll.offsetHeight) + 'px';
				text.style.top = (-text.offsetHeight + this.textWrapperHeight) + 'px';
			}
		} else {
			scroll.style.height = '0px';
			text.style.top = '0px';
		}
	}



	/**
	 * Change scroll and text position.
	 * Needed to 'Wheel' event only.<br />
	 *
	 * @function
	 * @public
	 * @this {Scroll}
	 * @param {Number} y - current position on the Y axis.
	 * @return {void}
	 **/
    this.changeScrollAndTextPosition = function(y) {
    	if(text.offsetHeight > this.textWrapperHeight) {
	    	if(y < 0) {
				scroll.style.top = '0px';
				text.style.top = '0px';
				this.inDown = false;
			} else if(y + scroll.offsetHeight > this.textWrapperHeight) {
				scroll.style.top = (this.textWrapperHeight - scroll.offsetHeight) + 'px';
				text.style.top = (-text.offsetHeight + this.textWrapperHeight) + 'px';
				this.inDown = true;
			} else {
				scroll.style.top = y + 'px';
				text.style.top = -(scroll.offsetTop / this.scale) + 'px';
				this.inDown = false;
			}
		}
    }



    /**
     * Reset scroll height. Just make it disappeared.<br />
     *
     * @function
     * @public
     * @return {void}
     **/
    this.reset = function() {
    	scroll.style.height = '0px';
    }



    /**
     * 'OnMouseDown' mouse event above scroll element.<br />
     * 
     * @function
     * @event Scroll#OnMouseDown
     * @param {Object} e - event.
     **/
    scroll.onmousedown = function(e) {

		var shiftY = e.pageY - scroll.offsetTop - (scroll.offsetHeight / 2);

		document.onmousemove = function(e) {
			that.changeScrollAndTextPosition(e.pageY - (scroll.offsetHeight / 2) - shiftY);
		}

		document.onmouseup = function() {
			document.onmousemove = null;
			document.onmouseup = null;
		}
	}



	/**
	 * 'Wheel' mouse event above chat is occured.<br />
	 *
	 * @function
	 * @public
	 * @event Scroll#Wheel
	 * @param {Object} e - event.
	 **/
	this.onWheel = function(e) {

		e = e || window.event;

		// IE doesn't support .preventDefault().
		e.preventDefault ? e.preventDefault() : (e.returnValue = false);

		// deltaY, detail contain pixels.
		// wheelDelta don't allow to know count of pixels.
		// onwheel || MozMousePixelScroll || onmousewheel
		var delta = e.deltaY || e.detail || e.wheelDelta;

		if(delta > 0) delta = 100;
		else if(delta < 0) delta = -100;
		else delta = 0;

		that.changeScrollAndTextPosition(scroll.offsetTop + delta * that.scale);
	}
}