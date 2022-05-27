const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
  config: {
  iceServers: [
    { urls: ["stun:bn-turn1.xirsys.com"] },
      {
        username:
          "OqZByxJ5ZrKFXYdws9gizGoLdQyhYg5kQh4mMTFKi2TVFY-5kFogetZAu6Ho1369AAAAAGGT_OltcnBrZGV2ZWxvcGVy",
        credential: "be98eaf8-470d-11ec-ac21-0242ac140004",
        urls: [
          "turn:bn-turn1.xirsys.com:80?transport=udp",
          "turn:bn-turn1.xirsys.com:3478?transport=udp",
          "turn:bn-turn1.xirsys.com:80?transport=tcp",
          "turn:bn-turn1.xirsys.com:3478?transport=tcp",
          "turns:bn-turn1.xirsys.com:443?transport=tcp",
          "turns:bn-turn1.xirsys.com:5349?transport=tcp",
        ],
    },
  ],
},
// config: 
});
const myroomid = ROOM_ID;
const myname = Name;
let myVideoStream;
const myVideodiv = document.createElement("div");
myVideodiv.className = "videodiv";
const mynamediv = document.createElement("div");
mynamediv.innerHTML = myname;
myVideodiv.append(mynamediv);
mynamediv.style.color = "white";
const myVideo = document.createElement("video");
myVideo.id = "myvideo";
myVideo.muted = true;
const peers = {};
var myid = 0;

function handleThemeChange(val)
{
    console.log(val)
}

var codeArea = CodeMirror.fromTextArea(document.getElementById("code"), {
  lineNumbers: true,
  mode: "text/x-perl",
  theme: "abbott",
  // theme: "ayu-dark",
  //theme: "3024-night",
  lineWrapping: true,
});
codeArea.setSize("95%", "94%");
let input = document.querySelector("#input");
let output = document.querySelector("#output");

var conn;
myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
  console.log("my id is : " + id);
  myVideodiv.id = `videodiv-${id}`;
  myid = id;
});

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideodiv, myVideo, stream);

    myPeer.on("call", (call) => {
      call.answer(stream);
     const videodiv = document.createElement("div");
      videodiv.id = `videodiv-${call.peer}`;
      videodiv.className = "videodiv";
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(videodiv, video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      setTimeout(function () {
        connectToNewUser(userId, stream);
      }, 6000 );
    });
  });

codeArea.on("keydown", (cm) => {
  const text = cm.getValue();
  socket.emit("code", text);
});

input.addEventListener("keydown", (evt) => {
  const text = input.value;
  socket.emit("inpmsg", text);
  console.log("socket ip");
});

socket.on("code", (data) => {
  codeArea.getDoc().setValue(data);
});
socket.on("inpmsg", (data) => {
  input.value = data;
  console.log("received")
});
socket.on("outmsg", (data) => {
  output.value = data;
  console.log("received in console here bruh")
});
socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

function connectToNewUser(userId, stream) {
  console.log(`connected to user id : ${userId}`);

  const call = myPeer.call(userId, stream);

  const videodiv = document.createElement("div");
  videodiv.id = `videodiv-${userId}`;
  videodiv.className = "videodiv";
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(videodiv, video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;

  conn = myPeer.connect(userId);
  conn.on("open", function () {
    conn.on("data", function (data) {
      console.log("Received", data);
      let uservideodiv = document.querySelector(`#videodiv-${data.userid}`);
      if (data.name) {
        let namediv = document.createElement("div");
        namediv.innerHTML = data.name;
        namediv.style.color = "white";
        uservideodiv.append(namediv);
      }
      console.log(`${data.userid} user is muted`);
      setvideomutedtext(uservideodiv, data.muted, data.userid);
    });

    conn.send({ userid: myid, name: myname, muted: false });
  });
}

var clientconn;
myPeer.on("connection", function (conn) {
  clientconn = conn;
  console.log("peer connection established");

  conn.on("open", function () {
    console.log("in open");
    conn.on("data", function (data) {
      console.log("Received ", data);
      console.log(`${data.userid} user is muted`);
      let uservideodiv = document.querySelector(`#videodiv-${data.userid}`);
      if (data.name) {
        let namediv = document.createElement("div");
        namediv.innerHTML = data.name;
        namediv.style.color = "white";
        uservideodiv.append(namediv);
      }
      setvideomutedtext(uservideodiv, data.muted, data.userid);
    });

    conn.send({ userid: myid, name: myname, muted: false });
  });
});

function addVideoStream(videodiv, video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(videodiv);
  videodiv.append(video);
}

const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const playStop = () => {
  console.log("object");
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `;
  let div = document.querySelector(`#muteText-${myid}`);
  div.remove();
  document.querySelector(".main__mute_button").innerHTML = html;
  if (conn) {
    conn.send({ userid: myid, muted: false });
  } else {
    clientconn.send({ userid: myid, muted: false });
  }
};

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `;
  let div = document.createElement("div");
  div.setAttribute("class", "mutetext");
  div.id = `muteText-${myid}`;
  div.innerHTML = `
  <i class="unmute fas fa-microphone-slash"></i>
`;
  myVideodiv.appendChild(div);
  document.querySelector(".main__mute_button").innerHTML = html;
  if (conn) {
    conn.send({ userid: myid, muted: true });
  } else {
    clientconn.send({ userid: myid, muted: true });
  }
};

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `;
  document.querySelector(".main__video_button").innerHTML = html;
};

const setvideomutedtext = (videodiv, muted, id) => {
  if (muted) {
    let div = document.createElement("div");
    div.setAttribute("class", "mutetext");
    div.id = `muteText-${id}`;
    div.innerHTML = `
    <i class="unmute fas fa-microphone-slash"></i>
  `;
    videodiv.appendChild(div);
  } else {
    let div = document.querySelector(`#muteText-${id}`);
    div.remove();
  }
};
