from django.urls import path
from . import views

urlpatterns = [
	# path("", views.home, name="home"),
	# path("login/", views.login_view, name="login"),
	# path("logout/", views.logout_view, name="logout"),
	path("login/", views.login_view, name="login_api"),
    path("login-form/", views.login_form_api, name="login_form_api"),
	path("user-info/", views.user_info_api, name="user_info_api"),
]