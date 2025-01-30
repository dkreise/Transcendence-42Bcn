import pyotp
import qrcode
from io import BytesIO
from django.http import JsonResponse

class TwoFA:
    @staticmethod
    def generate_secret():
        return pyotp.random_base32()
    
    @staticmethod
    def get_provisioning_uri(secret, username, issuer_name="Transcendence"):
        if not secret or not username:
            raise ValueError("Both secret and username are required.")
            # return JsonResponse({'error': 'Both secret and username are required.'})
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=username, issuer_name=issuer_name)
    
    @staticmethod
    def generate_qrcode(provisioning_uri):
        if not provisioning_uri:
            raise ValueError("Provisioning URI is required to generate QR code.")
            # return JsonResponse({'error': 'Provisioning URI is required to generate QR code.'})
        qr = qrcode.make(provisioning_uri)
        buffer = BytesIO()
        qr.save(buffer, format="PNG")
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def verify_code(secret, code):
        if not secret or not code:
            raise ValueError("Both secret and code are required for verification.")
        totp = pyotp.TOTP(secret)
        # print(totp.verify(code))
        # print("--- Expected code:", pyotp.TOTP(secret).now())
        # return totp.verify(pyotp.TOTP(secret).now())
        return totp.verify(code)