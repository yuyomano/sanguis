import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../../core/auth_notifier.dart';
import '../../../core/theme.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _idController = TextEditingController();
  final _passController = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      final dio = ref.read(apiClientProvider);
      final res = await dio.post('/auth/donor/login', data: {
        'idNumber': _idController.text.trim(),
        'password': _passController.text,
      });
      await ref.read(authStateProvider.notifier).login(
        res.data['accessToken'],
        res.data['refreshToken'],
      );
    } catch (e) {
      setState(() => _error = 'Cédula o contraseña incorrectos');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 48),
              // Logo
              Container(
                width: 80, height: 80,
                decoration: const BoxDecoration(
                  color: kBloodRed, shape: BoxShape.circle,
                ),
                child: const Center(child: Text('🩸', style: TextStyle(fontSize: 36))),
              ),
              const SizedBox(height: 20),
              const Text(
                'Sanguis',
                style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF1A1A1A)),
              ),
              const Text(
                'Dona sangre, salva vidas',
                style: TextStyle(fontSize: 14, color: Color(0xFF718096)),
              ),
              const SizedBox(height: 48),

              // Form
              TextField(
                controller: _idController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Cédula o Pasaporte',
                  prefixIcon: Icon(Icons.badge_outlined),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Contraseña',
                  prefixIcon: Icon(Icons.lock_outlined),
                ),
              ),
              const SizedBox(height: 8),

              if (_error != null) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(children: [
                    const Icon(Icons.error_outline, color: kBloodRed, size: 18),
                    const SizedBox(width: 8),
                    Text(_error!, style: const TextStyle(color: kBloodRed, fontSize: 13)),
                  ]),
                ),
              ],

              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _login,
                child: _loading
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Iniciar sesión'),
              ),
              const SizedBox(height: 16),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Text('¿No tienes cuenta? ', style: TextStyle(color: Color(0xFF718096))),
                GestureDetector(
                  onTap: () => context.go('/register'),
                  child: const Text(
                    'Regístrate',
                    style: TextStyle(color: kBloodRed, fontWeight: FontWeight.w600),
                  ),
                ),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}
