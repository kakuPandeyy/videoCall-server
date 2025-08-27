const http = require('http')
const express = require('express')
const {Server } = require('socket.io')
const { error } = require('console')
require('dotenv').config()

const app = express()
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // React frontend URL
    methods: ["GET", "POST"]
  }
})


const rooms =  new Map()
const offerMap = new Map()

function validation(arr,user) {

  const mySet = new Set()
  arr.forEach(element => {
    mySet.add(element.username)
  });

    const res = [...mySet]
    // console.log(res)

    const exist = res.includes(user)

    // console.log("exzi",exist,user)

  if(res.length<2 && !exist ){
     return true
  }else{
     
     return false
  }

}


function formateMap(userMap) {
  const formatted = Array.from(userMap, ([username, roomId]) => ({
  username,
  roomId
  }))

  return formatted

}
// function vaidUserName (username){
//  const exist = userMap.has(username)
//  return !exist
// }

// function validationOfRoom(roomId,user) {

//   const existsOfRoom = rooms.get(roomId)

//   if (existsOfRoom) {

//      existsOfRoom.forEach(element => {
//       const {username} = element

//       console.log(username,user)
//       if ( user=== username) {
//         console.log(user===username,user,username)
//         return false
//       }
//      });

//      return true
//   }
// }


// function removeEntryByValue(map, valueToRemove) {
//   for (let [key, value] of map.entries()) {
//     if (value === valueToRemove) {
//       map.delete(key);
//       return true; // found and removed
//     }
//   }
//   return false; // not found
// }





io.on("connection",socket=>{

  // console.log("connecting to ",socket.id)

     

      socket.on("request-Offers",()=>{
       socket.emit("updated-offer",formateMap(offerMap))
      })
  
  socket.on("join-room",({roomId,username})=>{

    console.log("working join room")


  
    socket.data.roomId = roomId
    socket.data.username = username
  
  
     

    if (rooms.has(roomId)) {
    let socketArry = rooms.get(roomId) 


       
      //  socketArry.push({socketId:socket.id,username:username}) 
      // offerMap.delete(username)
      //     io.emit("updated-offer",formateMap(offerMap))
  
    if (validation(socketArry,username)) {
     
      socketArry.push({socketId:socket.id,username:username}) 
      offerMap.delete(username)
       offerMap.delete(socketArry[0].username)
    
       io.emit("updated-offer",formateMap(offerMap))
    }else{
      socket.emit("room-full")
      offerMap.set(username,roomId)
      return
    }
    }else{
    
      offerMap.set(username,roomId)
    rooms.set(roomId,[{socketId:socket.id,username:username}])
     
         io.emit("updated-offer",formateMap(offerMap))

    }
 
  
     
    const hostUser = rooms.get(roomId).find(ele =>ele.socketId !==socket.id)
 
    if (hostUser) {
      socket.emit("host-user",hostUser.socketId)
      socket.to(hostUser.socketId).emit("joined-user",socket.id)
    }

   

  })



  
  socket.on("offer",payload =>{

  
    io.to(payload.target).emit("offer",payload)
  })
  socket.on("answer",payload=>{
    io.to(payload.target).emit("answer",payload)
  })
  socket.on("ice-candidate",incoming=>{
    io.to(incoming.target).emit("ice-candidate",incoming.candidate)
  })

  socket.on("failed-connection",async()=>{

    try{
 const { roomId } = socket.data || {};

 
    const otherPerson = rooms.get(roomId)?.find(ele =>ele.socketId !==socket.id)
 
    socket.to(otherPerson.socketId).emit("failed-connection")

    }catch(e){

  console.log("erro",e)
    }   

  })
  
  socket.on("end-call",()=>{

        const { roomId, username } = socket.data || {};
    
    rooms.delete(roomId)
    offerMap.delete(username)
 io.emit("updated-offer",formateMap(offerMap))

  })

   socket.on("disconnect", () => {

    const { roomId, username } = socket.data || {};
    
    
    rooms.delete(roomId)
    offerMap.delete(username)
 io.emit("updated-offer",formateMap(offerMap))


  });
})

 
server.listen(process.env.PORT,()=>{
  console.log(" server is runing at",process.env.PORT)
})