import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/auth_notifier.dart';
import '../../../core/donor_provider.dart';
import '../../../core/theme.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(donorProfileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Configuración'), centerTitle: true),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Cuenta ──────────────────────────────────────────────────────
          _SectionHeader(label: 'Mi cuenta'),
          profileAsync.when(
            loading: () => const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator())),
            error: (_, __) => const SizedBox.shrink(),
            data: (donor) => Card(
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: BorderSide(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  _InfoRow(label: 'Nombre', value: donor['name'] as String? ?? '—'),
                  _Divider(),
                  _InfoRow(label: 'Cédula / Documento', value: donor['idNumber'] as String? ?? '—'),
                  _Divider(),
                  _InfoRow(
                    label: 'Tipo de sangre',
                    value: (donor['bloodType'] as String? ?? '')
                        .replaceAll('_POSITIVE', '+')
                        .replaceAll('_NEGATIVE', '-')
                        .replaceAll('A_', 'A')
                        .replaceAll('B_', 'B')
                        .replaceAll('O_', 'O')
                        .replaceAll('AB_', 'AB'),
                  ),
                  _Divider(),
                  _InfoRow(label: 'Email', value: donor['email'] as String? ?? '—'),
                  _Divider(),
                  _InfoRow(label: 'Teléfono', value: donor['phone'] as String? ?? '—'),
                  _Divider(),
                  _InfoRow(
                    label: 'Código de referido',
                    value: (donor['referralCode'] as String? ?? '').substring(0, 8).toUpperCase(),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // ── Notificaciones ───────────────────────────────────────────────
          _SectionHeader(label: 'Notificaciones'),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                _NavRow(
                  icon: Icons.notifications_outlined,
                  label: 'Mis notificaciones',
                  onTap: () => context.push('/notifications'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // ── Acerca de ────────────────────────────────────────────────────
          _SectionHeader(label: 'Acerca de'),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                _InfoRow(label: 'Versión', value: '1.0.0'),
                _Divider(),
                _InfoRow(label: 'País', value: 'República Dominicana'),
                _Divider(),
                _InfoRow(label: 'Soporte', value: 'soporte@sanguis.do'),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // ── Sesión ───────────────────────────────────────────────────────
          _SectionHeader(label: 'Sesión'),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: BorderSide(color: Colors.red.shade50),
            ),
            child: ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Cerrar sesión', style: TextStyle(color: Colors.red, fontWeight: FontWeight.w500)),
              onTap: () async {
                final confirmed = await showDialog<bool>(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Cerrar sesión'),
                    content: const Text('¿Estás seguro de que quieres cerrar sesión?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancelar')),
                      TextButton(
                        onPressed: () => Navigator.pop(ctx, true),
                        style: TextButton.styleFrom(foregroundColor: Colors.red),
                        child: const Text('Cerrar sesión'),
                      ),
                    ],
                  ),
                );
                if (confirmed == true) {
                  ref.read(authStateProvider.notifier).logout();
                }
              },
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String label;
  const _SectionHeader({required this.label});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(left: 4, bottom: 8),
    child: Text(
      label.toUpperCase(),
      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey.shade500, letterSpacing: 0.8),
    ),
  );
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
        Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.black87)),
      ],
    ),
  );
}

class _NavRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _NavRow({required this.icon, required this.label, required this.onTap});
  @override
  Widget build(BuildContext context) => ListTile(
    leading: Icon(icon, size: 20, color: Colors.grey.shade600),
    title: Text(label, style: const TextStyle(fontSize: 14)),
    trailing: Icon(Icons.chevron_right, size: 18, color: Colors.grey.shade400),
    onTap: onTap,
  );
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) =>
      Divider(height: 1, indent: 16, endIndent: 16, color: Colors.grey.shade100);
}
