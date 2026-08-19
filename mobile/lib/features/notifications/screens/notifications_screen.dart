import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/theme.dart';

final notificationsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.read(apiClientProvider);
  final res = await dio.get('/donors/me/notifications?limit=30');
  return List<Map<String, dynamic>>.from(res.data['notifications'] ?? []);
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  IconData _iconFor(String type) {
    switch (type) {
      case 'WHATSAPP': return Icons.chat_bubble_outline;
      case 'EMAIL': return Icons.email_outlined;
      case 'PUSH': return Icons.notifications_outlined;
      default: return Icons.notifications_outlined;
    }
  }

  Color _colorFor(String status) {
    switch (status) {
      case 'DELIVERED': return Colors.green;
      case 'SENT': return Colors.blue;
      case 'FAILED': return Colors.red;
      default: return Colors.grey;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'DELIVERED': return 'Entregada';
      case 'SENT': return 'Enviada';
      case 'FAILED': return 'Error';
      case 'PENDING': return 'Pendiente';
      default: return status;
    }
  }

  String _typeLabel(String type) {
    switch (type) {
      case 'WHATSAPP': return 'WhatsApp';
      case 'EMAIL': return 'Email';
      case 'PUSH': return 'Push';
      default: return type;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notificaciones'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(notificationsProvider),
          ),
        ],
      ),
      body: notificationsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, __) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.wifi_off, size: 48, color: Colors.grey),
              const SizedBox(height: 12),
              const Text('No se pudo cargar las notificaciones', style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => ref.invalidate(notificationsProvider),
                icon: const Icon(Icons.refresh),
                label: const Text('Reintentar'),
              ),
            ],
          ),
        ),
        data: (notifications) => notifications.isEmpty
            ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.notifications_none, size: 64, color: Colors.grey.shade300),
                    const SizedBox(height: 16),
                    Text(
                      'Sin notificaciones',
                      style: TextStyle(fontSize: 16, color: Colors.grey.shade500, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Aquí verás alertas y mensajes de Sanguis',
                      style: TextStyle(fontSize: 13, color: Colors.grey.shade400),
                    ),
                  ],
                ),
              )
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: notifications.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final n = notifications[index];
                  final type = n['type'] as String? ?? '';
                  final status = n['status'] as String? ?? '';
                  final body = n['body'] as String? ?? '';
                  final subject = n['subject'] as String?;
                  final createdAt = n['createdAt'] as String?;
                  final date = createdAt != null
                      ? DateTime.tryParse(createdAt)?.toLocal()
                      : null;

                  return Card(
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey.shade200),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: _colorFor(status).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Icon(_iconFor(type), size: 18, color: _colorFor(status)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: kBloodRedLight,
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(_typeLabel(type), style: const TextStyle(fontSize: 10, color: kBloodRed, fontWeight: FontWeight.w600)),
                                    ),
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: _colorFor(status).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Text(_statusLabel(status), style: TextStyle(fontSize: 10, color: _colorFor(status), fontWeight: FontWeight.w500)),
                                    ),
                                    const Spacer(),
                                    if (date != null)
                                      Text(
                                        '${date.day}/${date.month} ${date.hour}:${date.minute.toString().padLeft(2, '0')}',
                                        style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
                                      ),
                                  ],
                                ),
                                if (subject != null && subject.isNotEmpty) ...[
                                  const SizedBox(height: 6),
                                  Text(subject, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.black87)),
                                ],
                                const SizedBox(height: 4),
                                Text(
                                  body,
                                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600, height: 1.4),
                                  maxLines: 3,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
      ),
    );
  }
}
