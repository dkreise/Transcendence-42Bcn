import redis
from channels.generic.websocket import AsyncWebsocketConsumer
import json
import logging
import django
import asyncio
from asgiref.sync import sync_to_async
from django.contrib.auth import get_user_model

django.setup()
User = get_user_model()
redis_client = redis.StrictRedis(host='redis', port=6379, db=0, decode_responses=True)

logger = logging.getLogger(__name__)

class FriendsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user', None)

        logger.info("\033[1;32mCONNECT METHOD CALLED\033[0m")

        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        # Mark user as online in Redis with auto-expiration (optional)
        redis_client.setex(f"user:{self.user.id}:online", 120, "true")  # Expires after 1 hour
        logger.info("\033[1;32mRedis ready\033[0m")
        # Notify friends that this user is online
        await self.notify_friends_status(update_online=True)
        logger.info("\033[1;32mFriends are notified\033[0m")
        # Start background task to refresh TTL
        self.keep_alive_task = asyncio.create_task(self.keep_alive())
        logger.info("\033[1;32mTask created\033[0m")
        # Get online friends
        online_friends = await self.get_online_friends()
        logger.info("\033[1;32mGot online friends\033[0m")

        await self.accept()
        await self.send(text_data=json.dumps({
            'online_friends': online_friends
        }))

    async def disconnect(self, close_code):
        """When a user disconnects, remove them from Redis and notify friends."""
        logger.info("\033[1;32mDISCONNECT METHOD CALLED\033[0m")
        logger.info(self.user.username)
        if self.user.is_authenticated:
            # Check if the user is just refreshing (temporary disconnect)
            if close_code == 1000:  # 1000 is the normal close code, others might indicate network issues
                redis_client.delete(f"user:{self.user.id}:online")
                await self.notify_friends_status(update_online=False)

        await self.close()

    async def receive(self, text_data):
        """Handle incoming messages (can be extended for chat, etc.)."""
        data = json.loads(text_data)
        await self.send(text_data=json.dumps({
            "message": f"Received: {data}"
        }))

    @sync_to_async
    def get_online_friends(self):
        """Fetch all the user's friends and check their online status in Redis."""
        logger.info("\033[1;32m Notifying friends \033[0m")
        # friends = await self.get_friends(self.user)
        friends = self.user.profile.friends.all()
        online_friends = [
            friend.user.username
            for friend in friends if redis_client.get(f"user:{friend.user.id}:online")
        ]
        return online_friends

    @sync_to_async
    def get_friends(self, user):
        """This method is run synchronously to fetch friends."""
        return user.profile.friends.all()

    @sync_to_async
    def notify_friends_status(self, update_online=True):
        """Notify friends when this user comes online or goes offline."""
        friends = self.user.profile.friends.all()
        status_message = {
            "user": self.user.username,
            "status": "online" if update_online else "offline"
        }
        
        for friend in friends:
            # Send notification (this can be extended to send real-time WebSocket messages)
            redis_client.publish(f"user:{friend.user.id}:notifications", json.dumps(status_message))

    async def keep_alive(self):
        """Periodically refresh online status TTL in Redis while the user is connected."""
        try:
            while True:
                if self.user.is_authenticated:
                    redis_client.setex(f"user:{self.user.id}:online", 120, "true")  
                await asyncio.sleep(120)  # Refresh every 5 minutes
        except asyncio.CancelledError:
            pass  # Task will be cancelled when the user disconnects