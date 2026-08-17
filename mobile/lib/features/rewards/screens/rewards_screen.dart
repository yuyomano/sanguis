import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/theme.dart';

final partnersProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(apiClientProvider);
  final res = await dio.get('/rewards/partners');
  return res.data as List<dynamic>;
});

class RewardsScreen extends ConsumerWidget {
  const RewardsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final partners = ref.watch(partnersProvider);

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
                gradient: const LinearGradient(colors: [kBloodRed, kBloodRedDark]),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(children: [
                const Text('Tu saldo de puntos', style: TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 8),
                const Text('—', style: TextStyle(color: Colors.white, fontSize: 44, fontWeight: FontWeight.bold)),
                const Text('puntos', style: TextStyle(color: Colors.white70, fontSize: 14)),
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

          // Partners
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text('Establecimientos Aliados', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
            ),
          ),

          partners.when(
            loading: () => const SliverToBoxAdapter(child: Center(child: CircularProgressIndicator())),
            error: (e, _) => SliverToBoxAdapter(child: Center(child: Text('Error: $e'))),
            data: (list) => SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverGrid(
                delegate: SliverChildBuilderDelegate(
                  (context, i) {
                    final partner = list[i] as Map<String, dynamic>;
                    return _PartnerCard(partner: partner);
                  },
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
