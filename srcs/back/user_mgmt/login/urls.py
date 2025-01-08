from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views, auth42
from .auth42 import Callback42API

urlpatterns = [
	# path("", views.home, name="home"),
	# path("login/", views.login_view, name="login"),
	# path("logout/", views.logout_view, name="logout"),

	path("api/login/", views.login_view, name="login_api"),
	path("api/login-form/", views.login_form_api, name="login_form_api"),
	# path("api/user-info/", views.user_info_api, name="user_info_api"),
	path("api/register/", views.register_user, name='register_user'),
	path("api/token/refresh/", TokenRefreshView.as_view(), name='token_refresh'),
	path("api/login-intra/", auth42.login_intra, name="login_intra"),
	path("api/login-intra/callback", Callback42API.as_view(), name="callback"),
	path("api/logout/", views.logout, name="logout"),
	path("api/get-user-pref-lang/", views.get_user_pref_lang, name="get_user_pref_lang"),
]
