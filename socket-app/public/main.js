$(function() {
  var FADE_TIME = 150; // ms
  var TYPING_TIMER_LENGTH = 400; // ms
  var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
  ];

  // Initialize variables
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); // Input for username
  var $messages = $('.messages'); // Messages area
  var $inputMessage = $('.inputMessage'); // Input message input box

  var $loginPage = $('.login.page'); // The login page
  var $chatPage = $('.chat.page'); // The chatroom page

  // Prompt for setting a username
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();

  var socket = io('http://ec2-54-146-185-68.compute-1.amazonaws.com');
//var socket = io();
  const addParticipantsMessage = (data) => {
    var message = '';
    if (data.numUsers === 1) {
      message += "there's 1 participant";
    } else {
      message += "there are " + data.numUsers + " participants";
    }
    log(message);
  }

  // Sets the client's username
  const setUsername = () => {
    username = cleanInput($usernameInput.val().trim());

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();

      // Tell the server your username
      socket.emit('add user', username);
      socket.emit('join conversations', {
        //userId: '67be443e-1366-4660-8a4f-86311009d62d',
        userId: '0274d8c4-e5dd-4559-ae53-e5aba185a13c',
        //userId: 'a1289f46-dd45-4fd8-ac73-2115a53a01bc',
        token: 'eyJraWQiOiJxT1wvRGxjWHFFZHV5QkVud2paK3d4NTl3N2xrcU9TQkFyendNbFJFMVZwTT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIwMjc0ZDhjNC1lNWRkLTQ1NTktYWU1My1lNWFiYTE4NWExM2MiLCJhdWQiOiI1MDVoanBpdG5rYjVuY25wZWQ5NWVlOGs1YyIsImV2ZW50X2lkIjoiOWJiMTk0NDctZTY2ZC0xMWU4LWEyZTItOTNjYzdiYzU3OTFhIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE1NDIwMjE5MDcsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbVwvdXMtZWFzdC0xX3RYRGtlbnNrdyIsImNvZ25pdG86dXNlcm5hbWUiOiJhcmlmIiwiZXhwIjoxNTQyMDQxNzk0LCJnaXZlbl9uYW1lIjoiQXJpZiIsImlhdCI6MTU0MjAzODE5NCwiZmFtaWx5X25hbWUiOiJLaGFuIiwicGljdHVyZSI6Imh0dHA6XC9cL2FyaWZqYXVucHVyLnRrXC9hcmlma2hhbiJ9.PRskUSfmEu6lMWuJX-f0uMtU_vqgb4FQTUkYidAUqzLmXSSzrInHI-kQRgqVwy9SutqYjB2HaNfgHcJUGt4OTGE4V967M_cSHyX_FVL4Kv4RqhUA9goLDDJKFV-XPdLtJ8vnj2obyLc7vl7VSlXrS0qqQa28q3PKEw3lhar0jPaFBE89fvS2spKaEF8IaE1wQmZF-I6J8uvQ2deyiNs3Da_z9QBFHs76Lw9F-QFKHKgSzIL1WncqRPDN1ih91x0MPADtCcjpY1En-NxmKgyWM7Kpq3aKeDLcw6dW5DsTxxNWw7GpJ9QeGq9zFTEuxE_kEqGcdib91A8u2-GTnoZRfA'
      })
    }
  }

  socket.on('join conversation', (data) => { 
    console.log('data ', data);
    //socket.emit('join conversation', data);
  });
  socket.on('leave conversation', (data) => { 
    console.log('data ', data);
    //socket.emit('join conversation', data);
  });
  socket.on('close conversation', (data) => { 
    console.log('data ', data);
  });
  socket.on('vote proposal changes', (data) => { 
    console.log('data ', data);
  });
  socket.on('action proposal changes', (data) => { 
    console.log('data ', data);
  });
  socket.on('conversation message', (data) => { 
    console.log('data ', data);
  });
  // Sends a chat message
  const sendMessage = () => {
    var message = $inputMessage.val();
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      // tell server to execute 'new message' and send along one parameter
      socket.emit('new message', message);
    }
  }

  // Log a message
    const log = (message, options) => {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  const addChatMessage = (data, options) => {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  // Adds the visual chat typing message
  const addChatTyping = (data) => {
    data.typing = true;
    data.message = 'is typing';
    addChatMessage(data);
  }

  // Removes the visual chat typing message
  const removeChatTyping = (data) => {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  const addMessageElement = (el, options) => {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  const cleanInput = (input) => {
    return $('<div/>').text(input).html();
  }

  // Updates the typing event
  const updateTyping = () => {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();

      setTimeout(() => {
        var typingTimer = (new Date()).getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit('stop typing');
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  const getTypingMessages = (data) => {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Gets the color of a username through our hash function
  const getUsernameColor = (username) => {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // Keyboard events

  $window.keydown(event => {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stop typing');
        typing = false;
      } else {
        setUsername();
      }
    }
  });

  $inputMessage.on('input', () => {
    updateTyping();
  });

  // Click events

  // Focus input when clicking anywhere on login page
  $loginPage.click(() => {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(() => {
    $inputMessage.focus();
  });

  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', (data) => {
    console.log('login', data);
    connected = true;
    // Display the welcome message
    var message = "Welcome to Socket.IO Chat – ";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  socket.on('join conversations', (data) => {
    console.log(data,  ' joined');
    socket.emit('join conversations', data);
  });

  socket.on('join conversation', (data) => {
    console.log(data,  ' joined');
    socket.emit('join conversation', data);
  });

  socket.on('leave conversation', (data) => {
    console.log(data,  ' joined');
    socket.emit('leave conversation', data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on('new message', (data) => {
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', (data) => {
    log(data.username + ' joined');
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on('user left', (data) => {
    log(data.username + ' left');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on('typing', (data) => {
    addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on('stop typing', (data) => {
    removeChatTyping(data);
  });

  socket.on('disconnect', () => {
    log('you have been disconnected');
  });

  socket.on('reconnect', () => {
    log('you have been reconnected');
    if (username) {
      socket.emit('add user', username);
    }
  });

  socket.on('reconnect_error', () => {
    log('attempt to reconnect has failed');
  });

});
