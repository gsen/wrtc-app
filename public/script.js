const socket = io("/");
const videoGrid = document.getElementById("video-grid");
let streamArray = [];
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
})
let hostStream;
let index = 0;
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};
var multiStreamRecorder = undefined;
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    hostStream = stream;
    // if(!streamArray.includes(stream)){
    //   streamArray.push(streamArray);
    // }
    multiStreamRecorder = new MultiStreamRecorder([stream]);
    multiStreamRecorder.ondataavailable = function (blob) {
      let container = document.getElementById("container");
      var a = document.createElement("a");

      a.href = URL.createObjectURL(blob);
      a.download = `${Date.now()}.webm`;
      a.click();
      a.remove();
    };
    multiStreamRecorder.start(Number.MAX_VALUE);

    addVideoStream(myVideo, stream, host);

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");

      call.on("stream", (userVideoStream) => {
        // if (host == "true") {
        //   multiStreamRecorder.addStream(userVideoStream);
        // }
        console.log('adding peer uservideo stream');
        addVideoStream(video, userVideoStream, host);
      });
    });

    socket.on("user-connected", (userId) => {
      console.log("user connected", userId);
      setTimeout(() => {
        connectToNewUser(userId, stream);
      }, 500);
    });

    socket.on("user-disconnected", (userId) => {
      console.log(Object.keys(peers));
      if (Object.keys(peers).length == 1) {
        //  multiStreamRecorder.stop();
      }
      if (peers[userId]) peers[userId].close();
    });
  });

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
  console.log("new room", ROOM_ID);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log("adding new user video stream");
    addVideoStream(video, userVideoStream, host);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream, host = false) {
  
  console.log("host:",host);
  if (host == "true") {
    if(!streamArray.includes(stream) && stream.id !== hostStream.id){
      streamArray.push(stream);
      console.log('adding stream to multistream recorder', stream);
      multiStreamRecorder.addStream(stream);
    }
    let button = document.getElementById("stopRecording");

    button.style.display = "block";
    button.addEventListener("click", () => {
      multiStreamRecorder.stop();
    });
  }
  console.log("function addVideoStream","adding video stream");
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

function bytesToSize(bytes) {
  var k = 1000;
  var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Bytes";
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
  return (bytes / Math.pow(k, i)).toPrecision(3) + " " + sizes[i];
}

// below function via: http://goo.gl/6QNDcI
function getTimeLength(milliseconds) {
  var data = new Date(milliseconds);
  return (
    data.getUTCHours() +
    " hours, " +
    data.getUTCMinutes() +
    " minutes and " +
    data.getUTCSeconds() +
    " second(s)"
  );
}
