
const mongoose = require('mongoose');

const chatsSchema = new mongoose.Schema({
  senderId:{
    type :mongoose.Schema.Types.ObjectId,
    required:true,
    ref : 'User'
  },
  receiverId:{
    type :mongoose.Schema.Types.ObjectId,
    required:false,
    ref : 'User'
  },
  groupId: {  type:String,
    required:false
  }, 
  message:{
    type:String,
    required:true,
  },
  roomId:{
    type:String,
    required:false,
  },
  fileType:{
    type:String,
    required:false,
    default:null
  },
  caption:{
    type:String,
    required:false,
    default:null
  },
  isSeen:{
    type:Boolean,
    required:false,
    default:false
  },
  isBlockedMessage:{
    type:Boolean,
    required:false,
    default:false
  },
},{
  timestamps:true
});

const Chats = mongoose.model('chats',chatsSchema);

module.exports = Chats;
