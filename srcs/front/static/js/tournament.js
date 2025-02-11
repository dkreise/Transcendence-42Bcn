

function youNameIt(tourId) {
	const token = localStorage.getItem("access_token");
	if (!token)
	{
		console.warn("No access token found");
		return ;
	}
	console.log("token is: " + token);
	socket = new WebSocket(`ws://localhost:8001/ws/T/${tourId}/?token=${token}`);

	socket.onopen = () => console.log("WebSocket connection established")
	socket.onerror = (error) => {
		console.error("WebSocket encountered an error: ", error);
		alert("Unable to connect to the server. Please check your connection.");
		};
	socker.onclose = () => {
		console.warn("WebSocket connection close. Retrying...");
		setTimeout(youNameIt, 1000) //waits 1s and tries to reconnect
	};

	socket.onmessage = (event) = > { //we're receiving messages from the backend via WB
		const data = JSON.parse(event.data);

		console.log(data);
		switch(data.type)
		{
			case "totalPlayers":
				console.log("current number of players in the tournament: " + data.total);
			case "html":
				//render html or something
		}
	}
}
