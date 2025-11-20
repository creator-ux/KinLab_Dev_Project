import 'package:flutter/material.dart';
import 'package:kinlab/login.dart';

class HomeScreen extends StatelessWidget {
  final String userName;

  const HomeScreen({super.key, required this.userName});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xffd3d3d3),
      appBar: AppBar(
        //Laestructura del estilo para el titulo
        backgroundColor: const Color(0xff162660),
        title: const Text(
          "Instituto Tecnológico de Tizimín",
          style: TextStyle(
            fontSize: 18,
            color: Color(0xffd3d3d3),
            ),
        ),
        actions: [
                PopupMenuButton<String>(
            icon: const Icon(Icons.more_horiz_rounded, size: 30),
            onSelected: (value) {
              if (value == 'loans') {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const ProfileScreen()),
                );
              }  else if (value == 'logout') {
                // Volver al login y limpiar navegación
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (context) =>  LoginScreen()),
                  (route) => false,
                );
              }
            },
            itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
              const PopupMenuItem<String>(
                value: 'loans',
                child: Text('Tus prestamos'),
              ),
              const PopupMenuItem<String>(
                value: 'logout',
                child: Text('Cerrar sesión'),
              ),
            ],
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Mensaje de bienvenida
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Color.fromARGB(34, 124, 149, 200),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'Bienvenido "$userName" a tu catálogo de electrónica.',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(height: 20),

          ],
        ),
      ),
    );
  }

}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffd3d3d3),
      appBar: AppBar(
        leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white, size: 30),
            onPressed: () {
              Navigator.pop(context); //Vuelve a la pantalla anterior
            },
          ),

        title: const Text(
          'Prestamos',
          style: TextStyle(
            color: Colors.white,
          ),
          ),
        backgroundColor: Color(0xff162660),
      ),
      body: Center(
        child: Text('Tus prestamos'),
      ),
    );
  }
}
