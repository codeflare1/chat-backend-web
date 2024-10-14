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
},{
  timestamps:true
});


 const Rooms = mongoose.model('rooms',roomsSchema);
 module.exports = Rooms;
