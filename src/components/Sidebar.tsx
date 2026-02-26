import React, { useState } from 'react';

import styled from 'styled-components';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FaChartLine,
  FaChartPie,
  FaBoxes,
  FaShoppingBag,
  FaBars,
  FaSeedling,
  FaSignOutAlt,
  FaMoneyBillWave,
  FaDna,
  FaCut,
  FaIdCard,
  FaHandHoldingMedical,
  FaCog,
  FaPlug,
  FaFlask,
  FaUsers,
  FaHeartbeat,
  FaLock,
  FaUserCircle,
  FaClipboardList,
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';




const SidebarContainer = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 260px;
  background: rgba(15, 23, 42, 0.85); /* Dark Glassmorphism */
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 1000;
  transition: transform 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0,0,0,0.5);
  overflow-y: auto;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);

  @media (max-width: 768px) {
    transform: ${props => props.isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  }
`;

const MobileHeader = styled.div`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: calc(72px + env(safe-area-inset-top)); /* Increased base height to give breathing room */
  padding-top: calc(env(safe-area-inset-top) + 8px); /* Add 8px extra padding away from the notch */
  background: rgba(15, 23, 42, 0.85); /* Dark Glassmorphism */
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 900;
  align-items: center;
  justify-content: center; /* Center horizontally overall */
  padding-left: 1rem;
  padding-right: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);

  @media (max-width: 768px) {
    display: flex;
  }

  .brand {
    font-weight: 800;
    color: #4ade80; /* Neon green */
    font-size: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    position: absolute; /* Keep it centered regardless of the hamburger button */
    left: 50%;
    transform: translateX(-50%);
  }

  /* Hamburger button needs to sit on the left without affecting center */
  > button {
    margin-right: auto;
    z-index: 10;
  }
`;

const Overlay = styled.div<{ isOpen: boolean }>`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 950;
  backdrop-filter: blur(2px);
  opacity: ${props => props.isOpen ? 1 : 0};
  pointer-events: ${props => props.isOpen ? 'all' : 'none'};
  transition: opacity 0.3s ease;

  @media (max-width: 768px) {
    display: block;
  }
`;

const LogoSection = styled.div`
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 800;
    color: #4ade80;
  }

  svg {
    font-size: 1.75rem;
    color: #4ade80;
  }
`;

const NavList = styled.nav`
  padding: 1.5rem 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  text-decoration: none;
  color: #94a3b8; /* Light slate for inactive */
  font-weight: 500;
  border-radius: 0.75rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(30, 41, 59, 0.5); /* Hover dark slate */
    color: #4ade80;
    transform: translateX(4px);
  }

  &.active {
    background: rgba(34, 197, 94, 0.1); /* Subtle green tint */
    color: #4ade80;
    font-weight: 600;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }

  svg.lock-icon {
    font-size: 0.85rem;
    color: #e2e8f0;
    margin-left: auto;
    opacity: 0.8;
  }
`;

const SectionTitle = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  color: #64748b; /* Medium slate */
  margin: 1.5rem 0 0.5rem 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const UserSection = styled.div`
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(15, 23, 42, 0.4);
`;

const LogoutButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(127, 29, 29, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 0.5rem;
  color: #fca5a5;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(127, 29, 29, 0.2);
    border-color: rgba(239, 68, 68, 0.4);
    color: #fecaca;
  }
`;

const HamburgerButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #e2e8f0;
  }
