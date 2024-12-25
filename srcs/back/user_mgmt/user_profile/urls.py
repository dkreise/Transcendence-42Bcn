from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("api/user-info/", views.user_info_api, name="user_info_api"),
    path("api/profile-page/", views.profile_page, name="profile_page"),
    path("api/profile-settings-page/", views.profile_settings_page, name="profile_settings_page"),
    path("api/update-profile-settings/", views.update_profile_settings, name="update_profile_settings"),
    path("api/last-ten-games/", views.player_last_ten_games, name="last_ten_games"),
    path("api/search-users/", views.search_users, name="search_users"),
] 

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
# in production we will need to configure nginx to serve files from the media_root directory