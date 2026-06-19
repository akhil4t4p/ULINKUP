import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Community, ChatMessage
from django.contrib.auth import get_user_model

User = get_user_model()

class GroupChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_id = self.scope['url_route']['kwargs']['group_id']
        self.room_group_name = f'chat_{self.group_id}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        
        # We can send recent messages upon connection if we wanted, 
        # but typical flow is fetching history via a REST API first.
        # Here we just accept.

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        
        # Check if it's an auth message (sending token)
        if 'token' in text_data_json:
            # We would decode JWT and set self.scope['user'] here
            # But simple jwt authentication from cookie in middleware is better
            return

        message = text_data_json.get('message', '')
        image_url = text_data_json.get('image_url', '')
        gif_url = text_data_json.get('gif_url', '')
        user_id = text_data_json.get('user_id')

        # Find user
        if not user_id:
            return
            
        user = await self.get_user(user_id)
        if not user:
            return

        # Save message to DB
        chat_msg = await self.save_message(user, self.group_id, message, image_url, gif_url)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'id': chat_msg.id,
                'message': message,
                'image_url': image_url,
                'gif_url': gif_url,
                'sender': user.username or user.email.split('@')[0],
                'sender_id': user.id,
                'created_at': chat_msg.created_at.isoformat()
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'id': event['id'],
            'message': event['message'],
            'image_url': event.get('image_url', ''),
            'gif_url': event.get('gif_url', ''),
            'sender': event['sender'],
            'sender_id': event['sender_id'],
            'created_at': event['created_at']
        }))

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def save_message(self, user, group_id, message, image_url, gif_url):
        group = Community.objects.get(id=group_id)
        msg = ChatMessage.objects.create(
            group=group,
            sender=user,
            content=message,
            gif_url=gif_url
        )
        if image_url:
            msg.image = image_url  # For now, storing as string if it's already uploaded, or we handle it in REST API
        
        msg.save()
        return msg
