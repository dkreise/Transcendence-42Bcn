export var socket = null;

export function conectWB(access_token)
{
    socket = new WebSocket(`ws://localhost:8000/ws/online-status/?token=${access_token}`);
    // socket = new WebSocket(`ws://localhost:8000/ws/online-status/`);
    socket.onopen = function(event) {
        console.log('WebSocket Connected!');
    };
    
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('Online Friends:', data.online_friends);
    };
    
    socket.onerror = function(error) {
        console.error('WebSocket Error:', error);
    };
    
    socket.onclose = function(event) {
        console.log('WebSocket Disconnected.');
    };
}


export function disconnectWB() {
    if (socket) {
        socket.close();
        socket = null;
    }
}