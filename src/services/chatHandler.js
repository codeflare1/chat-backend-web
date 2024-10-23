const ChatModel = require('../models/chatModel');
const UserModel = require('../models/user.model');
const GroupModel = require('../models/groupModel');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const getChatsService = async (query, userId) => {
  query.limit = parseInt(query.limit || 10000);
  query.page = parseInt(query.page || 1);
  const skip = (query.page - 1) * query.limit;

  let individualChats, groupChats;

  // Fetch individual chats
  individualChats = await ChatModel.aggregate([
    {
      $match: {
        $or: [
          { senderId: new ObjectId(userId) },
          { receiverId: new ObjectId(userId) }
        ]
      }
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: query.limit },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ['$senderId', new ObjectId(userId)] },
            '$receiverId',
            '$senderId'
          ]
        },
        unseenCount: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$receiverId', new ObjectId(userId)] }, { $eq: ['$isSeen', false] }] },
              1,
              0
            ]
          }
        },
        lastMessage: { $first: '$$ROOT.message' },
        fileType: { $first: '$$ROOT.fileType' },
        createdAt: { $first: '$$ROOT.createdAt' }
      }
    },
    {
      $lookup: {
        from: 'users',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$_id', '$$userId'] }
            }
          },
          {
            $project: { firstName: 1, lastName: 1, image: 1 }
          }
        ],
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    }
  ]);

  // Fetch group chats
  groupChats = await GroupModel.aggregate([
    { $match: { participants: new ObjectId(userId) } },
    {
      $lookup: {
        from: 'chats',
        let: { groupId: '$_id' },

        pipeline: [
          { $match: { $expr: { $eq: ['$groupId', '$$groupId'] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 }
        ],
        as: 'lastMessage'
      }
    },
    {
      $unwind: {
        path: '$lastMessage',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        groupName: 1,
        groupImage: 1,
        lastMessage: '$lastMessage.message',
        lastMessageTime: '$lastMessage.createdAt'
      }
    }
  ]);

  // Combine individual and group chats, then sort by last message time
  const combinedChats = [
    ...individualChats.map(chat => ({
      type: 'individual',
      id: chat._id,
      lastMessage: chat.lastMessage,
      lastMessageTime: chat.createdAt,
      user: chat.user,
      unseenCount: chat.unseenCount,
      fileType: chat.fileType
    })),
    ...groupChats.map(chat => ({
      type: 'group',
      id: chat._id,
      groupName: chat.groupName,
      groupImage: chat.groupImage,
      lastMessage: chat.lastMessage,
      lastMessageTime: chat.lastMessageTime
    }))
  ].sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

  return {
    data: combinedChats
  };
};

  const getUsersService = async (query, userId) => {
    try {
      console.log("query", query);
      // Convert search keyword to a case-insensitive regular expression
      const searchRegex = new RegExp(query.search, 'i');
      let limit = parseInt(query.limit || 10);
      let page = parseInt(query.page || 1);
      const skip = (page - 1) * limit;
  
      // Find users where the phoneNumber, firstName, or lastName matches the search keyword
      const filter = {
        $or: [
          { phoneNumber: { $regex: searchRegex } },
          { firstName: { $regex: searchRegex } },
          { lastName: { $regex: searchRegex } }
        ]
      };
  
      // Pagination options
      const options = {
        limit: limit,
        skip: skip
      };
      console.log("filter",filter)
      console.log("options",options)

      // Query the database with the search and pagination
      const users = await UserModel.find(filter, {firstName:1,lastName:1,image:1,phoneNumber:1},options);
      console.log('users',users)
      const total = await UserModel.countDocuments(filter); // Total matching users for pagination
  
      // Return the filtered and paginated users
      return {
        users,
        total,
        page,
        limit
      };
    } catch (error) {
      console.error('Error on getAllUser:', error);
      throw error;
    }
  };
  
  module.exports = { getChatsService,getUsersService};
