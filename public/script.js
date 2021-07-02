const socket = io('/')
const videoGrid = document.getElementById('video-grid')

var myname = new Map()
var mynamei = []
var mynamen = []


const myPeer = new Peer(null, {
    debug: 2 
});



const myVideo = document.createElement('video')
var myStream;
myVideo.muted = true
const peers = {}

navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {
    myStream = stream
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
            $(".messages").append(`<li class="message" style="color: black !important;"><b>${myname.get(mesar.userId)}</b><br/>${mesar.message}</li>`);
        } else {
            $(".messages").append(`<li class="message"><b>${myname.get(mesar.userId)}</b><br/>${mesar.message}</li>`);
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
function addVideoStreamFirst(video, stream){
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () =>{
        video.play()
    })
    videoGrid.insertBefore(video, videoGrid.firstChild)
}

const scrollToBottom = () => {
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
}
  

const muteUnmute = () => {
    const enabled = myStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myStream.getAudioTracks()[0].enabled = false;
        setUnmuteButton();
    } else {
        setMuteButton();
        myStream.getAudioTracks()[0].enabled = true;
    }
}

const leaveMeeting = () => {
    location.href = 'https://www.google.com';
}

const cameraC = () => {
    const enabled = myStream.getVideoTracks()[0].enabled;
    if (enabled) {
        console.log(videoGrid)
        myStream.getVideoTracks()[0].enabled = false;
        videoGrid.firstChild.remove()
        console.log(videoGrid)
        unsetCamera();
    } else {
        console.log(videoGrid)
        const video = document.createElement('video')
        addVideoStreamFirst(video, myStream)
        setCamera();
        myStream.getVideoTracks()[0].enabled = true;
        console.log(videoGrid)
    }
}

const setMuteButton = () => {
    const html = `
      <i class="fas fa-microphone"></i>
    `
    document.querySelector('.main__mute_button').innerHTML = html;
}
  
const setUnmuteButton = () => {
    const html = `
        <i class="unmute fas fa-microphone-slash"></i>
    `
    document.querySelector('.main__mute_button').innerHTML = html;
}

const setCamera = () => {
    const html = `
      <i class="fas fa-video"></i>
    `
    document.querySelector('.main__video_button').innerHTML = html;
}
  
const unsetCamera = () => {
    const html = `
        <i class="unmute fas fa-video-slash"></i>
    `
    document.querySelector('.main__video_button').innerHTML = html;
}