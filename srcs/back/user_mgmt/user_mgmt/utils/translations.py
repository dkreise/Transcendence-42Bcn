def add_language_context(cookies, context=None):
	if context is None:
		context = {}
	lang = 'EN' if cookies is None else cookies.get('language', 'EN')
	lang_words = get_lang_words(lang)
	context.update(lang_words)

def get_lang_words(lang):
	if lang == 'ES':
		return {
			'lang': "ES",
      		'lang_flag': """
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 1000" width="30" height="20">
                        <rect width="1500" height="333.33" fill="#AA151B" data-lang="ES" />
                        <rect y="333.33" width="1500" height="333.33" fill="#F1BF00" data-lang="ES" />
                        <rect y="666.66" width="1500" height="333.33" fill="#AA151B" data-lang="ES" />
                    </svg>
                    """,
			'profile_wo': "Perfil",
			'settings': "Configuraciones",
			'friends_wo': "Amigos",
			'username': "Nombre de usuario",
			'name_wo': "Nombre",
			'search': "Buscar",
			'remove_friend': "Eliminar amigo",
			'add_friend': "Agregar amigo",
			'no_users_found': "No se encontraron usuarios",
			'your_friends': "Tus amigos",
			'new_photo': "Nueva foto",
			'first_name': "Nombre",
			'last_name': "Apellido",
			'email': "Correo electrónico",
			'save': "Guardar",
			'password': "Contraseña",
			'repeat_password': "Repetir contraseña",
			'click_here': "Clica aquí",
			'or_wo': "O",
			'log_in': "INICIAR SESIÓN",
			'sign_up': "REGISTRARSE",
			'submit': "Enviar",
			'dont_have_account': "¿Aún no tienes una cuenta?",
			'have_account': "¿Ya tienes una cuenta?",
			'statistics': "Estadísticas",
			'games_won': "Juegos ganados",
			'games_played': "Juegos jugados",
			'tournaments_played': "Torneos jugados",
			'tournament_total_score': "Puntuación total del torneo",
			'online': "En línea",
			'offline': "Desconectado",
			'no_friends_yet': "Aún no tienes amigos",
			'profile_photo': "Foto de perfil",
			'setup_two_factor_authentication': "Configurar autenticación en dos pasos",
			'scan_qr_code': "Escanea el código QR",
			'verify_two_factor_authentication': "Verificar autenticación en dos pasos",
			'enter_6_digit_code': "Introduce el código de 6 dígitos",
			'verification_code_placeholder': "Código de verificación",
			'verify': "Verificar",
			'back_to_settings': "Volver a la configuración",
			'go_to_profile': "Ir al perfil",
			'play_against_AI': "Jugar contra la IA",
			'play_locally': "Jugar localmente",
			'play_online': "Jugar en línea",
			'tournaments': "Torneos",
			'match_history': "Historial de partidos",
			'date_wo': "Fecha",
			'winner_wo': "Ganador",
			'tournament': "Torneo",
			'all': "Todos",
			'yes': "Sí",
			'no': "No",
			'apply_filters': "Aplicar filtros",
			'player_wo': "Jugador",
			'score_wo': "Puntuación",
			'no_match_history': "No hay historial de partidos",
			'home': "Inicio",
			'disable_2FA': "Desactivar 2FA",
			'add_2FA': "Agregar 2FA",
			'my_friends': "Mis amigos",
			'page_not_found': "Página no encontrada",
			'msg_page_not_found': "¡Ups! La página que buscas no existe.",
			'rights_reserved': "Todos los derechos reservados.",
			'logout': "Cerrar sesión",
			'error_text': "Texto de error",  
			'exit': "Salir",  
			'back': "Volver atrás",  
			'enter_winner_username_placeholder': "Ingrese usuario del ganador",
			'search_by_username_email_ph': "Buscar por nombre de usuario o correo electrónico",
			'go_back': "Volver Atrás",
			'quit': "SALIR",
			'invalid_credentials': "Credenciales inválidas",
			'password_mismatch': "Las contraseñas no coinciden.",
			'all_fields_required': "Todos los campos son obligatorios.",
			'invalid_username': "El nombre de usuario solo debe contener letras, dígitos y puntos (.).",
			'username_length': "El nombre de usuario y el nombre deben tener entre 2 y 10 caracteres.",
			'invalid_email': "Formato de correo electrónico no válido.",
			'username_exists': "El nombre de usuario ya existe.",
			'email_registered': "El correo electrónico ya está registrado.",
			'invalid_json': "Formato JSON inválido.",
			'user_registered': "Usuario registrado con éxito.",
			'login_successful': "Inicio de sesión exitoso",
			'user_not_authenticated': "Usuario no autenticado",
			'lastname_length': "El apellido debe tener un máximo de 15 caracteres.",
			'please_try_again': "Por favor, inténtalo de nuevo.",
    		'settings_updated': "¡La configuración se ha actualizado!",
			'select_file': "Seleccionar archivo",
			'2fa_not_enable': "La autenticación en dos pasos no está habilitada para esta cuenta.",
			'2fa_verification_success': "Verificación en dos pasos completada con éxito.",
			'invalid_code': "Código TOTP inválido o expirado.",
			'2fa_disable': "La autenticación en dos pasos se ha desactivado correctamente.",
			'invalid_verification_code': "Código de verificación inválido o expirado.",
			'invalid_temp_token': "Token temporal inválido o expirado.",
			'online': "En linea",
			'offline': "Desconectado",

		}

	elif lang == 'CA':
		return {
			'lang': "CA",
      		'lang_flag': """
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="20" viewBox="0 0 810 540" data-lang="CA">
                        <rect width="810" height="540" fill="#FCDD09" data-lang="CA" />
                        <path stroke="#DA121A" stroke-width="60" d="M0,90H810m0,120H0m0,120H810m0,120H0"></path>
                    </svg>
                    """,
			'profile_wo': "Perfil",
			'settings': "Configuracions",
			'friends_wo': "Amics",
			'username': "Nom d'usuari",
			'name_wo': "Nom",
			'search': "Cercar",
			'remove_friend': "Eliminar amic",
			'add_friend': "Afegir amic",
			'no_users_found': "No s'han trobat usuaris",
			'your_friends': "Els teus amics",
			'new_photo': "Nova foto",
			'first_name': "Nom",
			'last_name': "Cognom",
			'email': "Correu electrònic",
			'save': "Desar",
			'password': "Contrasenya",
			'repeat_password': "Repetir contrasenya",
			'click_here': "Fes clic aquí",
			'or_wo': "O",
			'log_in': "INICIAR SESSIÓ",
			'sign_up': "REGISTRA'T",
			'submit': "Envia",
			'dont_have_account': "Encara no tens un compte?",
			'have_account': "Ja tens un compte?",
			'statistics': "Estadístiques",
			'games_won': "Jocs guanyats",
			'games_played': "Jocs jugats",
			'tournaments_played': "Torneigs jugats",
			'tournament_total_score': "Puntuació total del torneig",
			'online': "En línia",
			'offline': "Desconnectat",
			'no_friends_yet': "Encara no tens amics",
			'profile_photo': "Foto de perfil",
			'setup_two_factor_authentication': "Configura l'autenticació en dos factors",
			'scan_qr_code': "Escaneja el codi QR",
			'verify_two_factor_authentication': "Verifica l'autenticació en dos factors",
			'enter_6_digit_code': "Introdueix el codi de 6 dígits",
			'verification_code_placeholder': "Codi de verificació",
			'verify': "Verificar",
			'back_to_settings': "Tornar a la configuració",
			'go_to_profile': "Anar al perfil",
			'play_against_AI': "Jugar contra la IA",
			'play_locally': "Jugar localment",
			'play_online': "Jugar en línia",
			'tournaments': "Torneigs",
			'match_history': "Historial de partits",
			'date_wo': "Data",
			'winner_wo': "Guanyador",
			'tournament': "Torneig",
			'all': "Tots",
			'yes': "Sí",
			'no': "No",
			'apply_filters': "Aplicar filtres",
			'player_wo': "Jugador",
			'score_wo': "Puntuació",
			'no_match_history': "No hi ha historial de partits",
			'home': "Inici",
			'disable_2FA': "Desactivar 2FA",
			'add_2FA': "Afegir 2FA",
			'my_friends': "Els meus amics",
			'page_not_found': "Pàgina no trobada",
			'msg_page_not_found': "Ups! La pàgina que busques no existeix.",
			'rights_reserved': "Tots els drets reservats.",
			'logout': "Tancar sessió",
			'error_text': "Text d'error",  
			'exit': "Sortir",  
			'back': "Tornar enrrere",  
			'enter_winner_username_placeholder': "Introdueix usuari del guanyador",  
			'search_by_username_email_ph': "Cercar per nom d'usuari o correu electrònic",
			'go_back': "Tornar enrrere",
			'quit': "SORTIR",
			'invalid_credentials': "Credencials invàlides",
			'password_mismatch': "Les contrasenyes no coincideixen.",
			'all_fields_required': "Tots els camps són obligatoris.",
			'invalid_username': "El nom d'usuari només ha de contenir lletres, dígits i punts (.).",
			'username_length': "El nom d'usuari i el nom han de tenir entre 2 i 10 caràcters.",
			'invalid_email': "Format de correu electrònic no vàlid.",
			'username_exists': "El nom d'usuari ja existeix.",
			'email_registered': "El correu electrònic ja està registrat.",
			'invalid_json': "Format JSON no vàlid.",
			'user_registered': "Usuari registrat amb èxit.",
			'login_successful': "Sessió iniciada amb èxit",
			'user_not_authenticated': "Usuari no autenticat",
			'lastname_length': "El cognom ha de tenir un màxim de 15 caràcters.",
			'please_try_again': "Si us plau, torna-ho a provar.",
    		'settings_updated': "La configuració s'ha actualitzat!",
			'select_file': "Selecciona un fitxer",
			'2fa_not_enable': "L'autenticació en dos passos no està habilitada per a aquest compte.",
			'2fa_verification_success': "Verificació en dos passos completada amb èxit.",
			'invalid_code': "Codi TOTP invàlid o caducat.",
			'2fa_disable': "L'autenticació en dos passos s'ha desactivat correctament.",
			'invalid_verification_code': "Codi de verificació invàlid o caducat.",
			'invalid_temp_token': "Token temporal invàlid o caducat.",
			'online': "Conectat",
			'offline': "Desconnectat",
		}

	elif lang == 'RU':
		return {
			'lang': "RU",
      		'lang_flag': """
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="30" height="20">
                        <rect width="3" height="2" fill="#fff" data-lang="RU"/>
                        <rect width="3" height="1.333" y="0.667" fill="#0033a0" data-lang="RU"/>
                        <rect width="3" height="0.667" y="1.333" fill="#d52b1e" data-lang="RU"/>
                    </svg>
                    """,
			'profile_wo': "Профиль",
			'settings': "Настройки",
			'friends_wo': "Друзья",
			'username': "Логин",
			'name_wo': "Имя",
			'search': "Поиск",
			'remove_friend': "Удалить друга",
			'add_friend': "Добавить друга",
			'no_users_found': "Пользователи не найдены",
			'your_friends': "Ваши друзья",
			'new_photo': "Новое фото",
			'first_name': "Имя",
			'last_name': "Фамилия",
			'email': "Электронная почта",
			'save': "Сохранить",
			'password': "Пароль",
			'repeat_password': "Повторите пароль",
			'click_here': "нажмите здесь",
			'or_wo': "ИЛИ",
			'log_in': "ВОЙТИ",
			'sign_up': "Регистрация",
			'submit': "Отправить",
			'dont_have_account': "У вас еще нет учетной записи?",
			'have_account': "У вас уже есть учетная запись?",
			'statistics': "Статистика",
			'games_won': "Выигранo",
			'games_played': "Сыграно",
			'tournaments_played': "Турниров",
			'tournament_total_score': "Счет турниров",
			'online': "В сети",
			'offline': "Не в сети",
			'no_friends_yet': "У вас еще нет друзей",
			'profile_photo': "Фото профиля",
			'setup_two_factor_authentication': "Настройка двухфакторной аутентификации",
			'scan_qr_code': "Сканируйте QR-код",
			'verify_two_factor_authentication': "Подтвердите двухфакторную аутентификацию",
			'enter_6_digit_code': "Введите 6-значный код",
			'verification_code_placeholder': "Код подтверждения",
			'verify': "Подтвердить",
			'back_to_settings': "Вернуться к настройкам",
			'go_to_profile': "Перейти в профиль",
			'play_against_AI': "Против бота",
			'play_locally': "С другом",
			'play_online': "Онлайн",
			'tournaments': "Турнир",
			'match_history': "История матчей",
			'date_wo': "Дата",
			'winner_wo': "Победитель",
			'tournament': "Турнир",
			'quit': "Выйти",
			'all': "Все",
			'yes': "Да",
			'no': "Нет",
			'apply_filters': "Применить фильтры",
			'player_wo': "Игрок",
			'score_wo': "Счет",
			'no_match_history': "Нет истории матчей",
			'home': "Главная",
			'disable_2FA': "Отключить 2FA",
			'add_2FA': "Добавить 2FA",
			'my_friends': "Мои друзья",
			'page_not_found': "Страница не найдена",
			'msg_page_not_found': "Упс! Страница, которую вы ищете, не существует.",
			'rights_reserved': "Все права защищены.",
			'logout': "Выйти",
			'error_text': "Текст ошибки",  
			'exit': "Выход",  
			'back': "Назад",  
			'enter_winner_username_placeholder': "Введите имя пользователя победителя",  
			'search_by_username_email_ph': "Поиск по имени пользователя или электронной почте",
			'go_back': "Вернуться назад",
			'invalid_credentials': "Недействительные учетные данные",
			'password_mismatch': "Пароли не совпадают.",
			'all_fields_required': "Все поля обязательны.",
			'invalid_username': "Имя пользователя должно содержать только буквы, цифры и точки (.).",
			'username_length': "Имя пользователя и имя должны содержать от 2 до 10 символов.",
			'invalid_email': "Недопустимый формат электронной почты.",
			'username_exists': "Имя пользователя уже существует.",
			'email_registered': "Электронная почта уже зарегистрирована.",
			'invalid_json': "Неверный формат JSON.",
			'user_registered': "Пользователь успешно зарегистрирован!",
			'login_successful': "Вход выполнен успешно",
			'user_not_authenticated': "Пользователь не аутентифицирован",
			'lastname_length': "Фамилия должна содержать не более 15 символов.",
			'please_try_again': "Пожалуйста, попробуйте снова.",
    		'settings_updated': "Настройки были обновлены!",
			'select_file': "Выберите файл",
			'2fa_not_enable': "Двухфакторная аутентификация не включена для этого аккаунта.",
			'2fa_verification_success': "Двухфакторная аутентификация пройдена успешно.",
			'invalid_code': "Недействительный или истекший TOTP-код.",
			'2fa_disable': "Двухфакторная аутентификация успешно отключена.",
			'invalid_verification_code': "Неверный или истекший код подтверждения.",
			'invalid_temp_token': "Недействительный или истекший временный токен.",
			'online': "онлайн",
			'offline': "деконектадо",
		}

	elif lang == 'LV':
		return {
			'lang': "LV",
      		'lang_flag': """
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="30" height="20">
                        <rect width="200" height="40" fill="#9E3039" data-lang="LV" />
                        <rect y="40" width="200" height="20" fill="#FFFFFF" data-lang="LV" />
                        <rect y="60" width="200" height="40" fill="#9E3039" data-lang="LV" />
                    </svg>
                    """,
			'profile_wo': "Profils",
			'settings': "Iestatījumi",
			'friends_wo': "Draugi",
			'username': "Lietotājvārds",
			'name_wo': "Vārds",
			'search': "Meklēt",
			'remove_friend': "Noņemt draugu",
			'add_friend': "Pievienot draugu",
			'no_users_found': "Lietotāji nav atrasti",
			'your_friends': "Jūsu draugi",
			'new_photo': "Jauna fotogrāfija",
			'first_name': "Vārds",
			'last_name': "Uzvārds",
			'email': "E-pasts",
			'save': "Saglabāt",
			'password': "Parole",
			'repeat_password': "Atkārtot paroli",
			'click_here': "Klikšķiniet šeit",
			'or_wo': "VAI",
			'log_in': "PIESLĒGTIES",
			'sign_up': "REĢISTRĒTIES",
			'submit': "Iesniegt",
			'dont_have_account': "Vai jums vēl nav konta?",
			'have_account': "Vai jums jau ir konts?",
			'statistics': "Statistika",
			'games_won': "Uzvarētās spēles",
			'games_played': "Spēlētās spēles",
			'tournaments_played': "Turnīri spēlēti",
			'tournament_total_score': "Turnīra kopvērtējums",
			'online': "Tiešsaistē",
			'offline': "Bezsaistē",
			'no_friends_yet': "Jums vēl nav draugu",
			'profile_photo': "Profila foto",
			'setup_two_factor_authentication': "Iestatīt divu faktoru autentifikāciju",
			'scan_qr_code': "Skatiet QR kodu",
			'verify_two_factor_authentication': "Pārbaudīt divu faktoru autentifikāciju",
			'enter_6_digit_code': "Ievadiet 6 ciparu kodu",
			'verification_code_placeholder': "Verifikācijas kods",
			'verify': "Apstiprināt",
			'back_to_settings': "Atgriezties pie iestatījumiem",
			'go_to_profile': "Doties uz profilu",
			'play_against_AI': "Spēlēt pret AI",
			'play_locally': "Spēlēt vietēji",
			'play_online': "Spēlēt tiešsaistē",
			'tournaments': "Turnīri",
			'match_history': "Spēļu vēsture",
			'date_wo': "Datums",
			'winner_wo': "Uzvarētājs",
			'tournament': "Turnīrs",
			'all': "Visi",
			'yes': "Jā",
			'no': "Nē",
			'apply_filters': "Pielietot filtrus",
			'player_wo': "Spēlētājs",
			'score_wo': "Rezultāts",
			'no_match_history': "Nav spēļu vēstures",
			'home': "Mājas",
			'disable_2FA': "Atspējot 2FA",
			'add_2FA': "Pievienot 2FA",
			'my_friends': "Mani draugi",
			'page_not_found': "Lapa nav atrasta",
			'msg_page_not_found': "Ups! Lapa, kuru meklējat, neeksistē.",
			'rights_reserved': "Visas tiesības aizsargātas.",
			'logout': "Iziet",
			'error_text': "Kļūdas teksts",  
			'exit': "Iziet",  
			'back': "Atpakaļ",  
			'enter_winner_username_placeholder': "Ievadiet uzvarētāja lietotājvārdu",  
			'search_by_username_email_ph': "Meklēt pēc lietotājvārda vai e-pasta",
			'go_back': "Atgriezties atpakaļ",
			'quit': "IZIET",
			'invalid_credentials': "Nederīgi akreditācijas dati",
			'password_mismatch': "Paroles nesakrīt.",
			'all_fields_required': "Visi lauki ir obligāti.",
			'invalid_username': "Lietotājvārdam jābūt tikai burtiem, cipariem un punktiem (.).",
			'username_length': "Lietotājvārdam un vārdam jābūt no 2 līdz 10 rakstzīmēm.",
			'invalid_email': "Nederīgs e-pasta formāts.",
			'username_exists': "Lietotājvārds jau pastāv.",
			'email_registered': "E-pasts jau ir reģistrēts.",
			'invalid_json': "Nederīgs JSON formāts.",
			'user_registered': "Lietotājs veiksmīgi reģistrēts!",
			'login_successful': "Pieteikšanās veiksmīga",
			'user_not_authenticated': "Lietotājs nav autentificēts",
			'lastname_length': "Uzvārds nedrīkst pārsniegt 15 rakstzīmes.",
			'please_try_again': "Lūdzu, mēģiniet vēlreiz.",
    		'settings_updated': "Iestatījumi tika atjaunināti!",
			'select_file': " Izvēlieties failu",
			'settings_updated': "Iestatījumi tika atjaunināti!",
			'2fa_not_enable': "Divfaktoru autentifikācija šim kontam nav iespējota.",
			'2fa_verification_success': "Divfaktoru autentifikācija veiksmīgi pabeigta.",
			'invalid_code': "Nederīgs vai beidzies TOTP kods.",
			'2fa_disable': "Divfaktoru autentifikācija veiksmīgi atspējota.",
			'invalid_verification_code': "Nederīgs vai beidzies verifikācijas kods.",
			'invalid_temp_token': "Nederīgs vai beidzies pagaidu pilnvarojuma žetons.",
			'online': "tiešsaistē",
			'offline': "bezsaistē",
		}
		
	else:
		return {
			'lang': "EN",
      		'lang_flag': """
                    <svg width="30" height="20" viewBox="0 0 64 32" xmlns="http://www.w3.org/2000/svg">
						<rect width="64" height="32" fill="#012169" data-lang="EN"/>
						<path d="M0,0 L64,32 M64,0 L0,32" stroke="#FFF" stroke-width="6" data-lang="EN"/>
						<path d="M0,0 L64,32 M64,0 L0,32" stroke="#C8102E" stroke-width="4" data-lang="EN"/>
						<rect x="26" width="12" height="32" fill="#FFF" data-lang="EN"/>
						<rect y="10" width="64" height="12" fill="#FFF" data-lang="EN"/>
						<rect x="28" width="8" height="32" fill="#C8102E" data-lang="EN"/>
						<rect y="12" width="64" height="8" fill="#C8102E" data-lang="EN"/>
                    </svg>
                    """,
			'profile_wo': "Profile",
			'settings': "Settings",
			'friends_wo': "Friends",
			'username': "Username",
			'name_wo': "Name",
			'search': "Search",
			'remove_friend': "Remove friend",
			'add_friend': "Add friend",
			'no_users_found': "No users found",
			'your_friends': "Your friends",
			'new_photo': "New photo",
			'first_name': "First name",
			'last_name': "Last name",
			'email': "Email",
			'save': "Save",
			'password': "Password",
			'repeat_password': "Repeat password",
			'click_here': "Click here",
			'or_wo': "OR",
			'log_in': "LOG IN",
			'sign_up': "SIGN UP",
			'submit': "Submit",
			'dont_have_account': "Don't have an account yet?",
			'have_account': "Already have an account?",
			'statistics': "Statistics",
			'games_won': "Games won",
			'games_played': "Games played",
			'tournaments_played': "Tournaments played",
			'tournament_total_score': "Tournament total score",
			'online': "Online",
			'offline': "Offline",
			'no_friends_yet': "You have no friends yet",
			'profile_photo': "Profile photo",
			'setup_two_factor_authentication': "Set up two-factor authentication",
			'scan_qr_code': "Scan the QR code",
			'verify_two_factor_authentication': "Verify two-factor authentication",
			'enter_6_digit_code': "Enter the 6-digit code",
			'verification_code_placeholder': "Verification code",
			'verify': "Verify",
			'back_to_settings': "Back to settings",
			'go_to_profile': "Go to profile",
			'play_against_AI': "VS. AI",
			'play_locally': "Local",
			'play_online': "Online",
			'tournaments': "Tournament",
			'match_history': "Match history",
			'date_wo': "Date",
			'winner_wo': "Winner",
			'tournament': "Tournament",
			'all': "All",
			'yes': "Yes",
			'no': "No",
			'apply_filters': "Apply filters",
			'player_wo': "Player",
			'score_wo': "Score",
			'no_match_history': "No match history",
			'home': "Home",
			'disable_2FA': "Disable 2FA",
			'add_2FA': "Add 2FA",
			'my_friends': "My friends",
			'page_not_found': "Page not found",
			'msg_page_not_found': "Oops! The page you are looking for doesn’t exist.",
			'rights_reserved': "All rights reserved.",
			'logout': "Logout",
			'error_text': "Error Text",  
			'exit': "Exit",  
			'back': "Go back",  
			'enter_winner_username_placeholder': "Enter winner's username",
			'search_by_username_email_ph': "Search by username or email",
			'go_back': "Go back",
			'quit': "QUIT",
			'invalid_credentials': "Invalid credentials",
			'password_mismatch': "Password mismatch.",
			'all_fields_required': "All fields are required.",
			'invalid_username': "Username should consist only of letters, digits, and dots (.).",
			'username_length': "Username and Name should be 2-10 (included) chars length.",
			'invalid_email': "Invalid email format.",
			'username_exists': "Username already exists.",
			'email_registered': "Email already registered.",
			'invalid_json': "Invalid JSON format.",
			'user_registered': "User registered successfully!",
			'login_successful': "Login successful",
			'user_not_authenticated': "User not authenticated",
			'lastname_length': "Last Name should be a maximum of 15 characters long.",
			'please_try_again': "Please try again.",
    		'settings_updated': "Settings were updated!",
			'select_file': "Select File",
			'2fa_not_enable': "2FA is not enabled for this account.",
			'2fa_verification_success': "2FA verification successful.",
			'invalid_code': "Invalid or expired TOTP code.",
			'2fa_disable': "2FA disabled successfully.",
			'invalid_verification_code': "Invalid or expired verification code.",
			'invalid_temp_token': "Invalid or expired temporary token.",
			'online': "online",
			'offline': "offline",
		}

