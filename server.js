const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4} = require('uuid')
const { uniqueNamesGenerator, names } = require('unique-names-generator');
var lastguy = []
var vy;
var giveroom;

var mynamesn = new Map()
var mynamesi = new Map()


app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/',(req, res) => {
    res.render('startscreen')
})

app.get('/clubreq', function(req, res){
    vy = req.query.usernamed;   
    giveroom = req.query.giveroomid;   
    res.redirect(`/${giveroom}`)
});

app.get('/endscreen', (req, res) => {
    res.render('endscreen', {roomId: lastguy[(lastguy.length-1)]})
    lastguy.pop()
})

app.get('/:room', (req, res) => {
    console.log('given name : '+vy)
    console.log('given room : '+giveroom)
    res.render('room', {roomId: req.params.room, userhasname: vy})
})


io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId)
        socket.broadcast.to(roomId).emit('user-connected', userId)

        socket.on('createName', (ky, vls) => {
            const randomName = uniqueNamesGenerator({ dictionaries: [names] }); 
            vls = randomName

            var tmp = mynamesi.get(roomId)
            if (tmp == null) {
                tmp = []
                tmp.push(ky)
            } else {
                tmp.push(ky)
            }
            mynamesi.set(roomId, tmp)

            var tmp2 = mynamesn.get(roomId)
            if (tmp2 == null) {
                tmp2 = []
                tmp2.push(vls)
            } else {
                tmp2.push(vls)
            }
            mynamesn.set(roomId, tmp2)
        
            console.log(mynamesi.get(roomId))
            console.log(mynamesn.get(roomId))
            io.to(roomId).emit('giveName', mynamesi.get(roomId), mynamesn.get(roomId))
        })

        socket.on('message', (message) => {
            //send message to the same room
            var mesar = {message,userId}
            io.to(roomId).emit('createMessage', (mesar))
        });

        socket.on('disconnect', () =>{
            lastguy.push(roomId)

            
            var tmp = []
            tmp = mynamesi.get(roomId)
            var ind = tmp.indexOf(userId)
            tmp.splice(ind,1)
            mynamesi.set(roomId, tmp)

            tmp = mynamesn.get(roomId)
            tmp.splice(ind,1)
            mynamesn.set(roomId, tmp)

            io.to(roomId).emit('user-disconnected', userId)

        })
    })
    

})


server.listen(process.env.PORT || 3000)

