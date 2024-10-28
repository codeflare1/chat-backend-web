const mongoose = require('mongoose');
const RoomModel = require('../models/roomModel');
const ChatModel = require('../models/chatModel');
const UserModel = require('../models/user.model');
const GroupModel = require('../models/groupModel');

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
    socket.on('joinChat', async ({ senderId, chatId, type }) => {
      try {
        if (type === 'group') {
          // Join group chat
          socket.join(chatId);
          console.log(`User ${senderId} has joined the group chat room ${chatId}.`);
    
          // Fetch previous group messages
          const groupMessages = await ChatModel.find({ groupId: chatId, isBlockedMessage: false })
          .populate('senderId','firstName lastName image _id')
            .sort({ createdAt: -1 });
    
          // Send the group message history
          socket.emit('messageHistory', groupMessages.reverse());
        } else if (type === 'individual') {
          // Handle individual chat
          const roomId = generateRoomID([senderId, chatId]);
          let room = await RoomModel.findOne({
            participants: { $all: [senderId, chatId] },
          });
    
          if (!room) {
            // Create a new room if it doesn't exist
            room = await RoomModel.create({ roomId, participants: [senderId, chatId] });
          }
    
          // Join the individual chat room
          socket.join(room.roomId);
          console.log(`User ${senderId} has joined the individual chat room ${room.roomId}.`);
    
          // Fetch previous individual messages
          const messages = await ChatModel.find({ roomId: room.roomId, isBlockedMessage: false })
          .populate('senderId','firstName lastName image _id')
            .sort({ createdAt: -1 });
    
          // Send the individual message history
          socket.emit('messageHistory', messages.reverse());
        }
      } catch (error) {
        console.error('Error on joinChat:', error);
      }
    });
    
    socket.on('sendMessage', async ({ senderId, chatId, message, fileType, caption, type }) => {
      try {
        if (type === 'group') {
          // Handle sending a group message
          const msg = await ChatModel.create({
            groupId: chatId,
            senderId,
            message,
            fileType,
            caption
          });
    
          // Emit the message to the group room
          io.to(chatId).emit('receiveMessage', {
            senderId,
            message,
            fileType,
            caption,
            createdAt: msg.createdAt,
            type: 'group'
          });
        } else if (type === 'individual') {
          // Handle sending an individual message
          let room = await RoomModel.findOne({
            participants: { $all: [senderId, chatId] },
          });
    
          if (!room) {
            room = await RoomModel.create({ participants: [senderId, chatId] });
          }
    
          const msg = await ChatModel.create({
            roomId: room.roomId,
            senderId,
            receiverId: chatId,
            message,
            fileType,
            caption
          });
    
          // Emit the message to both the sender and receiver's rooms
          io.to(room.roomId).emit('receiveMessage', {
            senderId,
            message,
            fileType,
            caption,
            createdAt: msg.createdAt,
            type: 'individual'
          });
        }
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

    socket.on('createGroup', async ({ adminId, groupName, memberIds,image }) => {
  try {
    // Generate a unique group ID
    const groupId = generateRoomID([adminId, groupName]);
    
    // Create the group in the database
    const group = await GroupModel.create({
      groupId,
      groupName,
      image,
      adminId,
      members: memberIds.map(userId => ({ userId, status: 'pending' })),
    });

    // Notify each member about the group invitation
    memberIds.forEach(memberId => {
      io.to(memberId).emit('groupInvitation', {
        groupId,
        groupName,
        message: `You have been invited to join the group: ${groupName}. Please accept or reject the invitation.`,
      });
    });

    console.log(`Group ${groupName} created with ID ${groupId} by admin ${adminId}`);
  } catch (error) {
    console.error('Error creating group:', error);
  }
});
// User joins a group chat
socket.on('joinGroup', async ({ userId, groupId }) => {
  try {
    // Join the group room
    socket.join(groupId);
    console.log(`User ${userId} has joined the group room ${groupId}.`);

    // Fetch the previous messages for the group
    const groupMessages = await ChatModel.find({ groupId})
      .sort({ createdAt: -1 });
    socket.emit('groupMessageHistory', groupMessages.reverse());
  } catch (error) {
    console.error('Error on joinGroup:', error);
  }
});


socket.on('respondToGroupInvitation', async ({ userId, groupId, response }) => {
  try {
    // Update the member's status in the group
    const group = await GroupModel.findOneAndUpdate(
      { groupId, 'members.userId': userId },
      { $set: { 'members.$.status': response } },
      { new: true }
    );

    if (response === 'accepted') {
      // Notify the group members about the acceptance
      io.to(groupId).emit('groupUpdate', { userId, message: 'User has accepted the invitation.' });

      
    } else {
      // Notify the admin about the rejection
      io.to(group.adminId).emit('groupUpdate', { userId, message: 'User has rejected the invitation.' });
    }
  } catch (error) {
    console.error('Error responding to group invitation:', error);
  }
});
    socket.on('disconnect', async () => {
      console.log('Client disconnected', socket.id);
    });

  });
};