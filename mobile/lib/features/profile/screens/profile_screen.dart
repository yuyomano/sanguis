import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import '../../../core/auth_notifier.dart';
import '../../../core/donor_provider.dart';
import '../../../core/theme.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  String _bloodLabel(String type) {
    return type
        .replaceAll('_POSITIVE', '+')
        .replaceAll('_NEGATIVE', '-')
        .replaceAll('A_', 'A')
        .replaceAll('B_', 'B')
        .replaceAll('O_', 'O')
        .replaceAll('AB_', 'AB');
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(donorProfileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Mi Perfil')),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => _buildContent(context, ref, null),
        data: (donor) => _buildContent(context, ref, donor),
      ),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, Map<String, dynamic>? donor) {
    final name = donor?['name'] as String? ?? 'Donante';
    final idNumber = donor?['idNumber'] as String? ?? '—';
    final bloodType = _bloodLabel(donor?['bloodType'] as String? ?? '');
    final referralCode = donor?['referralCode'] as String? ?? '';

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: kBloodRedLight,
                child: const Icon(Icons.person, color: kBloodRed, size: 32),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                  Text(idNumber, style: const TextStyle(color: Colors.grey)),
                  const SizedBox(height: 4),
                  Row(children: [
                    const Icon(Icons.water_drop, color: kBloodRed, size: 14),
                    const SizedBox(width: 4),
                    Text(bloodType.isEmpty ? '—' : bloodType,
                        style: const TextStyle(fontWeight: FontWeight.w600)),
                  ]),
                ]),
              ),
            ]),
          ),
        ),
        const SizedBox(height: 16),
        _MenuItem(
          icon: Icons.science_outlined,
          label: 'Resultados de Salud',
          onTap: () => context.go('/test-results'),
        ),
        _MenuItem(
          icon: Icons.location_on_outlined,
          label: 'Rastrear mi Sangre',
          onTap: () => context.go('/tracker'),
        ),
        _MenuItem(
          icon: Icons.notifications_outlined,
          label: 'Mis Notificaciones',
          onTap: () => context.push('/notifications'),
        ),
        _MenuItem(
          icon: Icons.settings_outlined,
          label: 'Configuración',
          onTap: () => context.push('/settings'),
        ),
        _MenuItem(
          icon: Icons.share_outlined,
          label: 'Referir a un Amigo',
          onTap: referralCode.isNotEmpty
              ? () => Share.share(
                    '¡Únete a Sanguis y dona sangre! Usa mi código de referido: $referralCode\nhttps://app.sanguis.do',
                  )
              : () {},
        ),
        _MenuItem(icon: Icons.history_outlined, label: 'Historial de Puntos', onTap: () {}),
        _MenuItem(icon: Icons.notifications_outlined, label: 'Configurar Notificaciones', onTap: () {}),
        _MenuItem(icon: Icons.privacy_tip_outlined, label: 'Privacidad', onTap: () {}),
        const SizedBox(height: 8),
        _MenuItem(
          icon: Icons.logout,
          label: 'Cerrar sesión',
          color: kBloodRed,
          onTap: () async {
            await ref.read(authStateProvider.notifier).logout();
          },
        ),
      ],
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;

  const _MenuItem({required this.icon, required this.label, required this.onTap, this.color});

  @override
  Widget build(BuildContext context) {
    final c = color ?? const Color(0xFF1A1A1A);
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(icon, color: c),
        title: Text(label, style: TextStyle(color: c, fontWeight: FontWeight.w500)),
        trailing: const Icon(Icons.chevron_right, color: Colors.grey),
        onTap: onTap,
      ),
    );
  }
}
