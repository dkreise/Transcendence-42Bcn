from django.utils.translation import activate

def add_language_context(request, context):
	lang = request.COOKIES.get('language') or 'en'
	lang_words = get_lang_words(lang)
	context.update(lang_words)
	
def get_lang_words(lang):
	if lang == 'es':
		return {
			'my_profile': "Mi perfil",
            'enter_name': "Indica el nombre del segundo jugador:",
            'start_game': "Empezar el juego",

		}
	elif lang == 'ca':
		return {
			'my_profile': "El meu perfil",
            'enter_name': "",
            'start_game': "",
		}
	elif lang == 'ru':
		return {
			'my_profile': "Мой профиль",
			'enter_name': "",
            'start_game': "",
		}
	elif lang == 'lv':
		return {
			'my_profile': "Mans profils",
			'enter_name': "",
            'start_game': "",
		}
	else:  # Default to English if no match
		return {
			'my_profile': "My Profile",
			'enter_name': "Enter second player's name:",
            'start_game': "Start the game",
			'restart': "Restart",
			'play again': "Play again",
			'back': "Back",
			'logout': "Logout",
			'waiting_message': "Waiting for player...",
			'game_title': "CRRRRAAAZZZY PONG!",
			'restart': "Restart"
		}