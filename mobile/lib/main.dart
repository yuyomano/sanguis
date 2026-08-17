import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'core/router.dart';
import 'core/theme.dart';
import 'core/notifications_handler.dart';

// Handler de background — debe ser función top-level (isolate separado)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // SharedPreferences sí está disponible en background isolate
  await savePendingRoute(message);
}

Future<void> _initFirebase() async {
  try {
    await Firebase.initializeApp();
    final messaging = FirebaseMessaging.instance;

    // Registrar handler de background ANTES de runApp
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Solicitar permisos
    final settings = await messaging.requestPermission(
      alert: true, badge: true, sound: true, provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional) {
      final token = await messaging.getToken();
      if (token != null) {
        const storage = FlutterSecureStorage();
        await storage.write(key: 'fcm_token', value: token);
      }
    }

    // Renovar token automáticamente
    messaging.onTokenRefresh.listen((newToken) async {
      const storage = FlutterSecureStorage();
      await storage.write(key: 'fcm_token', value: newToken);
    });
  } catch (e) {
    debugPrint('Firebase init skipped: $e');
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await _initFirebase();
  runApp(const ProviderScope(child: SanguisApp()));
}

class SanguisApp extends ConsumerStatefulWidget {
  const SanguisApp({super.key});

  @override
  ConsumerState<SanguisApp> createState() => _SanguisAppState();
}

class _SanguisAppState extends ConsumerState<SanguisApp> {
  @override
  void initState() {
    super.initState();
    _wireNotificationHandlers();
  }

  void _wireNotificationHandlers() {
    // 1. App abierta — notificación en foreground
    FirebaseMessaging.onMessage.listen(handleForegroundMessage);

    // 2. App en background — usuario toca la notificación
    FirebaseMessaging.onMessageOpenedApp.listen(handleTappedNotification);

    // 3. App terminada — usuario toca la notificación (arranca la app)
    FirebaseMessaging.instance.getInitialMessage().then((message) {
      if (message != null) handleTappedNotification(message);
    });

    // 4. Ruta guardada por el background handler (data-only messages)
    consumePendingRoute().then((route) {
      if (route != null) {
        WidgetsBinding.instance.addPostFrameCallback((_) => pushRoute(route));
      }
    });

    // 5. Escuchar stream de navegación y navegar con GoRouter
    notificationRouteStream.listen((route) {
      final router = ref.read(routerProvider);
      router.go(route);
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Sanguis',
      theme: sanguisTheme,
      routerConfig: router,
      scaffoldMessengerKey: scaffoldMessengerKey,
      debugShowCheckedModeBanner: false,
    );
  }
}
