from django.urls import path
from . import views

urlpatterns = [
    path("api/user-info/", views.user_info_api, name="user_info_api"),
    path("api/profile-page/", views.profile_page, name="profile_page"),
    path("api/profile-settings-page/", views.profile_settings_page, name="profile_settings_page"),
    path("api/update-profile-settings/", views.update_profile_settings, name="update_profile_settings"),
]