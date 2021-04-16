const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')

const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});

let roomMapper = {
  
}

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.use('/peerjs',peerServer);

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}?host=true`)
})

app.get('/:room', (req, res) => {
  let {room} = req.params;
  let {host = false} = req.query;
  if(!roomMapper[room]){
    roomMapper[room] = [];
  }
  res.render('room', { roomId: room, host: host?true: host});
})

io.on('connection', socket => {

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    roomMapper[roomId].push(userId);
    socket.to(roomId).broadcast.emit('user-connected', userId)

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId)
    })
  })
})

server.listen(3000)