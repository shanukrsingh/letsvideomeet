const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const { uniqueNamesGenerator, names } = require('unique-names-generator');
var mongo = require('mongodb').MongoClient;
var lastguy = []
var vy;
var giveroom;

var mynamesi = new Map()


app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
    res.render('startscreen')
})

app.get('/clubreq', function (req, res) {
    vy = req.query.usernamed;
    giveroom = req.query.giveroomid;

    var tmp = mynamesi.get(giveroom)
    if (tmp == null) {
        tmp = []
    }

    var ind = tmp.indexOf(vy)
    if (ind >= 0) {
        res.redirect('/')
    } else {
        res.redirect(`/${giveroom}`)
    }

});

app.get('/endscreen', (req, res) => {
    res.render('endscreen', { roomId: lastguy[(lastguy.length - 1)] })
    lastguy.pop()
})

app.get('/:room', (req, res) => {
    console.log('given name : ' + vy)
    console.log('given room : ' + giveroom)
    res.render('room', { roomId: req.params.room, userhasname: vy })
})

server.listen(process.env.PORT || 3000)


async function main() {

    const client = await createClient();


    io.on('connection', socket => {
        socket.on('join-room', (roomId, userId) => {
            let chat = client.db('chatbase').collection(`${roomId}`);
            socket.join(roomId)
            socket.broadcast.to(roomId).emit('user-connected', userId)

            socket.on('createName', (ky) => {

                var tmp = mynamesi.get(roomId)
                if (tmp == null) {
                    tmp = []
                    tmp.push(ky)
                } else {
                    tmp.push(ky)
                }
                mynamesi.set(roomId, tmp)

                console.log(mynamesi.get(roomId))
                io.to(roomId).emit('giveName', mynamesi.get(roomId))
            })

            socket.on('message', (message) => {
                //send message to the same room
                var mesar = { message, userId }
                chat.insertOne({ 'username': `${userId}`, 'message': `${message}` })
                io.to(roomId).emit('createMessage', (mesar))
            });

            socket.on('disconnect', () => {
                lastguy.push(roomId)


                var tmp = []
                tmp = mynamesi.get(roomId)
                var ind = tmp.indexOf(userId)
                tmp.splice(ind, 1)
                mynamesi.set(roomId, tmp)

                io.to(roomId).emit('user-disconnected', userId)

            })
        })

    })


}


main()

async function createClient() {
    var uri = "mongodb://sampleuser11:sample11pass@cluster0-shard-00-00.2vk0e.mongodb.net:27017,cluster0-shard-00-01.2vk0e.mongodb.net:27017,cluster0-shard-00-02.2vk0e.mongodb.net:27017/chatbase?ssl=true&replicaSet=atlas-af2y8l-shard-0&authSource=admin&retryWrites=true&w=majority";
    const client = new mongo(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    await client.connect()
    console.log('MongoDB connected...');
    return client;
}