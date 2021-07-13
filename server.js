// Server Side Code


// import essential packages
const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { v4: uuidV4 } = require('uuid')
const { uniqueNamesGenerator, names } = require('unique-names-generator');
var mongo = require('mongodb').MongoClient;


// global variables
var vy;
var giveroom;
var mynamesi = new Map()


// set render engine
app.set('view engine', 'ejs')


// import middleware
app.use(express.static('public'))


// routing configuration
app.get('/', (req, res) => {
    res.render('startscreen')
})

app.get('/clubreq', function (req, res) {
    vy = req.query.usernamed;
    giveroom = req.query.giveroomid;
    var og = req.query.og

    var tmp = mynamesi.get(giveroom)
    console.log("users = " + tmp)

    var ind = getIndex(vy)
    console.log("index = " + ind)

    if (og == 'true') {
        ind = -1;
    }

    if (ind >= 0) {
        res.redirect('/')
    } else {
        updateUsers(vy, giveroom)
        res.render('chatscreen', { roomId: giveroom, userhasname: vy })
    }

});


app.get('/clubhome', function (req, res) {
    vy = req.query.usernamed;
    giveroom = req.query.giveroomid;
    var og = req.query.og

    var tmp = mynamesi.get(giveroom)
    console.log("users = " + tmp)


    var ind = getIndex(vy)
    if (og == 'true') {
        ind = -1;
    }

    if (ind >= 0) {
        res.redirect('/')
    } else {
        updateUsers(vy, giveroom)
        res.redirect(`/rooms`)
    }

});


app.get('/rooms', (req, res) => {
    console.log('given name : ' + vy)
    console.log('given room : ' + giveroom)
    res.render('room', { roomId: giveroom, userhasname: vy })
})

app.get('/:room', (req, res) => {

    res.render('startscreen2', { roomhasid: req.params.room })
})


// listen to port
server.listen(process.env.PORT || 3000)


// main function
async function main() {


    // create mongodb client
    const client = await createClient();


    // listen for connection from clients
    io.on('connection', socket => {


        // listen for connection before and after video meeting
        socket.on('join-roomfromchat', (roomId, userId) => {


            // join a room and load the chats of the room
            socket.join(roomId)
            let chat = client.db('chatbase').collection(`${roomId}`);


            // load chats of a room from database and send to every client
            chat.find().limit(100).sort({ _id: 1 }).toArray(function (err, res) {
                if (err) {
                    throw err;
                }

                // Emit the messages
                res.forEach(element => {
                    var mesar = { 'message': `${element.message}`, 'userId': `${element.username}` }
                    socket.emit('createMessage', (mesar))
                });
            });


            //send messages to the clients of the same room and insert to database
            socket.on('message', (message) => {
                var mesar = { message, userId }
                chat.insertOne({ 'username': `${userId}`, 'message': `${message}` })
                io.to(roomId).emit('createMessage', (mesar))
            });


            // handle when a user leaves chat screen
            socket.on('disconnect', () => {

                var tmp = []
                tmp = mynamesi.get(roomId)
                var ind = tmp.indexOf(userId)
                tmp.splice(ind, 1)
                mynamesi.set(roomId, tmp)

                console.log(userId + " has disconnected")
            })

        })


        // listen for connection in video meeting
        socket.on('join-room', (roomId, userId) => {


            // join room and load chats of the room
            let chat = client.db('chatbase').collection(`${roomId}`);
            socket.join(roomId)


            // connect the new user to the other users of the same room
            socket.broadcast.to(roomId).emit('user-connected', userId)


            // store username in public variable and send the username to users of the same room
            socket.on('createName', (ky) => {

                io.to(roomId).emit('giveName', mynamesi.get(roomId))


                // load chats from database and emit to the newly connected user
                chat.find().limit(100).sort({ _id: 1 }).toArray(function (err, res) {
                    if (err) {
                        throw err;
                    }

                    // Emit the messages
                    res.forEach(element => {
                        var mesar = { 'message': `${element.message}`, 'userId': `${element.username}` }
                        socket.emit('createMessage', (mesar))
                    });
                });
            })


            //send message to users of the same room
            socket.on('message', (message) => {
                var mesar = { message, userId }
                chat.insertOne({ 'username': `${userId}`, 'message': `${message}` })
                io.to(roomId).emit('createMessage', (mesar))
            });


            // inform other users when a user disconnects and update the global variable
            socket.on('disconnect', () => {

                var tmp = []
                tmp = mynamesi.get(roomId)
                var ind = tmp.indexOf(userId)
                tmp.splice(ind, 1)
                mynamesi.set(roomId, tmp)

                console.log(userId + " has disconnected")

                socket.broadcast.to(roomId).emit('user-disconnected', userId)
            })

        })



    })


}

main()


// connect to mongodb to handle messages
async function createClient() {
    var uri = "mongodb://sampleuser11:sample11pass@cluster0-shard-00-00.2vk0e.mongodb.net:27017,cluster0-shard-00-01.2vk0e.mongodb.net:27017,cluster0-shard-00-02.2vk0e.mongodb.net:27017/chatbase?ssl=true&replicaSet=atlas-af2y8l-shard-0&authSource=admin&retryWrites=true&w=majority";
    const client = new mongo(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    await client.connect()
    console.log('MongoDB connected...');
    return client;
}


// maintain the list on users that are online
function updateUsers(uid, rid) {
    var tmp = mynamesi.get(rid)
    if (tmp == null) {
        tmp = []
        tmp.push(uid)
    } else {
        tmp.push(uid)
    }
    mynamesi.set(rid, tmp)

    console.log(mynamesi.get(rid))
}


// search if a user is online
function getIndex(vy) {
    var indx;
    for (let value of mynamesi.values()) {
        indx = value.indexOf(vy);
        console.log("tst :" + value)
        if (indx >= 0)
            return indx;
    }
    return indx;
}