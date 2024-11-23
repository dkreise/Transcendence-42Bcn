from django.urls import path
from . import views

urlpatterns = [
	# path("", views.home, name="home"),
	# path("login/", views.login_view, name="login"),
	# path("logout/", views.logout_view, name="logout"),
	path("api/login/", views.login_view, name="login_api"),
    path("api/login-form/", views.login_form_api, name="login_form_api"),
	path("api/user-info/", views.user_info_api, name="user_info_api"),
]