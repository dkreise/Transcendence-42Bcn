from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    photo = models.ImageField(upload_to='user_photos', blank=True, null=True)
    # Uploaded photos go to 'media/user_photos/'

    def __str__(self):
        return f"{self.user.username}'s Profile"