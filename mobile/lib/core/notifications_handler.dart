import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Stream que emite rutas de navegación cuando el usuario toca una notificación
final _routeController = StreamController<String>.broadcast();
Stream<String> get notificationRouteStream => _routeController.stream;

/// Emite una ruta directamente al stream (para rutas guardadas en background)
void pushRoute(String route) => _routeController.add(route);

// Clave global para mostrar banners en foreground desde fuera del árbol de widgets
final scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

/// Parsea los datos de un mensaje FCM y retorna la ruta destino
String? parseRoute(RemoteMessage message) {
  final data = message.data;
  final type = data['type'] as String?;
  final id = data['id'] as String?;
  switch (type) {
    case 'event':     return id != null ? '/events/$id' : '/events';
    case 'test_result': return '/test-results';
    case 'emergency': return '/home';
    case 'reward':    return '/rewards';
    default:          return null;
  }
}

/// Navega a la ruta extraída del mensaje. Llamar desde onMessageOpenedApp.
void handleTappedNotification(RemoteMessage message) {
  final route = parseRoute(message);
  if (route != null) _routeController.add(route);
}

/// Muestra un banner en-app cuando llega una notificación en foreground.
void handleForegroundMessage(RemoteMessage message) {
  final notification = message.notification;
  final title = notification?.title ?? message.data['title'] as String? ?? 'Sanguis';
  final body  = notification?.body  ?? message.data['body']  as String? ?? '';

  scaffoldMessengerKey.currentState?.showSnackBar(
    SnackBar(
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          if (body.isNotEmpty) Text(body, style: const TextStyle(fontSize: 12), maxLines: 2, overflow: TextOverflow.ellipsis),
        ],
      ),
      action: SnackBarAction(
        label: 'Ver',
        onPressed: () => handleTappedNotification(message),
      ),
      duration: const Duration(seconds: 5),
      behavior: SnackBarBehavior.floating,
      margin: const EdgeInsets.all(12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ),
  );
}

/// Guarda la ruta pendiente en SharedPreferences para cuando la app estaba terminada.
/// Llamar desde el background handler (isolate separado — sin acceso a Riverpod).
Future<void> savePendingRoute(RemoteMessage message) async {
  final route = parseRoute(message);
  if (route == null) return;
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString('pending_notification_route', route);
}

/// Lee y limpia la ruta pendiente guardada por el background handler.
/// Llamar en el arranque de la app.
Future<String?> consumePendingRoute() async {
  final prefs = await SharedPreferences.getInstance();
  final route = prefs.getString('pending_notification_route');
  if (route != null) await prefs.remove('pending_notification_route');
  return route;
}
