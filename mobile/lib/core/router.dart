import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/register_screen.dart';
import '../features/home/screens/home_screen.dart';
import '../features/donations/screens/donations_screen.dart';
import '../features/events/screens/events_screen.dart';
import '../features/events/screens/event_detail_screen.dart';
import '../features/rewards/screens/rewards_screen.dart';
import '../features/profile/screens/profile_screen.dart';
import '../features/test_results/screens/test_results_screen.dart';
import '../features/blood_tracker/screens/blood_tracker_screen.dart';
import '../shared/widgets/main_scaffold.dart';
import 'auth_notifier.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authNotifier = ref.watch(authStateProvider.notifier);
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isLoggedIn = ref.read(authStateProvider);
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';
      if (!isLoggedIn && !isAuthRoute) return '/login';
      if (isLoggedIn && isAuthRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      ShellRoute(
        builder: (context, state, child) => MainScaffold(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/donations', builder: (_, __) => const DonationsScreen()),
          GoRoute(path: '/events', builder: (_, __) => const EventsScreen()),
          GoRoute(
            path: '/events/:id',
            builder: (_, state) => EventDetailScreen(eventId: state.pathParameters['id']!),
          ),
          GoRoute(path: '/rewards', builder: (_, __) => const RewardsScreen()),
          GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          GoRoute(path: '/test-results', builder: (_, __) => const TestResultsScreen()),
          GoRoute(path: '/tracker', builder: (_, __) => const BloodTrackerScreen()),
        ],
      ),
    ],
  );
});
