import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final authStateProvider = StateNotifierProvider<AuthNotifier, bool>((ref) {
  return AuthNotifier();
});

class AuthNotifier extends StateNotifier<bool> {
  final _storage = const FlutterSecureStorage();

  AuthNotifier() : super(false) {
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final token = await _storage.read(key: 'access_token');
    state = token != null;
  }

  Future<void> login(String accessToken, String refreshToken) async {
    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'refresh_token', value: refreshToken);
    state = true;
  }

  Future<void> logout() async {
    await _storage.deleteAll();
    state = false;
  }

  Future<String?> getToken() => _storage.read(key: 'access_token');
}
