
const mongoose = require('mongoose');

const chatsSchema = new mongoose.Schema({
  senderId:{
    type :mongoose.Schema.Types.ObjectId,
    required:true,
    ref : 'users'
  },
  receiverId:{
    type :mongoose.Schema.Types.ObjectId,
    required:false,
    ref : 'users'
  },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, 
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
/**
 * @typedef User
 */
const Chats = mongoose.model('chats',chatsSchema);

module.exports = Chats;
