import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  QrCode,
  HeartHandshake,
  Menu,
  Sparkles,
  Scissors
} from 'lucide-react';
import { useSidebar } from '../Sidebar/SidebarContext';
import { useOrganization } from '../../context/OrganizationContext';
import { useAuth } from '../../context/AuthContext';

// ─── Keyframe Animations ──────────────────────────────────────────────────────
const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 16px rgba(16, 185, 129, 0.4), 0 4px 12px rgba(0, 0, 0, 0.4);
    transform: translateY(-8px) scale(1);
  }
  50% {
    box-shadow: 0 0 24px rgba(16, 185, 129, 0.65), 0 6px 18px rgba(0, 0, 0, 0.5);
    transform: translateY(-9px) scale(1.03);
  }
`;

// ─── Styled Components ───────────────────────────────────────────────────────
const BarContainer = styled.nav`
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 920;
  background: #030712;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 -10px 35px -5px rgba(0, 0, 0, 0.6);
  padding-bottom: env(safe-area-inset-bottom);
  user-select: none;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: space-around;
    height: calc(64px + env(safe-area-inset-bottom));
  }
`;

const NavItem = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1;
  height: 64px;
  color: #64748b;
  text-decoration: none;
  border: none !important;
  outline: none !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  -webkit-tap-highlight-color: transparent;

  &:visited {
    color: #64748b;
  }

  /* Haptic Touch feedback */
  &:active {
    transform: scale(0.92);
  }

  .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease, color 0.2s ease;
  }

  .nav-label {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    transition: color 0.2s ease;
  }

  /* Active State with Emerald Glow */
  &.active {
    color: #34d399;

    .nav-icon {
      color: #34d399;
      transform: translateY(-1px);
    }

    .nav-label {
      color: #f8fafc;
      font-weight: 700;
    }

    &::after {
      content: '';
      position: absolute;
      bottom: calc(env(safe-area-inset-bottom) + 4px);
      width: 14px;
      height: 3px;
      border-radius: 9999px;
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }
  }
`;

const MenuTriggerButton = styled.button<{ $isOpen: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  flex: 1;
  height: 64px;
  background: transparent;
  border: none;
  color: ${props => props.$isOpen ? '#34d399' : '#64748b'};
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: scale(0.92);
  }

  .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.$isOpen ? '#34d399' : '#64748b'};
    transition: transform 0.2s ease, color 0.2s ease;
  }

  .nav-label {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: ${props => props.$isOpen ? '#f8fafc' : '#64748b'};
  }
`;

/* Center Elevated Floating Action Button */
const CenterActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  animation: ${pulseGlow} 3s infinite ease-in-out;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  margin-top: -14px;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;

  &:active {
    transform: translateY(-6px) scale(0.92);
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.8);
  }

  svg {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }
`;

export const MobileBottomBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobileOpen, toggleMobile, setIsMobileOpen } = useSidebar();
  const { currentRole } = useOrganization();
  const { user } = useAuth();

  // Super Admin view
  if (user?.role === 'super_admin') {
    return (
      <BarContainer>
        <NavItem to="/admin" end>
          <span className="nav-icon"><LayoutDashboard size={20} /></span>
          <span className="nav-label">Admin</span>
        </NavItem>
        <NavItem to="/admin/clients">
          <span className="nav-icon"><Sprout size={20} /></span>
          <span className="nav-label">Clientes</span>
        </NavItem>
        <MenuTriggerButton $isOpen={isMobileOpen} onClick={toggleMobile} aria-label="Abrir menú">
          <span className="nav-icon"><Menu size={20} /></span>
          <span className="nav-label">Menú</span>
        </MenuTriggerButton>
      </BarContainer>
    );
  }

  // Quick action triggered by center button: navigate to crops or scanner
  const handleCenterAction = () => {
    if (location.pathname === '/crops') {
      // If already in crops, toggle menu or navigate to clones
      navigate('/clones');
    } else {
      navigate('/crops');
    }
    setIsMobileOpen(false);
  };

  return (
    <BarContainer>
      {/* 1. Dashboard */}
      <NavItem to="/" end>
        <span className="nav-icon"><LayoutDashboard size={20} /></span>
        <span className="nav-label">Inicio</span>
      </NavItem>

      {/* 2. Cultivo & Salas */}
      <NavItem to="/crops">
        <span className="nav-icon"><Sprout size={20} /></span>
        <span className="nav-label">Cultivos</span>
      </NavItem>

      {/* 3. Central Bio-Tech Action Button */}
      <CenterActionButton
        onClick={handleCenterAction}
        aria-label="Acción Rápida de Cultivo"
        title="Acceso directo a Salas y Plantas"
      >
        <Sprout size={22} />
      </CenterActionButton>

      {/* 4. Dispensario / Socios según rol */}
      {currentRole === 'partner' ? (
        <NavItem to="/account">
          <span className="nav-icon"><HeartHandshake size={20} /></span>
          <span className="nav-label">Mi Cuenta</span>
        </NavItem>
      ) : (
        <NavItem to="/dispensary">
          <span className="nav-icon"><HeartHandshake size={20} /></span>
          <span className="nav-label">Dispensario</span>
        </NavItem>
      )}

      {/* 5. Menú Completo (Abre el AppSidebar drawer lateral) */}
      <MenuTriggerButton
        $isOpen={isMobileOpen}
        onClick={toggleMobile}
        aria-label="Más opciones de menú"
      >
        <span className="nav-icon"><Menu size={20} /></span>
        <span className="nav-label">Más</span>
      </MenuTriggerButton>
    </BarContainer>
  );
};

export default MobileBottomBar;
