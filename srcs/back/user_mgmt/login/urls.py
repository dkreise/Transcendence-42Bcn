from django.urls import path
from . import views

urlpatterns = [
	path("", views.home, name="home"),
	path("login/", views.login_view, name="login"),
	path("logout/", views.logout_view, name="logout"),
	path('test/', views.test_view),
	path('new-page/', views.new_page, name='new_page'),
	path('add-user/', views.add_user, name='add_user'),
	path('get-users/', views.get_users, name='get_users')
]