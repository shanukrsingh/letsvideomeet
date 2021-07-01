const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4} = require('uuid')
var mynamesn = []
var mynamesi = []


app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/',(req, res) => {
    res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
    res.render('room', {roomId: req.params.room})
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.broadcast.to(roomId).emit('user-connected', userId)

        socket.on('createName', (ky, vls) => {
            mynamesi.push(ky)
            mynamesn.push(vls)
            console.log(mynamesi)
            console.log(mynamesn)
            io.to(roomId).emit('giveName', mynamesi, mynamesn)
        })

        socket.on('message', (message) => {
            //send message to the same room
            var mesar = {message,userId}
            io.to(roomId).emit('createMessage', (mesar))
        });

        socket.on('disconnect', () =>{
            socket.broadcast.to(roomId).emit('user-disconnected', userId)
        })
    })
    

})


server.listen(process.env.PORT || 3000)

