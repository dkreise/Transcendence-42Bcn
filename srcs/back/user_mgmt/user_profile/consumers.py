import redis
from channels.generic.websocket import AsyncWebsocketConsumer
import json
import logging
import django
import asyncio
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
# from .models import Profile
from django.core.cache import cache

django.setup()
User = get_user_model()

redis_client = redis.StrictRedis(host='redis', port=6379, db=0, decode_responses=True)

logger = logging.getLogger(__name__)

def get_profile_model(): 
    from .models import Profile  
    return Profile

class FriendsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get('user', None)

        logger.info("\033[1;32mCONNECT METHOD CALLED\033[0m")
        logger.info(self.scope["user"].id)
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        """Store user connection in Redis"""
        self.user_id = self.scope["user"].id

        self.channel_name_key = f"user_channel_{self.user_id}"

        # Store WebSocket connection in Redis with a timeout (10 seconds)
        cache.set(self.channel_name_key, self.channel_name, timeout=10)
        
        await self.accept()
        await self.set_online()
        # await self.send(text_data=json.dumps({
        #     'online_friends': online_friends
        # }))

    async def disconnect(self, close_code):
        """When a user disconnects, remove them from Redis and notify friends."""
        logger.info("\033[1;32mDISCONNECT METHOD CALLED\033[0m")
        # logger.info(self.user.username)
        if self.user.is_authenticated:
            # Check if the user is just refreshing (temporary disconnect)
            logger.info(self.channel_name_key)
            # self.channel_name_key = f"user_channel_{-1}"
            await asyncio.sleep(2)  # Grace period
            # Retrieve stored WebSocket channel from Redis
            logger.info(cache.get(self.channel_name_key))
            logger.info(self.channel_name)
            
            stored_channel = cache.get(self.channel_name_key)
            
            logger.info(self.channel_name_key)
            # HERE SOME CHECKINGS
            if not stored_channel or stored_channel == self.channel_name:
                # If the same channel is still in Redis, it means the user hasn't reconnected → Disconnect them
                logger.info("\033[1;31mUser did NOT reconnect, removing from Redis\033[0m")
                cache.delete(self.channel_name_key)  # Remove from Redis
                self.set_offline(self)
                # redis_client.delete(f"user:{self.user.id}:online")
                # await self.notify_friends_status(update_online=False)
                await self.set_offline()

            else:
            # If a new connection exists in Redis, do NOT mark the user as offline
                logger.info("\033[1;34mUser reconnected within grace period, skipping disconnection\033[0m")
        

        await self.close()

    async def receive(self, text_data):
        """Handle incoming messages (can be extended for chat, etc.)."""
        pass

    @database_sync_to_async
    def set_online(self):
        logger.info("\033[1;32mIn set online\033[0m")
        Profile = get_profile_model()
        status = Profile.objects.get(user=self.user)
        # logger.info(status.user.username)
        status.online_status = True
        status.save()
        logger.info(status.user.username)
        logger.info(status.online_status)



    @database_sync_to_async
    def set_offline(self):
        logger.info("\033[1;33mGot online friends\033[0m")
        Profile = get_profile_model()
        status = Profile.objects.get(user=self.user)
        status.online_status = False
        status.save()
        # data = json.loads(text_data)
        # await self.send(text_data=json.dumps({
        #     "message": f"Received: {data}"
        # }))

    # @sync_to_async
    # def get_online_friends(self):
    #     """Fetch all the user's friends and check their online status in Redis."""
    #     logger.info("\033[1;32m Notifying friends \033[0m")
    #     # friends = await self.get_friends(self.user)
    #     friends = self.user.profile.friends.all()
    #     online_friends = [
    #         friend.user.username
    #         for friend in friends if redis_client.get(f"user:{friend.user.id}:online")
    #     ]
    #     return online_friends

    # @sync_to_async
    # def get_friends(self, user):
    #     """This method is run synchronously to fetch friends."""
    #     return user.profile.friends.all()

    # @sync_to_async
    # def notify_friends_status(self, update_online=True):
    #     """Notify friends when this user comes online or goes offline."""
    #     friends = self.user.profile.friends.all()
    #     status_message = {
    #         "user": self.user.username,
    #         "status": "online" if update_online else "offline"
    #     }
        
    #     for friend in friends:
    #         # Send notification (this can be extended to send real-time WebSocket messages)
    #         redis_client.publish(f"user:{friend.user.id}:notifications", json.dumps(status_message))

    # async def keep_alive(self):
    #     """Periodically refresh online status TTL in Redis while the user is connected."""
    #     try:
    #         while True:
    #             if self.user.is_authenticated:
    #                 redis_client.setex(f"user:{self.user.id}:online", 120, "true")  
    #             await asyncio.sleep(120)  # Refresh every 5 minutes
    #     except asyncio.CancelledError:
    #         pass  # Task will be cancelled when the user disconnects