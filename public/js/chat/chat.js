/**
 * Chat allows players speak to each other and coordinate important things.
 * It will be used simple customizing chat that was created special for this game.<br />
 *
 * This class represent a Chat object.<br />
 *
 * @author Nikolay Zamulov <zamulov8@gmail.com>
 * @version 0.0.1
 *
 * @constructor
 * @public
 * @param {Object} socket - Connection to server of current user.
 **/
var Chat = function(socket) {



	/**
	 * Cashing all main elements.<br />
	 *
	 * @private
	 * @type {Object}
	 **/
	var chat = document.getElementById('room-menu-chat-area');
	var text = document.getElementById('room-menu-text-area');
	var message = document.getElementById('room-menu-message');



	/**
	 * Create scroll object for current chat.<br />
	 *
	 * @private
	 * @type {Scroll}
	 **/
	var scroll = new Scroll(document.getElementById('room-menu-scroll'), text, 300);



	/**
	 * Add 'Wheel' event to scroll if text in chat is overflowing by using
	 * special 'WheelEventListener' object for cross-browser event attachment.<br />
	 **/
    WheelEventListener.addHandler(chat, scroll.onWheel);



    /**
     * 'OnKeyUp' keyboard event in message box of current chat.<br />
     *
     * @function
     * @event MessageBox#OnKeyUp
     * @param {Object} e - event.
     **/
    message.onkeyup = function(e) {

    	// '13' is the ASCII code of 'Enter' key.
		if(13 === e.keyCode) {

			// If no character in message box then nothing do.
			if('' === message.value) return;

			// Send user message to server.
			socket.emit('sendChatMessage', {
				id: socket.gameIndex,
				name: socket.userName,
				message: message.value
			});

			// Clear message box.
			message.value = '';
		}
	}



	/**
	 * Recieve messages from other players.<br />
	 *
	 * @callback
	 * @param {Object} data - Dataset from server.
	 **/
	socket.on('sendChatMessage', function(data) {
		if('userMessage' === data.type) {
			text.innerHTML += ('<li>(' + data.time + ') ' + data.name + ': <span style="color:white;background:rgba(0,0,0,0);">' + data.message + '</span></li>');
		} else {
			text.innerHTML += ('<li><span style="color:rgb(117, 113, 94);font-style:italic;background:rgba(0,0,0,0);">' + data.message + '</span></li>')
		}

		scroll.update();
	});



	/**
	 * Reset scroll height if needed.<br /> 
	 *
	 * @function
	 * @public
	 * @return {void}
	 **/
	this.resetScroll = function() {
		scroll.reset();
	}



	/**
	 * Update scroll if needed.<br />
	 *
	 * @function
	 * @public
	 * @return {void}
	 **/
	this.updateScroll = function() {
		scroll.update();
	}



}