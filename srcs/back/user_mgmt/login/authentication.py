# from rest_framework.authentication import BaseAuthentication
# from rest_framework.exceptions import AuthenticationFailed
# from rest_framework_simplejwt.authentication import JWTAuthentication
# import requests
# import logging
# from django.contrib.auth.models import User

# logger = logging.getLogger(__name__)

# class Intra42Authentication(BaseAuthentication):
#     def authenticate(self, request):
#         print("==========================================================")
#         print(auth_header)
#         print("==========================================================")
#         auth_header = request.headers.get('Authorization')
#         if not auth_header:
#             return None
#         print("==========================================================")
#         print(auth_header)
#         print("==========================================================")
        
#         jwt_authenticator = JWTAuthentication()
#         try:
#             user, validated_token = jwt_authenticator.authenticate(request)
#             if user:
#                 logger.info("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@")
#                 return (user, None)
#         except AuthenticationFailed:
#             logger.info("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
#             raise AuthenticationFailed('Invalid or expired token')
#         raise AuthenticationFailed('Invalid or expired token')