import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../../core/auth_notifier.dart';
import '../../../core/theme.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _id = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _pass = TextEditingController();
  final _referralCode = TextEditingController();

  String _idType = 'CEDULA';
  String _bloodType = 'O_POSITIVE';
  bool _rhFactor = true;
  bool _loading = false;
  String? _error;

  final _bloodTypes = [
    ('O_POSITIVE', 'O+'), ('O_NEGATIVE', 'O-'), ('A_POSITIVE', 'A+'),
    ('A_NEGATIVE', 'A-'), ('B_POSITIVE', 'B+'), ('B_NEGATIVE', 'B-'),
    ('AB_POSITIVE', 'AB+'), ('AB_NEGATIVE', 'AB-'),
  ];

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });

    try {
      final dio = ref.read(apiClientProvider);
      final res = await dio.post('/auth/donor/register', data: {
        'name': _name.text.trim(),
        'idType': _idType,
        'idNumber': _id.text.trim(),
        'phone': _phone.text.trim(),
        'email': _email.text.trim().isEmpty ? null : _email.text.trim(),
        'bloodType': _bloodType,
        'rhFactor': _rhFactor,
        'password': _pass.text,
        if (_referralCode.text.isNotEmpty) 'referralCode': _referralCode.text.trim(),
      });
      await ref.read(authStateProvider.notifier).login(
        res.data['accessToken'],
        res.data['refreshToken'],
      );
    } catch (e) {
      setState(() => _error = 'Error al registrarse. Verifica los datos e intenta de nuevo.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Crear cuenta')),
      body: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              TextFormField(
                controller: _name,
                decoration: const InputDecoration(labelText: 'Nombre completo', prefixIcon: Icon(Icons.person_outlined)),
                validator: (v) => (v?.isEmpty ?? true) ? 'Requerido' : null,
              ),
              const SizedBox(height: 16),
              Row(children: [
                Expanded(
                  flex: 2,
                  child: DropdownButtonFormField<String>(
                    value: _idType,
                    decoration: const InputDecoration(labelText: 'Tipo ID'),
                    items: const [
                      DropdownMenuItem(value: 'CEDULA', child: Text('Cédula')),
                      DropdownMenuItem(value: 'PASSPORT', child: Text('Pasaporte')),
                    ],
                    onChanged: (v) => setState(() => _idType = v!),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 3,
                  child: TextFormField(
                    controller: _id,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Número'),
                    validator: (v) => (v?.isEmpty ?? true) ? 'Requerido' : null,
                  ),
                ),
              ]),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phone,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(labelText: 'Teléfono / WhatsApp', prefixIcon: Icon(Icons.phone_outlined)),
                validator: (v) => (v?.isEmpty ?? true) ? 'Requerido' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email (opcional)', prefixIcon: Icon(Icons.email_outlined)),
              ),
              const SizedBox(height: 16),
              const Text('Tipo de Sangre', style: TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8, runSpacing: 8,
                children: _bloodTypes.map((bt) {
                  final selected = _bloodType == bt.$1;
                  return GestureDetector(
                    onTap: () => setState(() => _bloodType = bt.$1),
                    child: Container(
                      width: 56, height: 56,
                      decoration: BoxDecoration(
                        color: selected ? kBloodRed : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: selected ? kBloodRed : const Color(0xFFE2E8F0)),
                      ),
                      child: Center(
                        child: Text(
                          bt.$2,
                          style: TextStyle(
                            color: selected ? Colors.white : const Color(0xFF1A1A1A),
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _pass,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Contraseña', prefixIcon: Icon(Icons.lock_outlined)),
                validator: (v) => (v?.length ?? 0) < 6 ? 'Mínimo 6 caracteres' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _referralCode,
                decoration: const InputDecoration(
                  labelText: 'Código de referido (opcional)',
                  prefixIcon: Icon(Icons.card_giftcard_outlined),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: kBloodRedLight, borderRadius: BorderRadius.circular(8)),
                  child: Text(_error!, style: const TextStyle(color: kBloodRed, fontSize: 13)),
                ),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _register,
                child: _loading
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Crear cuenta'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
