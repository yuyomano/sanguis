import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api_client.dart';
import '../../../core/theme.dart';

final myBloodUnitsProvider = FutureProvider<List<dynamic>>((ref) async {
  final dio = ref.read(apiClientProvider);
  final res = await dio.get('/blood-units/mine');
  return res.data as List<dynamic>;
});

// Status journey — ordered steps for the happy path
const _journey = [
  ('COLLECTED',  'Donación recolectada',    Icons.water_drop,        'Tu sangre fue extraída exitosamente'),
  ('TESTING',    'En análisis',              Icons.science,           'Los resultados de viabilidad están siendo procesados'),
  ('QUARANTINE', 'En cuarentena',            Icons.lock_clock,        'Período de cuarentena de seguridad'),
  ('APPROVED',   'Aprobada',                 Icons.check_circle,      'Tu donación pasó todos los controles de calidad'),
  ('STORED',     'Almacenada',               Icons.inventory_2,       'Tu sangre está disponible en el banco'),
  ('ALLOCATED',  'En camino',                Icons.local_shipping,    'Tu donación está siendo transportada'),
  ('USED',       '¡Utilizada!',              Icons.volunteer_activism,'Tu sangre salvó una vida'),
];

const _statusOrder = {
  'COLLECTED': 0, 'TESTING': 1, 'QUARANTINE': 2,
  'APPROVED': 3, 'STORED': 4, 'ALLOCATED': 5, 'USED': 6,
  'REJECTED': 3, 'DISCARDED': 4,
};

const _productLabels = {
  'WHOLE_BLOOD': 'Sangre Entera',
  'PLATELETS': 'Plaquetas',
  'PLASMA': 'Plasma',
};

const _bloodLabels = {
  'A_POSITIVE': 'A+', 'A_NEGATIVE': 'A-', 'B_POSITIVE': 'B+', 'B_NEGATIVE': 'B-',
  'AB_POSITIVE': 'AB+', 'AB_NEGATIVE': 'AB-', 'O_POSITIVE': 'O+', 'O_NEGATIVE': 'O-',
};

class BloodTrackerScreen extends ConsumerStatefulWidget {
  const BloodTrackerScreen({super.key});

  @override
  ConsumerState<BloodTrackerScreen> createState() => _BloodTrackerScreenState();
}

class _BloodTrackerScreenState extends ConsumerState<BloodTrackerScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final unitsAsync = ref.watch(myBloodUnitsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Rastrear mi Sangre')),
      body: unitsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.grey),
            const SizedBox(height: 12),
            Text('Error al cargar: $e', textAlign: TextAlign.center, style: const TextStyle(color: Colors.grey)),
          ]),
        ),
        data: (units) {
          if (units.isEmpty) return _emptyState();
          final selected = units[_selectedIndex] as Map<String, dynamic>;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Unit selector (if multiple)
              if (units.length > 1) ...[
                _UnitSelector(
                  units: units,
                  selectedIndex: _selectedIndex,
                  onSelect: (i) => setState(() => _selectedIndex = i),
                ),
                const SizedBox(height: 16),
              ],

              // Current unit header card
              _UnitCard(unit: selected),
              const SizedBox(height: 24),

              // Journey timeline
              const Text('Trayectoria de tu donación', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
              const SizedBox(height: 16),
              _JourneyTimeline(unit: selected),
            ],
          );
        },
      ),
    );
  }

  Widget _emptyState() {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Icon(Icons.water_drop_outlined, size: 64, color: Colors.grey),
        const SizedBox(height: 12),
        const Text('Aún no has donado', style: TextStyle(color: Colors.grey, fontSize: 16, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        const Text('Cuando hagas tu primera donación podrás rastrear su impacto aquí.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey, fontSize: 13)),
      ]),
    );
  }
}

class _UnitSelector extends StatelessWidget {
  final List<dynamic> units;
  final int selectedIndex;
  final void Function(int) onSelect;

