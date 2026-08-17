import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/theme.dart';

class BloodTrackerScreen extends ConsumerWidget {
  const BloodTrackerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Rastrear mi Sangre')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: kBloodRedLight,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(children: [
              const Icon(Icons.favorite, color: kBloodRed, size: 32),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Tu sangre importa', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: kBloodRedDark)),
                  SizedBox(height: 4),
                  Text('Aquí puedes ver el estado de cada unidad que has donado y el impacto que has tenido.', style: TextStyle(color: kBloodRedDark, fontSize: 13)),
                ]),
              ),
            ]),
          ),
          const SizedBox(height: 24),
          const Text('Estado de tus donaciones', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
          const SizedBox(height: 12),
          // Placeholder timeline
          _TimelineStep(
            icon: Icons.water_drop,
            title: 'Donación Recolectada',
            subtitle: 'Tu sangre fue extraída exitosamente',
            status: 'done',
          ),
          _TimelineStep(
            icon: Icons.science,
            title: 'En Análisis',
            subtitle: 'Los resultados de viabilidad están siendo procesados',
            status: 'done',
          ),
          _TimelineStep(
            icon: Icons.check_circle,
            title: 'Sangre Aprobada',
            subtitle: 'Tu donación pasó todos los controles de calidad',
            status: 'done',
          ),
          _TimelineStep(
            icon: Icons.inventory_2,
            title: 'Almacenada',
            subtitle: 'Tu sangre está disponible en el banco',
            status: 'active',
          ),
          _TimelineStep(
            icon: Icons.local_shipping,
            title: 'En Camino',
            subtitle: 'Tu donación está siendo transportada',
            status: 'pending',
          ),
          _TimelineStep(
            icon: Icons.volunteer_activism,
            title: 'Utilizada',
            subtitle: '¡Tu sangre salvó una vida!',
            status: 'pending',
            isLast: true,
          ),
        ],
      ),
    );
  }
}

class _TimelineStep extends StatelessWidget {
  final IconData icon;
  final String title, subtitle, status;
  final bool isLast;

  const _TimelineStep({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.status,
    this.isLast = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDone = status == 'done';
    final isActive = status == 'active';
    final color = isDone ? Colors.green : isActive ? kBloodRed : Colors.grey.shade300;
    final textColor = isDone || isActive ? const Color(0xFF1A1A1A) : Colors.grey;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: isDone ? Colors.green.shade50 : isActive ? kBloodRedLight : Colors.grey.shade100,
            child: Icon(icon, color: color, size: 20),
          ),
          if (!isLast)
            Container(width: 2, height: 40, color: isDone ? Colors.green.shade200 : Colors.grey.shade200),
        ]),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 4, bottom: 20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title, style: TextStyle(fontWeight: FontWeight.w600, color: textColor)),
              const SizedBox(height: 2),
              Text(subtitle, style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
            ]),
          ),
        ),
        if (isDone) const Icon(Icons.check_circle, color: Colors.green, size: 18),
        if (isActive) const Icon(Icons.radio_button_checked, color: kBloodRed, size: 18),
      ],
    );
  }
}
