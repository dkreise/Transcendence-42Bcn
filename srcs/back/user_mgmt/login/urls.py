from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
	# path("", views.home, name="home"),
	# path("login/", views.login_view, name="login"),
	# path("logout/", views.logout_view, name="logout"),

	path("api/login/", views.login_view, name="login_api"),
	path("api/login-form/", views.login_form_api, name="login_form_api"),
	# path("api/user-info/", views.user_info_api, name="user_info_api"),
	path("api/register/", views.register_user, name='register_user'),
	path("api/token/refresh/", TokenRefreshView.as_view(), name='token_refresh'),
	#path("login/", views.login_view, name="login_api"),
  # path("login-form/", views.login_form_api, name="login_form_api"),
	#path("user-info/", views.user_info_api, name="user_info_api"),
	#path("sigin-form/", views.sigin_form_api, name="sigin_form_api"),
]