  const _UnitSelector({required this.units, required this.selectedIndex, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: units.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, i) {
          final unit = units[i] as Map<String, dynamic>;
          final isSelected = i == selectedIndex;
          final date = DateTime.tryParse(unit['collectionDate'] as String? ?? '');
          final label = date != null ? '${date.day}/${date.month}/${date.year}' : 'Donación ${i + 1}';

          return GestureDetector(
            onTap: () => onSelect(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isSelected ? kBloodRed : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(22),
              ),
              child: Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.grey.shade700,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  fontSize: 13,
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _UnitCard extends StatelessWidget {
  final Map<String, dynamic> unit;
  const _UnitCard({required this.unit});

  @override
  Widget build(BuildContext context) {
    final status = unit['status'] as String? ?? 'COLLECTED';
    final isRejected = status == 'REJECTED';
    final isDiscarded = status == 'DISCARDED';
    final isUsed = status == 'USED';
    final bloodLabel = _bloodLabels[unit['bloodType'] as String? ?? ''] ?? '?';
    final product = _productLabels[unit['productType'] as String? ?? ''] ?? '—';
    final location = (unit['storageLocation'] as Map?)??{};

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isRejected || isDiscarded
              ? [Colors.grey.shade400, Colors.grey.shade600]
              : isUsed
                  ? [Colors.green.shade400, Colors.green.shade700]
                  : [kBloodRed, kBloodRedDark],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(children: [
        CircleAvatar(
          radius: 28,
          backgroundColor: Colors.white24,
          child: Text(bloodLabel, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              unit['bagNumber'] as String? ?? '—',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16, letterSpacing: 0.5),
            ),
            const SizedBox(height: 2),
            Text(product, style: const TextStyle(color: Colors.white70, fontSize: 13)),
            if (location['name'] != null) ...[
              const SizedBox(height: 2),
              Text(location['name'] as String, style: const TextStyle(color: Colors.white54, fontSize: 11)),
            ],
          ]),
        ),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('${unit['volumeMl'] ?? '—'} mL', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          if (isUsed)
            const Icon(Icons.favorite, color: Colors.white, size: 20)
          else if (isRejected)
            const Icon(Icons.cancel, color: Colors.white70, size: 20)
          else
            const Icon(Icons.water_drop, color: Colors.white70, size: 20),
        ]),
      ]),
    );
  }
}

class _JourneyTimeline extends StatelessWidget {
  final Map<String, dynamic> unit;
  const _JourneyTimeline({required this.unit});

  @override
  Widget build(BuildContext context) {
    final status = unit['status'] as String? ?? 'COLLECTED';
    final currentStep = _statusOrder[status] ?? 0;
    final isRejected = status == 'REJECTED';
    final isDiscarded = status == 'DISCARDED';

    // Build visible steps — skip QUARANTINE if not in it and status is past TESTING
    final steps = _journey.where((s) {
      final (key, _, __, ___) = s;
      if (key == 'QUARANTINE' && currentStep > 2 && status != 'QUARANTINE') return false;
      return true;
    }).toList();

    return Column(
      children: [
        ...steps.asMap().entries.map((entry) {
          final i = entry.key;
          final (key, label, icon, subtitle) = entry.value;
          final stepOrder = _statusOrder[key] ?? 0;
          final isDone = currentStep > stepOrder;
          final isActive = currentStep == stepOrder && !isRejected && !isDiscarded;
          final isPending = !isDone && !isActive;
          final isLast = i == steps.length - 1;

          Color dotColor;
          Color dotBg;
          if (isDone) { dotColor = Colors.green.shade700; dotBg = Colors.green.shade50; }
          else if (isActive) { dotColor = kBloodRed; dotBg = kBloodRedLight; }
          else { dotColor = Colors.grey.shade400; dotBg = Colors.grey.shade100; }

          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(color: dotBg, shape: BoxShape.circle),
                  child: Icon(
                    isDone ? Icons.check_circle : icon,
                    color: dotColor,
                    size: 20,
                  ),
                ),
                if (!isLast)
                  Container(
                    width: 2, height: 44,
                    color: isDone ? Colors.green.shade200 : Colors.grey.shade200,
                  ),
              ]),
              const SizedBox(width: 14),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 8, bottom: 24),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(
                      label,
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: isPending ? Colors.grey.shade400 : const Color(0xFF1A1A1A),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _subtitleFor(key, unit, subtitle),
                      style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                    ),
                  ]),
                ),
              ),
              if (isActive)
                Padding(
                  padding: const EdgeInsets.only(top: 10),
                  child: Container(
                    width: 8, height: 8,
                    decoration: const BoxDecoration(color: kBloodRed, shape: BoxShape.circle),
                  ),
                ),
            ],
          );
        }),

        if (isRejected) _RejectedBanner(),
        if (isDiscarded) _DiscardedBanner(),
      ],
    );
  }

  String _subtitleFor(String key, Map<String, dynamic> unit, String defaultText) {
    if (key == 'STORED') {
      final loc = (unit['storageLocation'] as Map?)?['name'];
      if (loc != null) return 'Ubicación: $loc';
    }
    if (key == 'USED' && unit['usedForNote'] != null) {
      return unit['usedForNote'] as String;
    }
    if (key == 'ALLOCATED') {
      final items = unit['deliveryItems'] as List?;
      if (items != null && items.isNotEmpty) {
        final order = (items.first as Map)['deliveryOrder'] as Map?;
        if (order?['destinationName'] != null) {
          return 'Destino: ${order!['destinationName']}';
        }
      }
    }
    return defaultText;
  }
}

class _RejectedBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(children: [
        Icon(Icons.info_outline, color: Colors.red.shade700, size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            'Esta unidad fue rechazada en el proceso de análisis. Gracias igualmente por tu voluntad de donar.',
            style: TextStyle(color: Colors.red.shade700, fontSize: 13),
          ),
        ),
      ]),
    );
  }
}

class _DiscardedBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Row(children: [
        Icon(Icons.warning_amber_outlined, color: Colors.grey.shade600, size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            'Esta unidad fue descartada por vencimiento. Tu próxima donación será igualmente valiosa.',
            style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
          ),
        ),
      ]),
    );
  }
}
