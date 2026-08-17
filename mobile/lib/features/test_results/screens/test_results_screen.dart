import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/donor_provider.dart';
import '../../../core/theme.dart';

final testHistoryProvider = FutureProvider<List<dynamic>>((ref) async {
  final profile = await ref.watch(donorProfileProvider.future);
  final donorId = profile['id'] as String;
  final dio = ref.read(apiClientProvider);
  final res = await dio.get('/testing/donors/$donorId/history');
  return res.data as List<dynamic>;
});

class TestResultsScreen extends ConsumerWidget {
  const TestResultsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tests = ref.watch(testHistoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Resultados de Salud')),
      body: tests.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error al cargar: $e')),
        data: (list) => list.isEmpty
            ? const Center(
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.science_outlined, size: 60, color: Colors.grey),
                  SizedBox(height: 12),
                  Text('Sin resultados aún', style: TextStyle(color: Colors.grey, fontSize: 16)),
                  SizedBox(height: 8),
                  Text('Cuando dones, compartiremos\ntus resultados de salud aquí', style: TextStyle(color: Colors.grey, fontSize: 13), textAlign: TextAlign.center),
                ]),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, i) {
                  final test = list[i] as Map<String, dynamic>;
                  final viable = test['isViable'] as bool?;
                  return Card(
                    child: ExpansionTile(
                      leading: CircleAvatar(
                        backgroundColor: viable == true ? Colors.green.shade50 : viable == false ? Colors.red.shade50 : Colors.orange.shade50,
                        child: Icon(
                          viable == true ? Icons.check_circle_outline : viable == false ? Icons.cancel_outlined : Icons.hourglass_empty,
                          color: viable == true ? Colors.green : viable == false ? Colors.red : Colors.orange,
                          size: 22,
                        ),
                      ),
                      title: Text(
                        'Donación: ${_formatDate(test['testDate'] as String? ?? '')}',
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                      ),
                      subtitle: Text(
                        viable == true ? 'Sangre viable ✓' : viable == false ? 'No apta' : 'Pendiente',
                        style: TextStyle(
                          color: viable == true ? Colors.green : viable == false ? Colors.red : Colors.orange,
                          fontSize: 12,
                        ),
                      ),
                      children: [
                        if (test['results'] != null) ...[
                          const Divider(height: 1),
                          Padding(
                            padding: const EdgeInsets.all(16),
                            child: _buildResults(test['results'] as Map<String, dynamic>),
                          ),
                        ],
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }

  Widget _buildResults(Map<String, dynamic> results) {
    return Column(
      children: results.entries.map((e) {
        final isNegative = e.value.toString().toLowerCase() == 'negative' || e.value == false;
        final isNumeric = e.value is num;
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(children: [
            Expanded(child: Text(e.key, style: const TextStyle(color: Colors.grey, fontSize: 13))),
            Text(
              e.value.toString(),
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 13,
                color: isNumeric ? const Color(0xFF1A1A1A) : isNegative ? Colors.green : Colors.red,
              ),
            ),
            if (!isNumeric) ...[
              const SizedBox(width: 6),
              Icon(isNegative ? Icons.check_circle : Icons.cancel, size: 14, color: isNegative ? Colors.green : Colors.red),
            ],
          ]),
        );
      }).toList(),
    );
  }

  String _formatDate(String iso) {
    final d = DateTime.tryParse(iso);
    if (d == null) return '—';
    return '${d.day.toString().padLeft(2,'0')}/${d.month.toString().padLeft(2,'0')}/${d.year}';
  }
}
