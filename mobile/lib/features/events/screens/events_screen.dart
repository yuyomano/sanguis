import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api_client.dart';
import '../../../core/theme.dart';

final upcomingEventsProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(apiClientProvider);
  final res = await dio.get('/events/upcoming');
  return res.data as List<dynamic>;
});

class EventsScreen extends ConsumerWidget {
  const EventsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final events = ref.watch(upcomingEventsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Eventos de Donación')),
      body: events.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (list) => list.isEmpty
            ? const Center(
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.event_busy, size: 60, color: Colors.grey),
                  SizedBox(height: 12),
                  Text('No hay eventos próximos', style: TextStyle(color: Colors.grey, fontSize: 16)),
                ]),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, i) {
                  final event = list[i] as Map<String, dynamic>;
                  return _EventCard(event: event);
                },
              ),
      ),
    );
  }
}

class _EventCard extends StatelessWidget {
  final Map<String, dynamic> event;
  const _EventCard({required this.event});

  @override
  Widget build(BuildContext context) {
    final isTruck = event['type'] == 'MOBILE_TRUCK';
    final capacity = event['capacity'] as int? ?? 0;
    final registered = event['registeredCount'] as int? ?? 0;
    final pct = capacity > 0 ? registered / capacity : 0.0;

    return Card(
      child: InkWell(
        onTap: () => context.go('/events/${event['id']}'),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isTruck ? Colors.blue.shade50 : kBloodRedLight,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isTruck ? Icons.local_shipping_outlined : Icons.location_on_outlined,
                  color: isTruck ? Colors.blue : kBloodRed,
                  size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(event['name'] as String, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                  Text(
                    isTruck ? 'Camión Móvil' : 'Sede Fija',
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                  ),
                ]),
              ),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              const Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
              const SizedBox(width: 4),
              Expanded(
                child: Text(event['locationAddress'] as String, style: const TextStyle(color: Colors.grey, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis),
              ),
            ]),
            const SizedBox(height: 4),
            Row(children: [
              const Icon(Icons.calendar_today_outlined, size: 14, color: Colors.grey),
              const SizedBox(width: 4),
              Text(_formatDate(event['startDatetime'] as String), style: const TextStyle(color: Colors.grey, fontSize: 13)),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(value: pct.clamp(0, 1), minHeight: 6, backgroundColor: Colors.grey.shade200, color: kBloodRed),
                ),
              ),
              const SizedBox(width: 10),
              Text('$registered/$capacity', style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ]),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => context.go('/events/${event['id']}'),
                style: ElevatedButton.styleFrom(minimumSize: const Size(0, 42)),
                child: const Text('Reservar Cita'),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  String _formatDate(String iso) {
    final d = DateTime.tryParse(iso);
    if (d == null) return iso;
    final months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return '${d.day} ${months[d.month - 1]}, ${d.year} ${d.hour.toString().padLeft(2,'0')}:${d.minute.toString().padLeft(2,'0')}';
  }
}
