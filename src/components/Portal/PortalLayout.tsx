import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaTimes, FaHome, FaHistory, FaSignOutAlt, FaLeaf, FaUser, FaStethoscope, FaCalendarAlt } from 'react-icons/fa';

const PortalContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: var(--bg-color, #020617);
  color: #f8fafc;
`;

const Sidebar = styled.aside<{ isOpen: boolean }>`
  width: 260px;
  background: rgba(15, 23, 42, 0.95);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  z-index: 100;
  
  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    transform: translateX(${props => (props.isOpen ? '0' : '-100%')});
  }
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  font-weight: bold;
  font-size: 1.1rem;

  img {
    height: 32px;
    object-fit: contain;
  }
`;

const NavList = styled.ul`
  list-style: none;
  padding: 1rem 0;
  margin: 0;
  flex: 1;
`;

const NavItem = styled.li<{ active?: boolean }>`
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  cursor: pointer;
  color: ${props => props.active ? 'var(--primary-color, #4ade80)' : '#cbd5e1'};
  background: ${props => props.active ? 'rgba(var(--primary-color-rgb, 74, 222, 128), 0.1)' : 'transparent'};
  border-left: 3px solid ${props => props.active ? 'var(--primary-color, #4ade80)' : 'transparent'};
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #f8fafc;
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Topbar = styled.header`
  height: 64px;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(15, 23, 42, 0.5);

  .hamburger {
    display: none;
    background: none;
    border: none;
    color: #f8fafc;
    font-size: 1.5rem;
    cursor: pointer;

    @media (max-width: 768px) {
      display: block;
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Overlay = styled.div<{ isOpen: boolean }>`
  display: none;
  @media (max-width: 768px) {
    display: ${props => (props.isOpen ? 'block' : 'none')};
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 90;
  }
`;

export const PortalLayout: React.FC<{ children: React.ReactNode, activeTab: string, onTabChange: (tab: string) => void }> = ({ children, activeTab, onTabChange }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const { logout, user } = useAuth();
    const { currentOrganization } = useOrganization();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/'); // Will redirect to login or landing based on custom domain routing later
    };

    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    const handleTabClick = (tab: string) => {
        onTabChange(tab);
        closeSidebar();
    };

    return (
        <PortalContainer>
            <Overlay isOpen={isSidebarOpen} onClick={closeSidebar} />
            <Sidebar isOpen={isSidebarOpen}>
                <SidebarHeader>
                    {currentOrganization?.logo_url && <img src={currentOrganization.logo_url} alt="Logo" />}
                    <span>{currentOrganization?.name || 'Portal'}</span>
                    {isSidebarOpen && (
                        <FaTimes style={{ marginLeft: 'auto', cursor: 'pointer', display: 'block' }} onClick={closeSidebar} />
                    )}
                </SidebarHeader>
                <NavList>
                    <NavItem active={activeTab === 'home'} onClick={() => handleTabClick('home')}>
                        <FaHome /> Inicio
                    </NavItem>
                    <NavItem active={activeTab === 'my-data'} onClick={() => handleTabClick('my-data')}>
                        <FaUser /> Mis Datos
                    </NavItem>
                    <NavItem active={activeTab === 'clinical'} onClick={() => handleTabClick('clinical')}>
                        <FaStethoscope /> Historia Clínica
                    </NavItem>
                    <NavItem active={activeTab === 'appointments'} onClick={() => handleTabClick('appointments')}>
                        <FaCalendarAlt /> Turnos
                    </NavItem>
                    <NavItem active={activeTab === 'dispensary'} onClick={() => handleTabClick('dispensary')}>
                        <FaLeaf /> Dispensario
                    </NavItem>
                    <NavItem active={activeTab === 'history'} onClick={() => handleTabClick('history')}>
                        <FaHistory /> Mis Retiros
                    </NavItem>
                </NavList>
                <div style={{ padding: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <NavItem onClick={handleLogout} style={{ borderRadius: '0.5rem', color: '#ef4444' }}>
                        <FaSignOutAlt /> Cerrar Sesión
                    </NavItem>
                </div>
            </Sidebar>

            <MainContent>
                <Topbar>
                    <button className="hamburger" onClick={toggleSidebar}>
                        <FaBars />
                    </button>
                    <div className="user-info">
                        Hola, {user?.name || 'Socio'}
                    </div>
                </Topbar>
                <ContentArea>
                    {children}
                </ContentArea>
            </MainContent>
        </PortalContainer>
    );
};
