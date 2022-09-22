// const config = require('../config');
const request = require('./request');

// const io = require("socket.io-emitter")(config.redis);
// const redisClient = require("redis").createClient(config.redis);

module.exports = {
  sendMessage: (conversationId, message, fromUser) => {
    request.postOperation({
      message,
      fromUser,
      conversationId,
      operation: 'conversation message'
    }).then(()=>{}).catch((err)=>{console.log(err)});
    // io.to(conversationId).emit("conversation message", {
    //   fromUser,
    //   message
    // });
  },
  proposalChangesAction: (conversationId, message, fromUser) => {
    console.log('proposalChangesAction ', conversationId, message, fromUser);
    request.postOperation({
      message,
      fromUser,
      conversationId,
      operation: 'action proposal changes'
    }).then(()=>{}).catch((err)=>{console.log(err)});
    // io.to(conversationId).emit("action proposal changes", {
    //   fromUser,
    //   message
    // });
  },
  proposalChangesVote: (hostId, message, fromUser) => {
      console.log('proposalChangesVote ', hostId, message, fromUser);
      request.postOperation({
        message,
        fromUser,
        hostId,
        operation: 'vote proposal changes'
      }).then(()=>{}).catch((err)=>{console.log(err)});

    // redisClient.get(hostId, (err, socketId) => {
    //     console.log('socketId ', socketId, err);
    //   if (err || !socketId) return err;
    //   console.log('socketId ', socketId, err);
    //   io.in(socketId).emit("vote proposal changes", {
    //     fromUser,
    //     message
    //   });
    // });
  },
  closeConversation: async (conversationId, fromUser) => {
    request.postOperation({
        conversationId,
        operation: 'close conversation'
    }).then(()=>{}).catch((err)=>{console.log(err)});
    // redisClient.get(fromUser, (err, socketId) => {
    //   if (err || !socketId) return err;
    //   io.to(socketId).emit("close conversation", conversationId);
    // });
  },
  addConversation: (conversationId, fromUser, users) => {
    request.postOperation({
        users,
        conversationId,
        operation: 'join conversation',
    }).then(()=>{}).catch((err)=>{console.log(err)});
    // redisClient.get(fromUser, (err, socketId) => {
    //   if (err || !socketId) return err;
    //   io.to(socketId).emit("join conversation", {
    //     users,
    //     conversationId
    //   });
    // });
  },
  leaveConversation: (conversationId, fromUser) => {
    request.postOperation({
        users: [fromUser],
        conversationId,
        operation: 'leave conversation',
    }).then(()=>{}).catch((err)=>{console.log(err)});
    // redisClient.get(fromUser, (err, socketId) => {
    //   if (err || !socketId) return err;
    //   io.to(socketId).emit("leave conversation", conversationId);
    // });
  },
};