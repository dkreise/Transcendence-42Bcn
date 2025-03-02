from django.contrib.auth.models import User
from user_profile.models import Profile

def create_user_and_profile(username, password):
    user, created = User.objects.get_or_create(username=username)
    if created:
        user.set_password(password)
        user.save()

    Profile.objects.get_or_create(user=user)

# Call the function for each user
create_user_and_profile('dins', '1234')
create_user_and_profile('bobby', '1234')
create_user_and_profile('nuria', '1234')
create_user_and_profile('julia', '1234')
create_user_and_profile('diana', '1234')