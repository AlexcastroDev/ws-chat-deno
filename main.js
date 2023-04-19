const websocket = new WebSocket("ws://chat-ws.deno.dev")

function createWebSocket() {
    websocket.onmessage = (message) => {
        const wsMessage = JSON.parse(message.data)
        if (wsMessage.type === 'message') {
            receiveMessageUi(wsMessage.data)
        }
    }
}
const messageTemplate = (message, isMine = false) => {
    const bubble = document.createElement('div');
    bubble.classList.add('chat-bubble', isMine ? 'mine' : 'their');
    
    const messageEl = document.createElement('div');
    messageEl.classList.add('message');
    messageEl.textContent = message;
    bubble.appendChild(messageEl);
    
    const timestampEl = document.createElement('div');
    timestampEl.classList.add('timestamp');
    timestampEl.textContent = new Date().toLocaleTimeString();
    bubble.appendChild(timestampEl);
    
    return bubble;
}

const handleSend = () => {
    const message = document.getElementById('message').value;
    document.getElementById('message').value = '';
    sendMessageUi(message)
    const people = message.match(/@\S+/g) || [];
    const mentions = people.map(mention => mention.slice(1));

    websocket.send(JSON.stringify({ type: 'message', data: message, mentions }))
}
const sendMessageUi = (message) => {
    const window = document.getElementById('chat-window');
    window.appendChild(messageTemplate(message, true));
}

const receiveMessageUi = (message) => {
    const window = document.getElementById('chat-window');
    window.appendChild(messageTemplate(message, false));
}

createWebSocket()

document.getElementById('message').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        handleSend()
    }
})

document.getElementById('send-cta').addEventListener('click', () => {
    handleSend()
})

function joinServer(name) {
    websocket.send(JSON.stringify({ type: 'join', data: name }))
}
window.onload = () => {
    const name = Math.random().toString(36).substring(7);
    console.log("🚀 ~ file: main.js:61 ~ name:", name)
    if(!name) {
        window.location.reload();
    } else {
        joinServer(name)
    }
}



// document.getElementById('message').addEventListener('keyup', (event) => {
//     if (event.key !== 'Enter') {
//         websocket.send(JSON.stringify({ type: 'action', data: 'typing' }))
//     }
// })

