import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #020617; /* Very dark slate to make logo pop */
  padding: 1rem;
  position: relative;
  overflow: hidden;
  animation: fadeIn 0.5s ease-out forwards;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Card = styled.div`
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  padding: 3rem;
  width: 100%;
  max-width: 420px;
  position: relative;
  border: 1px solid rgba(34, 197, 94, 0.2);
  z-index: 10;
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  .icon-wrapper {
    width: 140px;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }
  
  h1 {
    font-size: 1.5rem;
    font-weight: 800;
    color: #4ade80; /* Bright Green */
    margin-bottom: 0.5rem;
    letter-spacing: -0.025em;
  }
  
  p {
    color: #94a3b8;
    font-size: 0.95rem;
    line-height: 1.5;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
  color: #cbd5e1;
  font-size: 0.875rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.875rem 1rem;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  font-size: 1rem;
  transition: all 0.2s;
  background: rgba(30, 41, 59, 0.5);
  color: #f8fafc;

  &:focus {
    outline: none;
    border-color: #22c55e;
    background: rgba(30, 41, 59, 0.8);
    box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
  }
`;

const PasswordWrapper = styled.div`
  position: relative;
  
  input {
    padding-right: 2.5rem;
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: #f8fafc;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.875rem;
  background: #16a34a; /* Green-600 */
  color: white;
  border: none;
  border-radius: 0.75rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
  box-shadow: 0 4px 6px -1px rgba(22, 163, 74, 0.2);

  &:hover {
    background: #15803d; /* Green-700 */
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(22, 163, 74, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    background: #9ca3af;
    transform: none;
    box-shadow: none;
  }
`;


const Message = styled.div<{ $type: 'error' | 'success' }>`
  background: ${props => props.$type === 'error' ? 'rgba(127, 29, 29, 0.2)' : 'rgba(20, 83, 45, 0.2)'};
  border-left: 4px solid ${props => props.$type === 'error' ? '#ef4444' : '#22c55e'};
  color: ${props => props.$type === 'error' ? '#fca5a5' : '#86efac'};
  padding: 0.875rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  text-align: center;
  animation: messageReveal 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @keyframes messageReveal {
    from { opacity: 0; transform: translateY(-5px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`;

const BackLink = styled.div`
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  
  button {
    background: none;
    border: none;
    color: #4ade80;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    font-size: inherit;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const UpdatePassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Optional: Check if the user is actually in a recovery session.
    // If they navigate here directly without a token, supabase might block the update anyway.
    const hash = window.location.hash;
    if (!hash && !window.location.search.includes('error_description')) {
      console.warn("No hash found, user might not be arriving from a recovery link.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setStatus('error');
      setMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Las contraseñas no coinciden.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Password update error:', error);
        setStatus('error');
        setMessage(error.message || 'Error al actualizar la contraseña. Es posible que el enlace haya expirado.');
      } else {
        setStatus('success');
        setMessage('Tu contraseña ha sido actualizada con éxito.');
        setTimeout(() => navigate('/login'), 3000); // Auto redirect
      }
    } catch (err: any) {
      console.error('Unexpected error updating password:', err);
      setStatus('error');
      setMessage('Error de red. Intenta más tarde.');
    }
  };

  return (
    <Container>
      <ParticleBackground />
      <Card>
        <Logo>
          <div className="icon-wrapper">
            <img src="/logotrazappfix.png" alt="TrazApp Logo" style={{ filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.3))' }} />
          </div>
          <h1>Crear Nueva Contraseña</h1>
          <p>Ingresa y confirma tu nueva contraseña de acceso seguro.</p>
        </Logo>

        {status === 'error' && <Message $type="error">{message}</Message>}
        {status === 'success' && <Message $type="success">{message}</Message>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="password">Nueva Contraseña</Label>
            <PasswordWrapper>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={status === 'loading' || status === 'success'}
                required
              />
              <ToggleButton type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </ToggleButton>
            </PasswordWrapper>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <PasswordWrapper>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={status === 'loading' || status === 'success'}
                required
              />
            </PasswordWrapper>
          </FormGroup>

          <SubmitButton type="submit" disabled={status === 'loading' || status === 'success'}>
            {status === 'loading' ? 'Actualizando...' : 'Guardar y Acceder'}
          </SubmitButton>
        </Form>

        <BackLink>
          <button onClick={() => navigate('/login')}>
            ← Volver a Iniciar Sesión
          </button>
        </BackLink>
      </Card>
    </Container>
  );
};

export default UpdatePassword;
