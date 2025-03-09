from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views, auth42
from .auth42 import Callback42API

urlpatterns = [
	# path("", views.home, name="home"),
	# path("login/", views.login_view, name="login"),
	# path("logout/", views.logout_view, name="logout"),
	path("api/login/", views.login_view, name="login_api"),
	path("api/2fa-login/", views.verify_2fa_login_form, name="login_2fa_form"),
	path("api/2fa-login/verify/", views.verify_login_2fa, name="verify_login_2fa"),
	path("api/login-form/", views.login_form, name="login_form"),
	path("api/signup-form/", views.signup_form, name="signup_form"),
	path("api/register/", views.register_user, name='register_user'),
	path("api/token/refresh/", TokenRefreshView.as_view(), name='token_refresh'),
	path("api/login-intra/", auth42.login_intra, name="login_intra"),
	path("api/login-intra/callback", Callback42API.as_view(), name="callback"),
	path("api/logout/", views.logout, name="logout"),
	path("api/2fa/enable/", views.enable_2fa, name="enable_2fa"),
    path("api/2fa/verify/", views.verify_2fa, name="verify_2fa"),
	path("api/2fa/disable/", views.disable_2fa, name="disable_2fa"),
    path("api/2fa/status/", views.check_status_2fa, name="check_2fa_status"),
	path("api/user-mgmt/verify-token/", views.verify_token, name="verify_token"),
	path("api/page-not-found/", views.page_not_found, name="page_not_found"),
]