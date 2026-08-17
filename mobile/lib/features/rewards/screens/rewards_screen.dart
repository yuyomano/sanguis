import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/donor_provider.dart';
import '../../../core/theme.dart';

final partnersProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(apiClientProvider);
  final res = await dio.get('/rewards/partners');
  return res.data as List<dynamic>;
});

final myTransactionsProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(apiClientProvider);
  final res = await dio.get('/rewards/me/transactions');
  return res.data as List<dynamic>;
});

const _txTypeLabels = {
  'DONATION': 'Donación',
  'REFERRAL': 'Referido',
  'FREQUENT_MILESTONE': 'Bonus',
  'REDEMPTION': 'Canje',
  'MANUAL': 'Ajuste',
};

const _txTypeIcons = {
  'DONATION': Icons.water_drop,
  'REFERRAL': Icons.person_add,
  'FREQUENT_MILESTONE': Icons.star,
  'REDEMPTION': Icons.redeem,
  'MANUAL': Icons.edit,
};

class RewardsScreen extends ConsumerWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(donorProfileProvider);
    final partnersAsync = ref.watch(partnersProvider);
    final txAsync = ref.watch(myTransactionsProvider);

    final balance = profileAsync.value?['pointsBalance'] as int? ?? 0;
    final category = profileAsync.value?['category'] as String? ?? '';

    return Scaffold(
      appBar: AppBar(title: const Text('Rewards')),
      body: CustomScrollView(
        slivers: [
          // Points header
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [kBloodRed, kBloodRedDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(children: [
                const Text('Tu saldo de puntos', style: TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 8),
                profileAsync.when(
                  loading: () => const SizedBox(
                    height: 52,
                    child: Center(child: CircularProgressIndicator(color: Colors.white54, strokeWidth: 2)),
                  ),
                  error: (_, __) => const Text('—', style: TextStyle(color: Colors.white, fontSize: 44, fontWeight: FontWeight.bold)),
                  data: (_) => Text(
                    balance.toString(),
                    style: const TextStyle(color: Colors.white, fontSize: 44, fontWeight: FontWeight.bold),
                  ),
                ),
                const Text('puntos', style: TextStyle(color: Colors.white70, fontSize: 14)),
                if (category.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: Colors.white24,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _categoryLabel(category),
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _PointsInfo(label: 'Por Donación', value: '100 pts'),
                    _PointsInfo(label: 'Por Referido', value: '50 pts'),
                    _PointsInfo(label: 'Bonus VIP', value: '500 pts'),
                  ],
                ),
              ]),
            ),
          ),

          // Recent transactions
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Text('Movimientos recientes', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
            ),
          ),

          txAsync.when(
            loading: () => const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(child: CircularProgressIndicator()),
              ),
            ),
            error: (_, __) => const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Text('No se pudo cargar el historial', style: TextStyle(color: Colors.grey)),
              ),
            ),
            data: (txList) {
              if (txList.isEmpty) {
                return const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Text('Sin movimientos todavía', style: TextStyle(color: Colors.grey, fontSize: 13)),
                  ),
                );
              }
              final recent = txList.take(5).toList();
              return SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, i) => _TransactionTile(tx: recent[i] as Map<String, dynamic>),
                  childCount: recent.length,
                ),
              );
            },
          ),

          // Partners
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Text('Establecimientos Aliados', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
            ),
          ),

          partnersAsync.when(
            loading: () => const SliverToBoxAdapter(child: Center(child: CircularProgressIndicator())),
            error: (e, _) => SliverToBoxAdapter(child: Center(child: Text('Error: $e'))),
            data: (list) => SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverGrid(
                delegate: SliverChildBuilderDelegate(
                  (context, i) => _PartnerCard(partner: list[i] as Map<String, dynamic>),
                  childCount: list.length,
                ),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2, crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.2,
                ),
              ),
            ),
          ),

          const SliverPadding(padding: EdgeInsets.only(bottom: 80)),
        ],
      ),
    );
  }

  String _categoryLabel(String cat) {
    switch (cat) {
      case 'CASUAL': return 'Donante Casual';
      case 'RECURRENT': return 'Donante Recurrente';
      case 'VIP': return '⭐ Donante VIP';
      default: return cat;
    }
  }
}

class _TransactionTile extends StatelessWidget {
  final Map<String, dynamic> tx;
  const _TransactionTile({required this.tx});

  @override
  Widget build(BuildContext context) {
    final type = tx['type'] as String? ?? '';
    final points = tx['points'] as int? ?? 0;
    final isPositive = points > 0;
    final date = tx['createdAt'] != null
        ? DateTime.tryParse(tx['createdAt'] as String)
        : null;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: CircleAvatar(
        radius: 20,
        backgroundColor: isPositive ? Colors.green.shade50 : Colors.red.shade50,
        child: Icon(
          _txTypeIcons[type] ?? Icons.swap_horiz,
          color: isPositive ? Colors.green.shade700 : Colors.red.shade700,
          size: 18,
        ),
      ),
      title: Text(
        tx['description'] as String? ?? _txTypeLabels[type] ?? type,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      subtitle: date != null
          ? Text(
              '${date.day}/${date.month}/${date.year}',
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            )
          : null,
      trailing: Text(
        '${isPositive ? '+' : ''}$points pts',
        style: TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 14,
          color: isPositive ? Colors.green.shade700 : Colors.red.shade700,
        ),
      ),
    );
  }
}

class _PointsInfo extends StatelessWidget {
  final String label, value;
  const _PointsInfo({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
      Text(label, style: const TextStyle(color: Colors.white70, fontSize: 10)),
    ]);
  }
}

class _PartnerCard extends StatelessWidget {
  final Map<String, dynamic> partner;
  const _PartnerCard({required this.partner});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: () {},
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(color: kBloodRedLight, borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.store_outlined, color: kBloodRed, size: 22),
              ),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(partner['name'] as String, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
                Text(partner['category'] as String? ?? '', style: const TextStyle(color: Colors.grey, fontSize: 11)),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}
