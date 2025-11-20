import 'package:flutter/material.dart';
import 'package:kinlab/home.dart';

void main() => runApp(LoginApp());

class LoginApp extends StatelessWidget {
  const LoginApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Laboratorios TECNM Tizimín',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        fontFamily: 'Arial',
      ),
      home: LoginScreen(),
    );
  }
}

class LoginScreen extends StatelessWidget {
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.of(context).size.height;

    return Scaffold(
      resizeToAvoidBottomInset: false, // Evita que el teclado del cel empuje los demás elementoss
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color (0xff162660), //Poner "0xff" antes de pegar el color que se desea
              Color(0xffd3d3d3),
            ],
            stops: [0.2, 0.5],
          ),
        ),

        child:SafeArea(
        top: true,
        bottom: false,
        left: false,
        right: false,
        child: Center(
          child: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: 34),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Logo TECNM
                Image.asset(
                  'assets/Logo.png',
                  height: screenHeight * 0.30,
                ),
                SizedBox(height: 2),
                Text(
                  'KIM LAB\nTECNM TIZIMÍN',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: const Color.fromARGB(221, 65, 59, 59),
                  ),
                ),
                SizedBox(height: screenHeight * 0.03),

                // Campo correo
                _textFieldEmail(),
                SizedBox(height: screenHeight * 0.02),
                // Campo contraseña
                _textFieldPassword(),
                SizedBox(height: screenHeight * 0.03),
                
                // Botón ingresar
                SizedBox(
                  width: 140,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pushReplacement(
                        context,
                        MaterialPageRoute(builder: (context) => const HomeScreen(userName: "User")
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      padding: EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                    ),
                    child: Text(
                      'Ingresar',
                      style: TextStyle(fontSize: 18, 
                      fontWeight: FontWeight.bold, 
                      color: Colors.black87),
                      ),
                    ),
                  ),
                
                SizedBox(height: screenHeight * 0.015),

                // Olvidaste contraseña
                TextButton(
                  onPressed: () {},
                  child: Text(
                    '¿Olvidaste tu contraseña?',
                    style: TextStyle(color: Colors.black87),
                  ),
                ),
                SizedBox(height: screenHeight * 0.01),

                // "Orgullo Venado"
                Image.asset(
                  'assets/Orgullo_venado.png',
                  height: screenHeight * 0.17,
                  
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
  

  //Estos widget son los métodos que le dan estilo y forma al formulario de 
  //usuario y contraseña
  Widget _textFieldEmail() {
    return Container(
      margin: EdgeInsets.symmetric(
        horizontal: 1.0,
      ),
      child: TextField( 
        controller: emailController,
        decoration:InputDecoration(
          prefixIcon: Icon(Icons.person_outline), //Es el icono de los fomularios
          labelText: "Correo electrónico",
          hintText: "Example@ittizimin.edu.mx",
          filled: true, //rellena el formulario de color blanco
          border:OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        )
      ),
    );
  }
  
  Widget _textFieldPassword() {
    return Container(
      margin: EdgeInsets.symmetric(
        horizontal: 1.0,
      ),
      child: TextField( 
        controller: passwordController,
        obscureText: true, //Oculta tu contraseña
        decoration:InputDecoration(
          prefixIcon: Icon(Icons.lock_outline),
          labelText: "Contraseña",
          hintText: "Ingresa tu contraseña",
          filled: true,
          border:OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        )
      ),
    );
  }
}
