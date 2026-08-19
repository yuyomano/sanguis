import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../../core/donor_provider.dart';
import '../../../core/theme.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _syncFcmToken(WidgetRef ref) async {
    const storage = FlutterSecureStorage();
    final token = await storage.read(key: 'fcm_token');
    if (token == null) return;
    try {
      final dio = ref.read(apiClientProvider);
      await dio.patch('/donors/me/fcm-token', data: {'fcmToken': token});
      await storage.delete(key: 'fcm_token');
    } catch (_) {}
  }

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

    // Sync FCM token to API on first successful profile load
    ref.listen<AsyncValue<Map<String, dynamic>>>(donorProfileProvider, (prev, next) {
      if (next is AsyncData && prev is! AsyncData) {
        _syncFcmToken(ref);
      }
    });

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: SafeArea(
        child: profileAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, __) => _buildContent(context, null),
          data: (donor) => _buildContent(context, donor),
        ),
      ),
      floatingActionButton: FloatingActionButton.small(
        heroTag: 'notifications',
        backgroundColor: Colors.white,
        foregroundColor: kBloodRed,
        tooltip: 'Notificaciones',
        onPressed: () => context.push('/notifications'),
        child: const Icon(Icons.notifications_outlined),
      ),
    );
  }

  Widget _buildContent(BuildContext context, Map<String, dynamic>? donor) {
    final name = donor?['name'] as String? ?? 'Donante';
    final bloodType = donor?['bloodType'] as String? ?? 'O_POSITIVE';
    final points = donor?['pointsBalance'] as int? ?? 0;
    final category = donor?['category'] as String? ?? 'CASUAL';
    final lastDonation = donor?['lastDonationDate'] as String?;

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Container(
            padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [kBloodRed, kBloodRedDark],
              ),
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(32),
                bottomRight: Radius.circular(32),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(
                        'Hola, ${name.split(' ').first} 👋',
                        style: const TextStyle(color: Colors.white70, fontSize: 14),
                      ),
                      Text(
                        name,
                        style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                      ),
                    ]),
                    // Blood type badge
                    Container(
                      width: 58, height: 58,
                      decoration: BoxDecoration(
                        color: Colors.white24, shape: BoxShape.circle,
                        border: Border.all(color: Colors.white38, width: 2),
                      ),
                      child: Center(
                        child: Text(
                          _bloodLabel(bloodType),
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // Points card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white12,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text('Puntos Sanguis', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        Text(
                          '$points pts',
                          style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                        ),
                      ]),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: _categoryColor(category).withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: _categoryColor(category)),
                        ),
                        child: Text(
                          category,
                          style: TextStyle(color: _categoryColor(category), fontWeight: FontWeight.w600, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.all(24),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              // Quick actions
              const Text('Acciones rápidas', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
              const SizedBox(height: 12),
              GridView.count(
                crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.6,
                children: [
                  _QuickActionCard(icon: Icons.event_outlined, label: 'Ver Eventos', color: Colors.blue, onTap: () => context.go('/events')),
                  _QuickActionCard(icon: Icons.water_drop_outlined, label: 'Mis Donaciones', color: kBloodRed, onTap: () => context.go('/donations')),
                  _QuickActionCard(icon: Icons.card_giftcard_outlined, label: 'Canjear Puntos', color: Colors.orange, onTap: () => context.go('/rewards')),
                  _QuickActionCard(icon: Icons.share_outlined, label: 'Referir Amigo', color: Colors.green, onTap: () {}),
                ],
              ),
              const SizedBox(height: 24),

              // Last donation info
              if (lastDonation != null) ...[
                const Text('Última donación', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(children: [
                      Container(
                        width: 48, height: 48,
                        decoration: BoxDecoration(color: kBloodRedLight, shape: BoxShape.circle),
                        child: const Icon(Icons.water_drop, color: kBloodRed, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text('Tu última donación fue el', style: TextStyle(fontSize: 12, color: Colors.grey)),
                        Text(
                          _formatDate(lastDonation),
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                        ),
                      ]),
                      const Spacer(),
                      TextButton(
                        onPressed: () => context.go('/tracker'),
                        child: const Text('Rastrear', style: TextStyle(color: kBloodRed)),
                      ),
                    ]),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ]),
          ),
        ),
      ],
    );
  }

  Color _categoryColor(String cat) {
    return switch (cat) {
      'VIP' => Colors.amber,
      'RECURRENT' => Colors.blue,
      _ => Colors.white60,
    };
  }

  String _formatDate(String iso) {
    final d = DateTime.tryParse(iso);
    if (d == null) return iso;
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }
}

class _QuickActionCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 26),
              Text(label, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13)),
            ],
          ),
        ),
      ),
    );
  }
}
