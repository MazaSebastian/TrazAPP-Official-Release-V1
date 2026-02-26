import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Antigravity from '../components/Antigravity';
import Aurora from '../components/Aurora';
import BlurText from '../components/BlurText';
import StarBorder from '../components/StarBorder';

// ... (skipping styled components that don't need change, wait, replace_file_content replaces chunks)
// I should only replace the necessary parts. 
// Part 1: Imports



const LoginContainer = styled.div`
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #020617; /* Very dark slate to make logo pop */
  padding: 1rem;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
  animation: fadeIn 0.5s ease-out forwards;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;



const LoginCardWrapper = styled.div`
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 10;
  
  .star-border-container {
    width: 100%;
    display: block;
    border-radius: 1.5rem !important;
    
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(24px);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-top: 1px solid rgba(255, 255, 255, 0.15);
  }
  
  .inner-content {
    background: transparent !important;
    backdrop-filter: none !important;
    border: none !important;
    box-shadow: none !important;
    padding: 3rem !important;
    text-align: left !important;

    @media (max-width: 640px) {
      padding: 1.75rem 1rem !important;
    }
  }
`;

const Logo = styled.div`
  text-align: center;
  margin-bottom: 2rem;
  
  .icon-wrapper {
    width: 180px;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    @media (max-width: 640px) {
      width: 130px;
      height: 130px;
      margin: 0 auto 1rem;
    }
  }
  
  h1 {
    font-size: 1.875rem;
    font-weight: 800;
    color: #4ade80; /* Bright Green */
    margin-bottom: 0.5rem;
    letter-spacing: -0.025em;

    @media (max-width: 640px) {
      font-size: 1.5rem;
    }
  }
  
  p.welcome-subtitle {
    color: #94a3b8;
    font-size: 0.95rem;

    @media (max-width: 640px) {
      font-size: 0.85rem;
    }
  }
  
  .blur-text-container p {
    justify-content: center;
    font-size: 1.875rem;
    font-weight: 800;
    color: #4ade80;
    margin-bottom: 0.5rem;
    letter-spacing: -0.025em;

    @media (max-width: 640px) {
      font-size: 1.5rem;
    }
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

const LoginButton = styled.button`
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


const ErrorMessage = styled.div`
  background: rgba(127, 29, 29, 0.2);
  border-left: 4px solid #ef4444;
  color: #fca5a5;
  padding: 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  animation: messageReveal 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;

  @keyframes messageReveal {
    from { opacity: 0; transform: translateY(-5px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
`;

const FooterLink = styled.div`
  margin-top: 1.5rem;
  text-align: center;
  font-size: 0.875rem;
  color: #94a3b8;
  
  a {
    color: #4ade80;
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login({ email, password });

      if (result.success) {
        navigate('/', { replace: true });
      } else {
        setError(result.error || 'Credenciales inválidas. Intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error en login:', err);
      setError('Error de conexión. Intenta más tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.6 }}>
          <Aurora colorStops={["#199301", "#7cff67", "#037233"]} amplitude={1} blend={1} />
        </div>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.6 }}>
          <Antigravity
            count={1000}
            magnetRadius={10}
            ringRadius={15}
            waveSpeed={0.5}
            waveAmplitude={2.6}
            particleSize={0.5}
            lerpSpeed={0.17}
            color="#00ff59"
            autoAnimate={false}
            particleVariance={0.8}
            rotationSpeed={0.1}
            depthFactor={0.9}
            pulseSpeed={2.5}
            particleShape="capsule"
            fieldStrength={15}
          />
        </div>
      </div>

      <LoginCardWrapper>
        <StarBorder as="div" color="#4ade80" speed="7s" thickness={3}>
          <Logo>
            <div className="icon-wrapper">
              <img src="/logotrazappfix.png" alt="TrazApp Logo" style={{ filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.4))' }} />
            </div>
            <div className="blur-text-container">
              <BlurText text="Acceso TrazApp" delay={50} animateBy="words" direction="bottom" />
            </div>
            <p className="welcome-subtitle">Ingresa tus credenciales para continuar</p>
          </Logo>


          <Form onSubmit={handleSubmit}>
            {error && <ErrorMessage>{error}</ErrorMessage>}

            <FormGroup>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                required
              />
            </FormGroup>

            <FormGroup>
              <Label htmlFor="password">Contraseña</Label>
              <PasswordWrapper>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <ToggleButton type="button" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </ToggleButton>
              </PasswordWrapper>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  style={{ background: 'none', border: 'none', color: '#4ade80', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </FormGroup>

            <LoginButton type="submit" disabled={isLoading}>
              {isLoading ? 'Accediendo...' : 'Iniciar Sesión'}
            </LoginButton>
          </Form>

        </StarBorder>
      </LoginCardWrapper>
    </LoginContainer>
  );
};

export default Login;
