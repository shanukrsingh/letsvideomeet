const socket = io('/')
const videoGrid = document.getElementById('video-grid')

var myname = new Map()
var mynamei = []
var mynamen = []


const myPeer = new Peer(null, {
    debug: 2 
});



const myVideo = document.createElement('video')
myVideo.muted = true
const peers = {}

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    addVideoStream(myVideo, stream)

    myPeer.on('call',call => {
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
    })
    
    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream)
    })

    socket.on('giveName', (ky, vls) => {
        mynamei = ky
        mynamen = vls
        console.log(mynamei)
        console.log(mynamen)
        for (let i = 0; i < ky.length; i++) {
            myname.set(mynamei[i], mynamen[i])
        }
    })

    let text = $("input");
    // when press enter send message
    $('html').keydown(function (e) {
        if (e.which == 13 && text.val().length !== 0) {
        // console.log(myname)
        socket.emit('message', text.val());
        text.val('')
        
        }

    });
    socket.on("createMessage", (mesar) => {
        if (mesar.userId == myPeer.id) {
            $("ul").append(`<li class="message" style="color: black !important;"><b>${myname.get(mesar.userId)}</b><br/>${mesar.message}</li>`);
        } else {
            $("ul").append(`<li class="message"><b>${myname.get(mesar.userId)}</b><br/>${mesar.message}</li>`);
        }
        scrollToBottom()
    
    })

})

socket.on('user-disconnected', userId => {
    if(peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id)
    socket.emit('createName', id, Math.random())
})


function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () =>{
        video.remove()
    })

    peers[userId] = call    
}


function addVideoStream(video, stream){
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () =>{
        video.play()
    })
    videoGrid.append(video)
}

const scrollToBottom = () => {
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
  }
  