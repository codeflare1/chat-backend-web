const mongoose = require('mongoose');

const roomsSchema =  new mongoose.Schema({
  participants:[{type: mongoose.Schema.Types.ObjectId}],
  roomId:{
    type:String,
    required:true,
  },
  isAdmin:{
    type:Boolean,
    required:false,
  },
  callType: {
    type: String,
    enum: ['audio', 'video'], // Define if it's a video or audio call
    required: false,
  },
  callStatus: {
    type: String,
    enum: ['ongoing', 'ended', 'missed'],
    default: 'ongoing',
  },
},{
  timestamps:true
});


 const Rooms = mongoose.model('rooms',roomsSchema);
 module.exports = Rooms;
