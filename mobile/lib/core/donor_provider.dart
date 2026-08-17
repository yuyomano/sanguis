import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_client.dart';

final donorProfileProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final dio = ref.read(apiClientProvider);
  final res = await dio.get('/donors/me');
  return res.data as Map<String, dynamic>;
});
