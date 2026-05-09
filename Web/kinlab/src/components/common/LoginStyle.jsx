import LoginStyle from 'styled-components'
// 3. Se modifican los styled-components para usar los colores originales
export const StyledLoginWrapper = LoginStyle.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(to bottom, #162660, #f1e4d1);

  .logo {
    width: 110px;
    margin: 0 auto 1.5rem auto;
    display: block;
  }

  .form-container {
    width: 350px;
    border-radius: 0.75rem;
    background-color: #d5cbc2;
    padding: 2rem;
    color: #1f2937; 
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    transition: background-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
  }

  .form-container:hover {
    background-color: #e0d6cd; /* Un tono ligeramente más claro */
    transform: scale(1.02);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.65);
  }

  .title {
    text-align: center;
    font-size: 1.5rem;
    line-height: 2rem;
    font-weight: 700;
  }

  .form {
    margin-top: 1.5rem;
  }

  .input-group {
    margin-top: 0.25rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
  }

  .input-group label {
    display: block;
    color: #4b5563;
    margin-bottom: 4px;
    font-weight: 600;
  }

  .input-group input {
    width: 100%;
    border-radius: 0.375rem;
    border: 1px solid #d1d5db;
    outline: 0;
    background-color: #ffffff;
    /* espacio extra a la derecha para el botón de mostrar/ocultar */
    padding: 0.75rem 2.25rem 0.75rem 1rem;
    color: #1f2937;
    transition: border-color 0.2s;
  }

  .input-group input:focus {
    border-color: #8b5cf6; /* Color morado del diseño original */
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.3);
  }

  /* Estado de error para inputs */
  .input-group input.error {
    border-color: #ef4444; /* rojo-500 */
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.25);
  }

  /* Oculta el botón nativo de Edge para revelar contraseña
     para evitar doble icono (nuestro botón y el del navegador) */
  .input-group input[type="password"]::-ms-reveal,
  .input-group input[type="password"]::-ms-clear {
    display: none;
  }

  .error-text {
    color: #b91c1c; /* rojo-700 */
    font-size: 0.75rem;
    margin-top: 4px;
  }

  .forgot {
    display: flex;
    justify-content: flex-end;
    font-size: 0.75rem;
    line-height: 1rem;
    color: #4b5563;
    margin: 8px 0 14px 0;
  }

  .forgot a, .signup a {
    color: #1f2937;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    transition: color 0.2s;
  }

  .forgot a:hover, .signup a:hover {
    color: #8b5cf6;
  }

  .sign {
    display: block;
    width: 100%;
    /* Color del botón original */
    background-color: #8b5cf6; 
    padding: 0.75rem;
    text-align: center;
    color: #ffffff;
    border: none;
    border-radius: 0.375rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .sign:hover {
    background-color: #7c3aed;
  }

  .social-message {
    display: flex;
    align-items: center;
    padding-top: 1rem;
  }

  .line {
    height: 1px;
    flex: 1 1 0%;
    background-color: #9ca3af;
  }

  .social-message .message {
    padding-left: 0.75rem;
    padding-right: 0.75rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: #4b5563;
  }

  .social-icons {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .social-icons .icon {
    border-radius: 9999px;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    background-color: transparent;
    transition: background-color 0.2s;
    cursor: pointer;
  }
  
  .social-icons .icon:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .social-icons .icon svg {
    height: 1.25rem;
    width: 1.25rem;
    fill: #374151;
  }

  .signup {
    text-align: center;
    font-size: 0.75rem;
    line-height: 1rem;
    color: #4b5563;
    margin-top: 1.5rem;
  }
`;