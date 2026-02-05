let socket;
let keyPair;
let peerKey;

function join() {
  keyPair = nacl.box.keyPair();

  socket = new WebSocket("WSS_BACKEND_URL_HERE");

  socket.onopen = () => {
    socket.send(JSON.stringify({
      type: "join",
      user: username.value,
      room: room.value,
      publicKey: Array.from(keyPair.publicKey)
    }));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "peer-key") {
      peerKey = new Uint8Array(data.publicKey);
    }

    if (data.type === "message") {
      const decrypted = nacl.box.open(
        new Uint8Array(data.cipher),
        new Uint8Array(data.nonce),
        peerKey,
        keyPair.secretKey
      );

      chat.innerHTML += `<div>${nacl.util.decodeUTF8(decrypted)}</div>`;
    }
  };
}

function sendMessage() {
  const nonce = nacl.randomBytes(24);
  const cipher = nacl.box(
    nacl.util.decodeUTF8(message.value),
    nonce,
    peerKey,
    keyPair.secretKey
  );

  socket.send(JSON.stringify({
    type: "message",
    cipher: Array.from(cipher),
    nonce: Array.from(nonce)
  }));

  message.value = "";
}
