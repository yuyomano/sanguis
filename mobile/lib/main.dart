import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'core/router.dart';
import 'core/theme.dart';

Future<void> _initFirebase() async {
  try {
    await Firebase.initializeApp();
    final messaging = FirebaseMessaging.instance;
    final settings = await messaging.requestPermission();
    if (settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional) {
      final token = await messaging.getToken();
      if (token != null) {
        // Guardado en storage; home_screen lo sincroniza al API después del login
        const storage = FlutterSecureStorage();
        await storage.write(key: 'fcm_token', value: token);
      }
    }
    // Renovar token si cambia
    messaging.onTokenRefresh.listen((newToken) async {
      const storage = FlutterSecureStorage();
      await storage.write(key: 'fcm_token', value: newToken);
    });
  } catch (e) {
    // Firebase no configurado o falla de red — continúa sin push
    debugPrint('Firebase init skipped: $e');
  }
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await _initFirebase();
  runApp(const ProviderScope(child: SanguisApp()));
}

class SanguisApp extends ConsumerWidget {
  const SanguisApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'Sanguis',
      theme: sanguisTheme,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
    );
  }
}
