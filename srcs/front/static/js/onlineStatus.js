const host = window.env.HOST;
const userMgmtPort = window.env.USER_MGMT_PORT;
const protocolSocket = window.env.PROTOCOL_SOCKET;

export var socket = null;

export function connectWS(access_token)
{
    if (!access_token)
        return ;
    socket = new WebSocket(`${protocolSocket}://${host}:${userMgmtPort}/${protocolSocket}/online-status/?token=${access_token}`);

    socket.onclose = function(event) {

        console.log('WebSocket Disconnected. ');
        if (access_token) {
            setTimeout(connectWS(access_token), 1000); // Retry after 1 second
            console.log('Reconnecting...');
        }
    };
    
    socket.onopen = function(event) {
        // console.log(`WebSocket Connected! Socket: ${socket}`);
    };
    
    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('Online Friends:', data.online_friends);
    };
    
    socket.onerror = function(error) {
        console.log('WebSocket Error:', error);
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