from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import InvalidToken

class CustomTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except get_user_model().DoesNotExist:
            return Response({"detail": "User does not exist"}, status=status.HTTP_401_UNAUTHORIZED)
        except InvalidToken as e:
            return Response({"detail": "Invalid token", "error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({"detail": "Token refresh error", "error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
            # return Response({"detail": "Token refresh error", "error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
