from django.urls import path
from . import views

urlpatterns = [
    path("api/user-info/", views.user_info_api, name="user_info_api"),
    path("api/profile-page/", views.profile_page, name="profile_page"),
    path("api/settings-page/", views.settings_page, name="settings_page"),
]