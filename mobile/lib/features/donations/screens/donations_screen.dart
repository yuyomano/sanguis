import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../../core/theme.dart';

final donationsProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(apiClientProvider);
  final res = await dio.get('/blood-units', queryParameters: {'limit': 50});
  return (res.data['units'] as List<dynamic>?) ?? [];
});

const _statusLabels = {
  'COLLECTED': 'Recolectada',
  'TESTING': 'En análisis',
  'QUARANTINE': 'En cuarentena',
  'APPROVED': 'Aprobada',
  'REJECTED': 'Rechazada',
  'STORED': 'Almacenada',
  'ALLOCATED': 'Asignada',
  'USED': 'Utilizada',
  'DISCARDED': 'Descartada',
};

const _statusColors = {
  'COLLECTED': Colors.blue,
  'TESTING': Colors.orange,
  'QUARANTINE': Colors.yellow,
  'APPROVED': Colors.green,
  'REJECTED': Colors.red,
  'STORED': Colors.teal,
  'ALLOCATED': Colors.purple,
  'USED': Colors.grey,
  'DISCARDED': Colors.grey,
};

class DonationsScreen extends ConsumerWidget {
  const DonationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final donations = ref.watch(donationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Donaciones'),
        actions: [
          IconButton(icon: const Icon(Icons.map_outlined), onPressed: () => context.go('/tracker')),
        ],
      ),
      body: donations.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (list) => list.isEmpty
            ? Center(
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.water_drop_outlined, size: 64, color: Colors.grey),
                  const SizedBox(height: 12),
                  const Text('Aún no has donado', style: TextStyle(color: Colors.grey, fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  const Text('Tu primera donación puede salvar hasta 3 vidas', style: TextStyle(color: Colors.grey, fontSize: 13), textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  TextButton.icon(
                    onPressed: () => context.go('/events'),
                    icon: const Icon(Icons.event, color: kBloodRed),
                    label: const Text('Ver eventos', style: TextStyle(color: kBloodRed)),
                  ),
                ]),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, i) {
                  final unit = list[i] as Map<String, dynamic>;
                  final status = unit['status'] as String? ?? 'COLLECTED';
                  final color = _statusColors[status] ?? Colors.grey;
                  final productType = (unit['productType'] as String? ?? '').replaceAll('_', ' ');
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(children: [
                        Container(
                          width: 48, height: 48,
                          decoration: BoxDecoration(
                            color: (color as Color).withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(Icons.water_drop, color: color, size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(
                              unit['bagNumber'] as String? ?? '—',
                              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                            ),
                            Text(productType, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                          ]),
                        ),
                        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: (color as Color).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              _statusLabels[status] ?? status,
                              style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 11),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _formatDate(unit['collectionDate'] as String? ?? ''),
                            style: const TextStyle(color: Colors.grey, fontSize: 11),
                          ),
                        ]),
                      ]),
                    ),
                  );
                },
              ),
      ),
    );
  }

  String _formatDate(String iso) {
    final d = DateTime.tryParse(iso);
    if (d == null) return '—';
    return '${d.day.toString().padLeft(2,'0')}/${d.month.toString().padLeft(2,'0')}/${d.year}';
  }
}
