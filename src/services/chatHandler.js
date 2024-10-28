const ChatModel = require('../models/chatModel');
const UserModel = require('../models/user.model');
const GroupModel = require('../models/groupModel');

const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const getChatsService = async (query, userId) => {
  console.log(userId);
  query.limit = parseInt(query.limit || 1000);
  query.page = parseInt(query.page || 1);
  const skip = (query.page - 1) * query.limit;
  
  let filter = {
    $or: [
      { senderId: new ObjectId(userId) },
      { receiverId: new ObjectId(userId) }
    ]
  };

  let data, totalRecord;
  data = await ChatModel.aggregate([
    // Match individual chat messages
    { $match: filter },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: query.limit },
    {
      $group: {
        _id: {
          $cond: [
            { $eq: ["$senderId", new ObjectId(userId)] },
            "$receiverId",
            "$senderId"
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
        lastMessage: { $first: "$$ROOT.message" },
        fileType: { $first: "$$ROOT.fileType" },
        createdAt: { $first: "$$ROOT.createdAt" },
        caption: { $first: "$$ROOT.caption" }
      }
    },
    {
      $addFields: {
        chatType: "individual" // Adding a field to indicate chat type
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $lookup: {
        from: 'users',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$_id', '$$userId'] },
              firstName: new RegExp(query.search, 'i'),
              lastName: new RegExp(query.search, 'i')
            }
          },
          {
            $project: { firstName: 1, lastName: 1, image: 1, chatType: { $literal: "individual" } }
          }
        ],
        as: 'user'
      }
    },
    {
      $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
    },
    // Use unionWith to merge individual and group chats
    {
      $unionWith: {
        coll: 'groups',
        pipeline: [
          {
            $match: {
              'members.userId': new ObjectId(userId)
            }
          },
          {
            $lookup: {
              from: 'chats',
              localField: 'groupId',
              foreignField: 'groupId',
              as: 'groupMessages'
            }
          },
          {
            $addFields: {
              lastMessage: {
                $arrayElemAt: [ { $slice: [ "$groupMessages", -1 ] }, 0 ]
              }
            }
          },
          {
            $addFields: {
              lastMessage: "$lastMessage.message" // Extracting only the message field
            }
          },
          {
            $project: {
              _id: '$groupId',
              groupName: '$groupName',
              adminId: '$adminId',
              image: '$image',
              createdAt: '$createdAt',
              chatType: { $literal: "group" },
              lastMessage: 1, 

              user: {
                firstName: '$groupName',
                lastName: null,
                image: '$image',
                _id:'$groupId',
                chatType: { $literal: "group" },

              }

            }
          }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);
  

  totalRecord = await ChatModel.countDocuments(filter) + await GroupModel.countDocuments({ 'members.userId': new ObjectId(userId) });

  console.log('data', data);
  return {
    data: data,
    // pagination: getPaginationObject(totalRecord, query.page, query.limit)
  };
};

  const getUsersService = async (query, userId) => {
    try {
      console.log("query", query);
      // Convert search keyword to a case-insensitive regular expression
      const searchRegex = new RegExp(query.search, 'i');
      let limit = parseInt(query.limit || 1000);
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