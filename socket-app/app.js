const http = require('http');

const redis = require("redis");
const express = require('express');
const socketio = require('socket.io');
const redisAdapter = require('socket.io-redis');

const config = require('./config');
const request = require('./request');

const authMiddleware = (req, res, next)=> {
  const token = true;//req.headers['authorization'];
  //TODO: verify token needed
  if(token) return next();
  res.status(401).json({ "message": "The incoming token has expired"});
}
const port = process.env.PORT || 3000;

const app = express();
const server  = http.createServer(app);
const io = socketio(server);
const redisClient = redis.createClient(config.redis);

app.use(express.json());
app.use(express.static('./public'));
io.adapter(redisAdapter(config.redis));

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

const joinConversation = (data) => {
  if(data && data.conversationId && data.users) {
    console.log('joinConversation: conversationId', data.conversationId);
    data.users.forEach(user => {
      redisClient.get(user, (err, socketId) => {
        if(err) console.log(err);
        if(!err && socketId) {
          console.log('join socketId ', socketId);
          io.of('/').adapter.remoteJoin(socketId, data.conversationId, () => {});
        }
      });
    });
  }
}
const leaveConversation = (data) => {
  if(data && data.conversationId && data.users){
    console.log('leaveConversation: conversationId', data.conversationId);
    data.users.forEach(user => {
      redisClient.get(user, (err, socketId) => {
        if(err) console.log(err);
        if(!err && socketId) {
          console.log('leave socketId ', socketId);
          io.of('/').adapter.remoteLeave(socketId, data.conversationId, () => {});
        }
      });
    });
  }
}
const closeConversation = (data) => {
  if(data && data.conversationId){
    console.log('closeConversation: conversationId', data.conversationId);
    io.in(data.conversationId).clients((err, clients) => {
      if(err) console.log('Error 1 ', err);
      if(!err && clients) {
        console.log('close room' + data.conversationId);
        clients.forEach(client => io.of('/').adapter.remoteLeave(client, data.conversationId, (err) => {if(err) console.log('Error 2 ', err);}));
      }
    });
  }
}
const proposalChangesAction = (data) => {
  if(data && data.conversationId && data.message) {
    console.log('proposalChangesAction: conversationId', data.conversationId);
    io.to(data.conversationId).emit('action proposal changes', {
      fromUser: data.fromUser,
      message: data.message
    });
  }
}
const proposalChangesVote = (data) => {
  if(data && data.hostId && data.message) {
    console.log('proposalChangesVote: hostId', data.hostId);
    redisClient.get(data.hostId, (err, socketId) => {
      if(socketId) {
        console.log('proposalChangesVote: host socket', data.socketId);
        io.to(socketId).emit('vote proposal changes', {
          fromUser: data.fromUser,
          message: data.message
        });
      }
    });
  }
}
const conversationMessage = (data, socket) => {
  const socketObj = socket || io;
  if(data && data.conversationId && data.message) {
    console.log('conversationMessage: conversationId', data.conversationId);
    socketObj.to(data.conversationId).emit('conversation message', {
      fromUser: socket ? (data.fromUser || socket.userId) : data.fromUser,
      message: data.message
    });
  }
}

io.on('connection', (socket) => {
  console.log('new socket ' + socket.id);

  socket.on('join conversations', async (data) => {
    if(data && data.token && data.userId) {
      try {
        const result = await request.getConversations(data.token);
        if(result && result.conversations) {
          redisClient.set(data.userId, socket.id, () => {});
          socket.userId = data.userId;
          console.log(result.conversations.length, data.userId, socket.id);
          result.conversations.forEach( conversation => io.of('/').adapter.remoteJoin(socket.id, conversation.id, () => {}));
        }
        
      } catch (err) {
        console.log('Error: ', err.message);
      }
    }
  });
  socket.on('join conversation', joinConversation);
  socket.on('leave conversation', leaveConversation);
  socket.on('close conversation', closeConversation);
  socket.on('vote proposal changes', proposalChangesVote);
  socket.on('action proposal changes', proposalChangesAction);
  socket.on('conversation message', (data)=> conversationMessage(data, socket));
  socket.on('disconnect', () => {
    console.log('disconnect: socket ' + socket.id + ' of userId '+ socket.userId);
    if(socket.userId) {
      redisClient.del(socket.userId, () => {});
    }
  });
});


app.post('/api/socketio/operations', authMiddleware, (req, res) => {
  const data = req.body;
  console.log(data);
  switch(data.operation) {
    case 'conversation message' : conversationMessage(data);
    break;
    case 'action proposal changes' : proposalChangesAction(data);
    break;
    case 'vote proposal changes' : proposalChangesVote(data);
    break;
    case 'join conversation' : joinConversation(data);
    break;
    case 'leave conversation' : leaveConversation(data);
    break;
    case 'close conversation' : closeConversation(data);
    break;
  }
  res.json({message: 'success'});
})

/*
setInterval(() => {
  console.log('total connected sockets = ' + Object.keys(io.sockets.sockets).length);
}, 10000);
*/