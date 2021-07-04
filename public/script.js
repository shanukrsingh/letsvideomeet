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

        updatenames();

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
            $(".messages").append(`<li class="message" style="text-align: right !important;"><span style = "color: #363875;">${myname.get(mesar.userId)} (me)</span><br/>${mesar.message}</li>`);
        } else {
            $(".messages").append(`<li class="message"><span>${myname.get(mesar.userId)}</span><br/>${mesar.message}</li>`);
        }
        scrollToBottom()
    
    })

})

socket.on('user-disconnected', userId => {
    if(peers[userId]) peers[userId].close()
    myname.delete(userId)
    updatenames();
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

function updatenames() {

    document.querySelector('.userslist').innerHTML = ' ';

        for (let temp of myname.values()) {
            $(".userslist").append(`<li class="usernames"><span> ${temp}</span></li>`);  
            console.log(temp)
        }
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
    location.href = 'endscreen';
}

var cameraC = () => {
    const enabled = myStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myStream.getVideoTracks()[0].enabled = false;
        unsetCamera();
    } else {
        myStream.getVideoTracks()[0].enabled = true;
        setCamera();
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

const controlchat = () => {
    var dispattribute = document.querySelector('.cab2').getAttribute('id')
    if (dispattribute == 'dispon') {
        var dispattribute = document.querySelector('.cab2').setAttribute('id', 'dispoff')
        var dispattribute = document.querySelector('.cab2').setAttribute('style', 'display: none;')
    } else {
        var dispattribute = document.querySelector('.cab2').setAttribute('id', 'dispon')
        var dispattribute = document.querySelector('.cab2').setAttribute('style', 'flex: 0.2;display: flex;flex-direction: column;')
    }
}


// var waitc;
// const setButtons = () => {
//     waitc = true;
//     console.log(document.querySelector('.cab1-footer').getAttribute('style'));
//     document.querySelector('.cab1-footer').setAttribute('style', "display: flex;");
//     console.log(document.querySelector('.cab1-footer').getAttribute('style'));
//     setTimeout(function(){
//         // waitc = false;
//         if (waitc == true) {
//             return;
//         }
//         document.querySelector('.cab1-footer').setAttribute('style', "display: none;");
//         console.log('finally complete');
//     },5000);
//     console.log('complete');
// }