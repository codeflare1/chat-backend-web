const ChatModel = require('../models/chatModel');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

 const getChatsService = async(query,userId)=>{
  console.log(userId)
    query.limit = parseInt(query.limit || 10);
    query.page = parseInt(query.page || 1);
    const skip = (query.page - 1) * query.limit;
    let filter = {$or: [
        { senderId: new ObjectId(userId) },
        { receiverId: new ObjectId(userId) }
    ]};
    let data , totalRecord
    // if(query.type  === 'blocked'){
    //   data =await  Blocked.aggregate([
    //     {
    //       $match:{
    //         blockerId:new ObjectId(userId)
    //       }
    //     },
    //     { $skip: skip},
    //     { $limit: query.limit},
    //     {
    //       $lookup: {
    //         from: 'chats',
    //         let: { currentUserId: new ObjectId(userId),blockedId: '$blockedId' },
    //         pipeline: [
    //           {
    //             $match: {
    //               $expr: {$and: [
    //                 {
    //                     $or: [
    //                         { $eq: ['$senderId', '$$currentUserId'] },
    //                         { $eq: ['$receiverId', '$$currentUserId'] }
    //                     ]
    //                 },
    //                 {
    //                     $or: [
    //                         { $eq: ['$senderId', '$$blockedId'] },
    //                         { $eq: ['$receiverId', '$$blockedId'] }
    //                     ]
    //                 }
    //             ] },
    //             },
    //           },
    //           {
    //             $sort: { createdAt: -1 }
    //           },
    //           {
    //             $group: {
    //                 _id: {
    //                     $cond: [
    //                         { $eq: ["$senderId", new ObjectId(userId)] },
    //                         "$receiverId",
    //                         "$senderId"
    //                     ]
    //                 },
    //                 unseenCount: {
    //                   $sum: {
    //                       $cond: [
    //                           { $and: [{ $eq: ['$receiverId', new ObjectId(userId)] }, { $eq: ['$isSeen', false] }] },
    //                           1,
    //                           0
    //                       ]
    //                   }
    //               },
    //                 lastMessage: { $first: "$$ROOT.message" },
    //                 createdAt: { $first: "$$ROOT.createdAt" },
        
    //             }
    //         },
    //         {
    //           $lookup: {
    //             from: 'users',
    //             let: { userId: '$_id' },
    //             pipeline: [
    //               {
    //                 $match: {
    //                   $expr: { $eq: ['$_id', '$$userId'] },
    //                   name: new RegExp(query.search, 'i')
    //                 }
    //               },
    //               {
    //                 $project:{name:1,profilePicture:1}
    //               },
    //             ],
    //             as: 'user'
    //           }
    //         },
    //         {
    //           $unwind:'$user'
    //         },
    //         ],
    //         as: 'chats'
    //       }
    //     },
    //     {
    //       $unwind:'$chats'
    //     },
      
    //     {
    //       $project: {
    //         lastMessage: '$chats.lastMessage',
    //           createdAt: '$chats.createdAt',
    //           unseenCount:'$chats.unseenCount',
    //           user: '$chats.user'
    //       }
    //   },
    //   ])
    //   totalRecord = data?.length
    // } else if(query.type  === CONSTANTS_MANAGER.CHATS_TYPE.REPORTED){
    //       data =await  Reported.aggregate([
    //     {
    //       $match:{
    //         reporterId:new ObjectId(userId)
    //       }
    //     },
    //     { $skip: skip},
    //     { $limit: query.limit},
    //     {
    //       $lookup: {
    //         from: 'chats',
    //         let: { currentUserId: new ObjectId(userId),reportedId: '$reportedId' },
    //         pipeline: [
    //           {
    //             $match: {
    //               $expr: {$and: [
    //                 {
    //                     $or: [
    //                         { $eq: ['$senderId', '$$currentUserId'] },
    //                         { $eq: ['$receiverId', '$$currentUserId'] }
    //                     ]
    //                 },
    //                 {
    //                     $or: [
    //                         { $eq: ['$senderId', '$$reportedId'] },
    //                         { $eq: ['$receiverId', '$$reportedId'] }
    //                     ]
    //                 }
    //             ] },
    //             },
    //           },
    //           {
    //             $sort: { createdAt: -1 }
    //           },
    //           {
    //             $group: {
    //                 _id: {
    //                     $cond: [
    //                         { $eq: ["$senderId", new ObjectId(userId)] },
    //                         "$receiverId",
    //                         "$senderId"
    //                     ]
    //                 },
    //                 unseenCount: {
    //                   $sum: {
    //                       $cond: [
    //                           { $and: [{ $eq: ['$receiverId', new ObjectId(userId)] }, { $eq: ['$isSeen', false] }] },
    //                           1,
    //                           0
    //                       ]
    //                   }
    //               },
    //                 lastMessage: { $first: "$$ROOT.message" },
    //                 createdAt: { $first: "$$ROOT.createdAt" },
        
    //             }
    //         },
    //         {
    //           $lookup: {
    //             from: 'users',
    //             let: { userId: '$_id' },
    //             pipeline: [
    //               {
    //                 $match: {
    //                   $expr: { $eq: ['$_id', '$$userId'] },
    //                   name: new RegExp(query.search, 'i')
    //                 }
    //               },
    //               {
    //                 $project:{name:1,profilePicture:1}
    //               },
    //             ],
    //             as: 'user'
    //           }
    //         },
    //         {
    //           $unwind:'$user'
    //         },
    //         ],
    //         as: 'chats'
    //       }
    //     },
    //     {
    //       $unwind:'$chats'
    //     },
    //     {
    //       $project: {
    //         lastMessage: '$chats.lastMessage',
    //           createdAt: '$chats.createdAt',
    //           unseenCount:'$chats.unseenCount',
    //           user: '$chats.user'
    //       }
    //   },
    //   ])
    //   totalRecord = 12
    // }
    //  else {
      // if(query.type  === 'unread'){
      //   filter.isSeen = false
      // }
      data = await ChatModel.aggregate([
        {$match:filter},
        {$sort:{createdAt:-1}},
        { $skip: skip},
        { $limit: query.limit},
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
              createdAt: { $first: "$$ROOT.createdAt" },
  
          }
      },
      {
        $sort: { 'createdAt': -1 }
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
                $project:{firstName:1,lastName:1,image:1}
              },
            ],
            as: 'user'
          }
        },
        {
          $unwind:'$user'
        },
      ]);
      console.log(filter)
     totalRecord = await ChatModel.countDocuments(filter)
    // }
    console.log('data',data)
    return {
      data:data,
      // pagination:getPaginationObject(totalRecord,query.page,query.limit)
    };
  };

  module.exports = { getChatsService };