`;

const Sidebar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { currentOrganization, currentRole } = useOrganization();

  // Compute plan level for feature access
  const plan = currentOrganization?.plan || 'individual';
  const planLevel = ['ong', 'enterprise'].includes(plan) ? 3 :
    ['equipo', 'pro'].includes(plan) ? 2 : 1;


  // Close sidebar when route changes only on mobile
  React.useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <>
      <MobileHeader>
        <HamburgerButton onClick={() => setIsOpen(true)}>
          <FaBars />
        </HamburgerButton>
        <div className="brand">
          <img src="/trazappletras.png" alt="TrazApp" style={{ height: '24px', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }} />
        </div>
      </MobileHeader>

      <Overlay isOpen={isOpen} onClick={() => setIsOpen(false)} />

      <SidebarContainer className="tour-sidebar" isOpen={isOpen}>
        <LogoSection style={{ justifyContent: 'center', padding: '1.5rem' }}>
          <img src="/logotrazappfix.png" alt="Logo" style={{ height: 'auto', width: '100%', maxWidth: '135px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
        </LogoSection>

        <NavList>
          {user?.role === 'super_admin' ? (
            /* SUPER ADMIN MENU */
            <>
              <StyledNavLink to="/admin" end>
                <FaChartLine /> Dashboard
              </StyledNavLink>
              <StyledNavLink to="/admin/clients">
                <FaUsers /> Gestión de Clientes
              </StyledNavLink>
              <StyledNavLink to="/admin/monitoring">
                <FaHeartbeat /> Monitoreo
              </StyledNavLink>
              <StyledNavLink to="/settings">
                <FaCog /> Configuración
              </StyledNavLink>
            </>
          ) : (
            /* REGULAR USER MENU */
            <>
              <StyledNavLink to="/">
                <FaChartLine /> Dashboard
              </StyledNavLink>

              {['owner', 'grower', 'staff'].includes(currentRole || '') && (
                <>
                  <SectionTitle>Cultivo</SectionTitle>

                  <StyledNavLink to="/crops">
                    <FaSeedling /> Cultivos
                  </StyledNavLink>
                  <StyledNavLink to="/clones">
                    <FaCut /> Esquejes
                  </StyledNavLink>
                  <StyledNavLink to="/devices">
                    <FaPlug /> Dispositivos
                  </StyledNavLink>
                  <StyledNavLink to="/genetics" style={{ opacity: planLevel >= 2 ? 1 : 0.6 }}>
                    <FaDna /> Madres
                    {planLevel < 2 && <FaLock className="lock-icon" title="Requiere Plan Equipo" />}
                  </StyledNavLink>

                  {['owner', 'medico'].includes(currentRole || '') && (
                    <StyledNavLink to="/laboratory" style={{ opacity: planLevel >= 2 ? 1 : 0.6 }}>
                      <FaFlask /> Laboratorio
                      {planLevel < 2 && <FaLock className="lock-icon" title="Requiere Plan Equipo" />}
                    </StyledNavLink>
                  )}
                </>
              )}

              {['owner', 'admin', 'medico'].includes(currentRole || '') && (
                <>
                  <SectionTitle>Médico / Dispensario</SectionTitle>

                  <StyledNavLink to="/dispensary">
                    <FaHandHoldingMedical /> Dispensario
                  </StyledNavLink>
                  <StyledNavLink to="/patients" style={{ opacity: planLevel >= 3 ? 1 : 0.6 }}>
                    <FaIdCard /> Socios
                    {planLevel < 3 && <FaLock className="lock-icon" title="Requiere Plan ONG" />}
                  </StyledNavLink>
                  <StyledNavLink to="/templates" style={{ opacity: planLevel >= 3 ? 1 : 0.6 }}>
                    <FaClipboardList /> Plantillas
                    {planLevel < 3 && <FaLock className="lock-icon" title="Requiere Plan ONG" />}
                  </StyledNavLink>
                </>
              )}

              <SectionTitle>Gestión</SectionTitle>

              {['owner', 'admin', 'grower', 'staff'].includes(currentRole || '') && (
                <StyledNavLink to="/insumos" style={{ opacity: planLevel >= 2 ? 1 : 0.6 }}>
                  <FaShoppingBag /> Insumos
                  {planLevel < 2 && <FaLock className="lock-icon" title="Requiere Plan Equipo" />}
                </StyledNavLink>
              )}

              {['owner', 'admin', 'grower'].includes(currentRole || '') && (
                <StyledNavLink to="/stock">
                  <FaBoxes /> Stock
                </StyledNavLink>
              )}

              {['owner', 'admin'].includes(currentRole || '') && (
                <StyledNavLink to="/expenses" style={{ opacity: planLevel >= 2 ? 1 : 0.6 }}>
                  <FaMoneyBillWave /> Gastos
                  {planLevel < 2 && <FaLock className="lock-icon" title="Requiere Plan Equipo" />}
                </StyledNavLink>
              )}

              {['owner'].includes(currentRole || '') && (
                <>
                  <StyledNavLink to="/metrics" style={{ opacity: planLevel >= 2 ? 1 : 0.6 }}>
                    <FaChartPie /> Métricas
                    {planLevel < 2 && <FaLock className="lock-icon" title="Requiere Plan Equipo" />}
                  </StyledNavLink>
                  <StyledNavLink to="/settings">
                    <FaCog /> Configuración
                  </StyledNavLink>
                </>
              )}
            </>
          )}
        </NavList>

        <UserSection>
          <StyledNavLink to="/account" style={{ marginBottom: '0.5rem' }}>
            <FaUserCircle /> Mi Cuenta
          </StyledNavLink>
          <LogoutButton onClick={logout}>
            <FaSignOutAlt /> Cerrar Sesión
          </LogoutButton>
        </UserSection>

      </SidebarContainer >
    </>
  );
};

export default Sidebar;
