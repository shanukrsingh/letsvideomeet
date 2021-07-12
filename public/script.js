// Client Side Code


// import essential packages and declare global variables
const socket = io('/')
const videoGrid = document.getElementById('video-grid')

var myname = new Map()
var mynamei = []

const myPeer = new Peer(USERHASID, {
    debug: 2
});

const myVideo = document.createElement('video')
var myStream;
myVideo.muted = true
const peers = {}


// get the media feed of the user
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
}).then(stream => {


    // get the client's media feed on its own device
    myStream = stream
    addVideoStream(myVideo, stream)


    // listen for call from other users and add their feed to its own device
    // and remove their feed when that other user disconnects
    myPeer.on('call', call => {
        call.answer(stream)
        const video = document.createElement('video')
        call.on('stream', userVideoStream => {
            addVideoStream(video, userVideoStream)
        })
        call.on('close', () => {
            console.log('removed from : ' + myPeer.id);
            video.remove()
        })
        console.log(call)
        peers[call.peer] = call;
    })


    // handle connection when new user connects
    socket.on('user-connected', userId => {
        connectToNewUser(userId, stream)
    })


    // get the updated list of users and update the global variable
    socket.on('giveName', (ky) => {
        mynamei = ky
        console.log(mynamei)

        updatenames();

    })


    // get the input from chatbox
    let text = $("input");

    $('html').keydown(function (e) {
        if (e.which == 13 && text.val().length !== 0) {
            socket.emit('message', text.val());
            text.val('')
        }
    });


    // append new message to the chatbox
    socket.on("createMessage", (mesar) => {
        if (mesar.userId == myPeer.id) {
            $(".messages").append(`<li class="message" style="text-align: right !important;"><span style = "color: #363875;">${mesar.userId} (me)</span><br/>${mesar.message}</li>`);
        } else {
            $(".messages").append(`<li class="message"><span>${mesar.userId}</span><br/>${mesar.message}</li>`);
        }
        scrollToBottom()

    })

})


// close connection to the disconnected user
socket.on('user-disconnected', userId => {
    if (peers[userId]) peers[userId].close()
    var ind = mynamei.indexOf(userId)
    mynamei.splice(ind, 1)
    updatenames();
})


// asks from server to join room and send the username
myPeer.on('open', id => {
    socket.emit('join-room', ROOM_ID, id)
    socket.emit('createName', id)
})


// add media feed of the newly connected user to its own device and remove the feed when
// that user disconnects
function connectToNewUser(userId, stream) {
    const call = myPeer.call(userId, stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {
        console.log('removed from : ' + myPeer.id);
        video.remove()
    })

    peers[userId] = call
}


// creates a new video element
function addVideoStream(video, stream) {
    video.srcObject = stream
    video.addEventListener('loadedmetadata', () => {
        video.play()
    })
    videoGrid.append(video)
}


// update the list of users in the public variable
function updatenames() {

    document.querySelector('.userslist').innerHTML = ' ';

    for (let temp of mynamei) {
        $(".userslist").append(`<li class="usernames"><span> ${temp}</span></li>`);
        console.log(temp)
    }
}


// scroll chatbox to the bottom
const scrollToBottom = () => {
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
}


// button handlers

// control microphone
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

// exit meeting
const leaveMeeting = () => {
    location.href = `clubreq?usernamed=${USERHASID}&giveroomid=${ROOM_ID}`
}

// control camera
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

// toggle chatbox
const controlchat = () => {
    var dispattribute = document.querySelector('.cab2').getAttribute('id')
    if (dispattribute == 'dispon') {
        document.querySelector('.cab2').setAttribute('id', 'dispoff')
        $('.cab2').css('display', 'none')
    } else {
        document.querySelector('.cab2').setAttribute('id', 'dispon')
        document.querySelector('.cab2b').setAttribute('id', 'dispoff')
        $('.cab2b').css('display', 'none')
        $('.cab2').css('display', 'flex')
    }

    scrollToBottom()
}

// toggle list of users
const controlusers = () => {
    var dispattribute = document.querySelector('.cab2b').getAttribute('id')
    if (dispattribute == 'dispon') {
        document.querySelector('.cab2b').setAttribute('id', 'dispoff')
        $('.cab2b').css('display', 'none')
    } else {
        document.querySelector('.cab2b').setAttribute('id', 'dispon')
        document.querySelector('.cab2').setAttribute('id', 'dispoff')
        $('.cab2').css('display', 'none')
        $('.cab2b').css('display', 'flex')
    }
}

// copy invite link
const copylink = () => {
    var textArea = document.createElement("textarea");
    textArea.value = `${document.location.href}`
    document.body.appendChild(textArea);


    /* Select the text field */
    textArea.select();
    textArea.setSelectionRange(0, 99999); /* For mobile devices */

    /* Copy the text inside the text field */
    document.execCommand("copy");


    /* Alert the copied text */
    alert("Copied Invite Link : " + textArea.value);

    document.body.removeChild(textArea);
}