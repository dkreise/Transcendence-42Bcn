var host = window.env.HOST;
var userMgmtPort = window.env.USER_MGMT_PORT;

export var socket = null;

export function connectWS(access_token)
{
    if (!access_token)
        return ;
    socket = new WebSocket(`ws://${host}:${userMgmtPort}/ws/online-status/?token=${access_token}`);
    // socket = new WebSocket(`ws://localhost:8000/ws/online-status/`);
    
    socket.onclose = function(event) {

        console.log('WebSocket Disconnected. ');
        if (access_token) {
            setTimeout(connectWS(access_token), 1000); // Retry after 1 second
            console.log('Reconnecting...');
        }
    };
    
    socket.onopen = function(event) {
        console.log(`WebSocket Connected! Socket: ${socket}`);
    };
    
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('Online Friends:', data.online_friends);
    };
    
    socket.onerror = function(error) {
        console.error('WebSocket Error:', error);
    };
    
    socket.onclose = function(event) {

        console.log('WebSocket Disconnected. ');
        // if (access_token) {
        //     setTimeout(connectWS, 1000); // Retry after 1 second
        //     console.log('Reconnecting...');
        // }
    };
}


export function disconnectWS() {
    if (socket) {
        socket.close();
        socket = null;
    }
}