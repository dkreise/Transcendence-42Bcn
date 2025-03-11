import { handleLogout } from "./logout.js";
import { refreshAccessToken } from "./login.js";


const host = window.env.HOST;
const userMgmtPort = window.env.USER_MGMT_PORT;
const protocolSocket = window.env.PROTOCOL_SOCKET;

export var socket = null;

export async function connectWS(access_token)
{
    if (!access_token) {
			// Token expired; refresh token logic
        try {
            let tok = await refreshAccessToken();
            // Reconnect with the new token
            await connectWS(tok);
        } catch (err) {
            console.error("Failed to refresh token", err);
            handleLogout();
            return ;
        }
    }

    // try {
    //     token = refreshAccessToken();
    // } catch (err) {
    //     console.log("Failed to refresh token");
    //     handleLogout();
    //     console.log("No access token found");
    //     return ;
    // }

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
    
    socket.onclose = async (event) => {

        console.log('WebSocket Disconnected. ');
        if (event.code === 4001) {
			// Token expired; refresh token logic
			try {
				let tok = await refreshAccessToken();
			  // Reconnect with the new token
                await connectWS(tok);
			} catch (err) {
			  console.error("Failed to refresh token", err);
			  handleLogout();
			}
		}
        if (access_token) {
            setTimeout(connectWS, 1000); // Retry after 1 second
            console.log('Reconnecting...');
        }
    };
}


export function disconnectWS() {
    if (socket) {
        socket.close();
        socket = null;
    }
}