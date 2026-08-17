import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../../core/api_client.dart';
import '../../../core/donor_provider.dart';
import '../../../core/theme.dart';

class EventDetailScreen extends ConsumerStatefulWidget {
  final String eventId;
  const EventDetailScreen({super.key, required this.eventId});

  @override
  ConsumerState<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends ConsumerState<EventDetailScreen> {
  Map<String, dynamic>? _appointment;
  bool _booking = false;

  Future<void> _book(String donorId) async {
    setState(() => _booking = true);
    try {
      final dio = ref.read(apiClientProvider);
      final res = await dio.post('/events/appointments', data: {
        'donorId': donorId,
        'eventId': widget.eventId,
        'scheduledTime': DateTime.now().add(const Duration(hours: 1)).toIso8601String(),
      });
      setState(() => _appointment = res.data as Map<String, dynamic>);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al reservar: $e'), backgroundColor: kBloodRed),
        );
      }
    } finally {
      if (mounted) setState(() => _booking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(donorProfileProvider);
    final donorId = profileAsync.value?['id'] as String?;

    return Scaffold(
      appBar: AppBar(title: const Text('Detalle del Evento')),
      body: _appointment != null
          ? _buildQRView()
          : Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.event, size: 64, color: kBloodRed),
                  const SizedBox(height: 16),
                  const Text('¿Confirmas tu cita?', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: (_booking || donorId == null) ? null : () => _book(donorId),
                    child: _booking
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('Confirmar y obtener QR'),
                  ),
                ]),
              ),
            ),
    );
  }

  Widget _buildQRView() {
    final qrCode = _appointment?['qrCode'] as String? ?? '';
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.check_circle, color: Colors.green, size: 48),
          const SizedBox(height: 12),
          const Text('¡Cita confirmada!', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Muestra este QR al llegar al evento', style: TextStyle(color: Colors.grey, fontSize: 14)),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: const Color(0xFFE2E8F0))),
            child: QrImageView(data: qrCode, version: QrVersions.auto, size: 220),
          ),
          const SizedBox(height: 24),
          Text('Código: $qrCode', style: const TextStyle(fontFamily: 'monospace', color: Colors.grey, fontSize: 12)),
        ]),
      ),
    );
  }
}
