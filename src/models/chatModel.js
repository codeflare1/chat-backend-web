
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
  message:{
    type:String,
    required:true,
  },
  roomId:{
    type:String,
    required:false,
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
