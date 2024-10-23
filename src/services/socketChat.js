const mongoose = require('mongoose');
const RoomModel = require('../models/roomModel');
const ChatModel = require('../models/chatModel');
const UserModel = require('../models/user.model');
const ObjectId = mongoose.Types.ObjectId;
const {getChatsService,getUsersService} = require('./chatHandler')
const generateRoomID = (room) => {
  return room.join('_');
};
module.exports = function (io) {
  io.on('connection', (socket) => {
    console.log('New client connected', socket.id);
    // User joins their room
    socket.on('join', async ({ senderId }) => {
      socket.join(senderId);
      console.log(`User ${senderId} has connected and joined their room.`);
    });
    // User-to-user chat
    socket.on('joinChat', async ({ senderId, receiverId }) => {
      try {
        console.log('user joinChat', { senderId, receiverId });
        const roomId = generateRoomID([senderId, receiverId]);
        console.log('roomId', roomId);
        let room = await RoomModel.findOne({
          participants: { $all: [senderId, receiverId] },
        });
        if (!room) {
          room = await RoomModel.create({ roomId, participants: [senderId, receiverId] });
        } else {
          await ChatModel.updateMany(
            { roomId: room.roomId, senderId: new ObjectId(receiverId), isSeen: false },
            { $set: { isSeen: true } },
            { new: true }
          );
        }
        socket.join(room.roomId);
        io.to(roomId).emit('userJoined', `"i m" has joined the room`);
        // Fetch previous messages in the room
        const messages = await ChatModel.find({ roomId: room.roomId, isBlockedMessage: false })
          .sort({ createdAt: -1 })
          // .limit(10);
        socket.emit('messageHistory', messages.reverse());
        const chats = await getChatsService({ limit: 1000, page: 1 }, senderId);
        console.log('chats', chats);
        socket.emit('getChats', chats);
      } catch (error) {
        console.error('Error on join:', error);
      }
    });
    socket.on('sendMessage', async ({ senderId, receiverId, message,fileType,caption }) => {
      try {
        console.log('lof for send message ', { senderId, receiverId, message,fileType });
        let room = await RoomModel.findOne({
          participants: { $all: [senderId, receiverId] },
        });
        console.log(' room.roomId', room.roomId);
        const msg = await ChatModel.create({ roomId: room.roomId, senderId, receiverId, message,fileType,caption });
        io.to(room.roomId).emit('receiveMessage', { senderId, message, createdAt: msg.createdAt,fileType });
        const senderChats = await getChatsService({ limit: 1000, page: 1 }, senderId);
        const receiverChats = await getChatsService({ limit: 1000, page: 1 }, receiverId);

        console.log('chats-------0', senderChats, receiverChats);
        io.to(senderId).emit('getChats', senderChats);
        io.to(receiverId).emit('getChats', receiverChats);
      } catch (error) {
        console.error('Error on sendMessage:', error);
      }
    });
    socket.on('getAllChats', async ({ senderId, limit = 1000, page = 1, type }) => {
      try {
        const chats = await getChatsService({ limit, page, type }, senderId);
        socket.emit('getChats', chats);
        console.log(chats)
      } catch (error) {
        console.error('Error on sendMessage:', error);
      }
    });
    socket.on('markAsSeen', async ({ senderId, receiverId }) => {
      try {
        const readChat = await ChatModel.updateMany(
          { senderId: new ObjectId(receiverId), receiverId: new ObjectId(senderId), isSeen: false },
          { $set: { isSeen: true } },
          { new: true }
        );
        io.to(senderId).emit('messagesSeen', { roomId: readChat.roomId, receiverId, isSeen: true });
      } catch (error) {
        console.error('Error on markAsSeen:', error);
      }
    });
    socket.on('getAllUser', async ({ limit = 100, page = 1, search = '' }) => {
      try {
        const chats = await getUsersService({ limit, page,search });
        socket.emit('getAllUserResponse', chats);
        console.log(chats)

      } catch (error) {
        console.error('Error on getAllUser:', error);
      }
    });
    socket.on('disconnect', async () => {
      console.log('Client disconnected', socket.id);
    });
  });
};