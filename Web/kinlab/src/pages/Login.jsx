import React, { useState } from 'react';
import { StyledLoginWrapper } from '../components/common/LoginStyle.jsx'
import { useAuth } from '../hooks/useAuth.js';
import { api } from '../apiClient.js';

function Login() {
  // 1. La lógica funcional se mantiene intacta
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    try {
      const data = await api.post('/api/login', {
        correo: email,
        contrasena: password,
      });

      // data: { message, token, user }
      if (!data || !data.token || !data.user) {
        globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Respuesta de login inválida' }}));
        return;
      }

      // Guarda usuario y token mediante el contexto
      login({ user: data.user, token: data.token });
      // Omitir banner de éxito de login según solicitud del usuario

    } catch (error) {
      const msg = String(error?.message || '').toLowerCase();
      // Diferenciar causas: correo vs contraseña
      if (msg.includes('correo incorrecto')) {
        setEmailError('Correo incorrecto');
        globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Correo incorrecto. Verifica que esté bien escrito.' }}));
      } else if (msg.includes('contraseña incorrecta')) {
        setPasswordError('Contraseña incorrecta');
        globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Contraseña incorrecta. Intenta de nuevo.' }}));
      } else {
        console.error('Error de conexión/login:', error);
        globalThis.dispatchEvent(new CustomEvent('notify', { detail: { type: 'error', message: 'Ocurrió un error al conectar con el servidor' }}));
      }
    }
  };

  // 2. Se ajusta el JSX para incluir el logo
  return (
    <StyledLoginWrapper>
      <div className="form-container">
        {/* Logo del diseño original */}
        <img
          src="../Img/Logo1.png" 
          alt="Logo"
          className="logo"
        />
        <p className="title">Iniciar Sesión</p>
        <form className="form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="Example@ittizimin.edu.mx"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
              required
              className={emailError ? 'error' : ''}
            />
            {emailError && <p className="error-text">{emailError}</p>}
          </div>
          <div className="input-group">
            <label htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              id="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
              required
              className={passwordError ? 'error' : ''}
            />
            <button
              type="button"
              aria-pressed={showPassword}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              onClick={() => setShowPassword(prev => !prev)}
              className=""
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" shapeRendering="geometricPrecision">
                  <path d="M2 2l20 20" vectorEffect="non-scaling-stroke"/>
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.81 21.81 0 0 1 5.06-6.06" vectorEffect="non-scaling-stroke"/>
                  <path d="M9.88 5.52A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.81 21.81 0 0 1-4.57 5.76" vectorEffect="non-scaling-stroke"/>
                  <path d="M12 15a3 3 0 1 0 0-6" vectorEffect="non-scaling-stroke"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" shapeRendering="geometricPrecision">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8" vectorEffect="non-scaling-stroke"/>
                  <circle cx="12" cy="12" r="3" vectorEffect="non-scaling-stroke"/>
                </svg>
              )}
            </button>
            </div>
            {passwordError && <p className="error-text">{passwordError}</p>}
            <div className="forgot">
              <a rel="noopener noreferrer" href="#">¿Olvidaste tu contraseña?</a>
            </div>
          </div>
          <button type="submit" className="sign">Ingresar</button>
        </form>
        {/* Se mantiene la sección social, pero puedes comentarla si no la necesitas */}
        <div className="social-message">
          <div className="line" />
          <p className="message">O inicia sesión con</p>
          <div className="line" />
        </div>
        <div className="social-icons">
          <button aria-label="Log in with Google" className="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-5 h-5 fill-current">
              <path d="M16.318 13.714v5.484h9.078c-0.37 2.354-2.745 6.901-9.078 6.901-5.458 0-9.917-4.521-9.917-10.099s4.458-10.099 9.917-10.099c3.109 0 5.193 1.318 6.38 2.464l4.339-4.182c-2.786-2.599-6.396-4.182-10.719-4.182-8.844 0-16 7.151-16 16s7.156 16 16 16c9.234 0 15.365-6.49 15.365-15.635 0-1.052-0.115-1.854-0.255-2.651z" />
            </svg>
          </button>
        </div>
        <p className="signup">¿No tienes una cuenta?
          <a rel="noopener noreferrer" href="#"> Regístrate</a>
        </p>
      </div>
    </StyledLoginWrapper>
  );
}

export default Login;