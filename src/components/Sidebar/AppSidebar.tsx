import React, { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Scissors,
  Cpu,
  Dna,
  GitBranch,
  FlaskConical,
  HeartHandshake,
  Users,
  ClipboardList,
  Calendar,
  ShoppingBag,
  FileSpreadsheet,
  Boxes,
  DollarSign,
  TrendingUp,
  Settings,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Lock,
  AlertTriangle,
  FileCheck,
  Package,
  Activity,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { useSidebar } from './SidebarContext';

// ─── Animations ──────────────────────────────────────────────────────────────
const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.7; }
`;

const tourHeartbeat = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1.04); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
`;

// ─── Styled Components ───────────────────────────────────────────────────────
const SidebarContainer = styled.aside<{ $isCollapsed: boolean; $isMobileOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  height: 100dvh;
  width: ${props => props.$isCollapsed ? '72px' : '260px'};
  background: rgba(3, 7, 18, 0.88);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.07);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 32px -4px rgba(0, 0, 0, 0.6);
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.25s ease-in-out;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  user-select: none;
  overflow: visible;

  @media (max-width: 768px) {
    width: 270px;
    transform: ${props => props.$isMobileOpen ? 'translateX(0)' : 'translateX(-100%)'};
  }
`;

const Overlay = styled.div<{ $isOpen: boolean }>`
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(4px);
  z-index: 950;
  opacity: ${props => props.$isOpen ? 1 : 0};
  pointer-events: ${props => props.$isOpen ? 'auto' : 'none'};
  transition: opacity 0.25s ease-in-out;

  @media (max-width: 768px) {
    display: block;
  }
`;

const MobileHeader = styled.header`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: calc(58px + env(safe-area-inset-top));
  padding-top: env(safe-area-inset-top);
  padding-left: 0.85rem;
  padding-right: 0.85rem;
  background: rgba(3, 7, 18, 0.88);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  z-index: 900;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    display: flex;
  }

  .header-left-group {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .menu-btn {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #cbd5e1;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;

    &:active {
      transform: scale(0.92);
      background: rgba(255, 255, 255, 0.1);
    }
  }

  .brand-mobile {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    
    img {
      height: 22px;
      max-width: 110px;
      object-fit: contain;
    }

    .org-badge {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 3px 8px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.25);
      font-size: 0.7rem;
      font-weight: 700;
      color: #34d399;
      letter-spacing: 0.02em;

      .live-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 0 6px #10b981;
        animation: ${pulse} 2s infinite ease-in-out;
      }
    }
  }

  .header-right-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .mobile-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
      color: #ffffff;
      font-size: 0.8rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    }
  }
`;

// ─── Header: Workspace Card ──────────────────────────────────────────────────
const SidebarHeaderWrapper = styled.div<{ $isCollapsed: boolean }>`
  padding: ${props => props.$isCollapsed ? '1rem 0.5rem' : '1rem 1rem 0.75rem'};
  display: flex;
  align-items: center;
  justify-content: ${props => props.$isCollapsed ? 'center' : 'space-between'};
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  min-height: 64px;
  position: relative;
`;

const WorkspaceCard = styled.div<{ $isCollapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
  overflow: hidden;

  .logo-wrapper {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.3) 100%);
    border: 1px solid rgba(16, 185, 129, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;

    img {
      width: 26px;
      height: 26px;
      object-fit: contain;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }
  }

  .info {
    display: ${props => props.$isCollapsed ? 'none' : 'flex'};
    flex-direction: column;
    min-width: 0;

    .name {
      font-size: 0.875rem;
      font-weight: 700;
      color: #f8fafc;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      letter-spacing: -0.01em;
    }

    .plan-tag {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #34d399;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;

      &.plan-demo { color: #f59e0b; }
      &.plan-pro { color: #38bdf8; }
      &.plan-ong { color: #a78bfa; }
    }
  }
`;

const CollapseButton = styled.button<{ $isCollapsed: boolean }>`
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 0.5rem;
  display: ${props => props.$isCollapsed ? 'none' : 'flex'};
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    color: #f8fafc;
    background: rgba(255, 255, 255, 0.08);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const ExpandMiniButton = styled.button`
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.4rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.5rem;
  transition: all 0.2s;

  &:hover {
    color: #34d399;
    background: rgba(16, 185, 129, 0.1);
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

// ─── Content: Scrollable Navigation ──────────────────────────────────────────
const SidebarContentWrapper = styled.nav<{ $isCollapsed: boolean }>`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: ${props => props.$isCollapsed ? '0.75rem 0.5rem' : '0.75rem 0.75rem'};
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
`;

const GroupSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-top: 0.6rem;

  &:first-child {
    margin-top: 0;
  }
`;

const GroupHeader = styled.div<{ $isCollapsed: boolean }>`
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #475569;
  padding: 0.5rem 0.6rem 0.25rem;
  display: ${props => props.$isCollapsed ? 'none' : 'flex'};
  align-items: center;
  justify-content: space-between;
`;

// ─── NavItem & Floating Tooltip ──────────────────────────────────────────────
const NavItemContainer = styled.div`
  position: relative;
  display: flex;
  width: 100%;
`;

const FloatingTooltip = styled.div`
  position: absolute;
  left: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%);
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 25px -4px rgba(0, 0, 0, 0.7), 0 0 12px rgba(16, 185, 129, 0.15);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #f8fafc;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s ease, transform 0.15s ease, visibility 0.15s;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &::before {
    content: '';
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: transparent #0f172a transparent transparent;
  }

  ${NavItemContainer}:hover & {
    opacity: 1;
    visibility: visible;
    transform: translateY(-50%) translateX(2px);
  }
`;

const StyledNavLink = styled(NavLink)<{ $isCollapsed: boolean; $isLocked?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: ${props => props.$isCollapsed ? 'center' : 'flex-start'};
  gap: 0.75rem;
  padding: ${props => props.$isCollapsed ? '0.65rem 0' : '0.65rem 0.75rem'};
  border-radius: 9px;
  text-decoration: none;
  color: ${props => props.$isLocked ? '#475569' : '#94a3b8'};
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  opacity: ${props => props.$isLocked ? 0.6 : 1};

  .icon {
    flex-shrink: 0;
    transition: color 0.18s ease, transform 0.18s ease;
  }

  .label {
    display: ${props => props.$isCollapsed ? 'none' : 'inline-block'};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .lock {
    margin-left: auto;
    font-size: 0.75rem;
    color: #64748b;
    display: ${props => props.$isCollapsed ? 'none' : 'inline-block'};
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: ${props => props.$isLocked ? '#94a3b8' : '#f8fafc'};
    
    .icon {
      transform: ${props => props.$isCollapsed ? 'scale(1.15)' : 'translateX(2px)'};
      color: #34d399;
    }
  }

  &.active {
    background: linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.03) 100%);
    color: #34d399;
    font-weight: 600;
    border: 1px solid rgba(16, 185, 129, 0.25);

    .icon {
      color: #34d399;
    }
  }

  &.tour-active-pulse {
    animation: ${tourHeartbeat} 1.5s infinite;
    z-index: 10001;
    position: relative;
    background: rgba(16, 185, 129, 0.25);
    border: 1px solid rgba(16, 185, 129, 0.6);
    color: #34d399;
  }
`;

// ─── Footer: User Profile Pill ───────────────────────────────────────────────
const SidebarFooterWrapper = styled.div<{ $isCollapsed: boolean }>`
  padding: ${props => props.$isCollapsed ? '0.75rem 0.5rem' : '0.75rem'};
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ProfilePill = styled.div<{ $isCollapsed: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${props => props.$isCollapsed ? 'center' : 'flex-start'};
  gap: 0.75rem;
  padding: ${props => props.$isCollapsed ? '0.4rem 0' : '0.5rem 0.6rem'};
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.04);
  transition: all 0.2s;

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    font-size: 0.8rem;
    font-weight: 700;
    flex-shrink: 0;
    position: relative;

    .online-indicator {
      position: absolute;
      bottom: -1px;
      right: -1px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      border: 1.5px solid #030712;
    }
  }

  .user-details {
    display: ${props => props.$isCollapsed ? 'none' : 'flex'};
    flex-direction: column;
    min-width: 0;
    flex: 1;

    .user-email {
      font-size: 0.78rem;
      font-weight: 600;
      color: #f1f5f9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 0.65rem;
      color: #64748b;
      text-transform: capitalize;
    }
  }
`;

const FooterActions = styled.div<{ $isCollapsed: boolean }>`
  display: flex;
  gap: 0.35rem;
  flex-direction: ${props => props.$isCollapsed ? 'column' : 'row'};

  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.45rem;
    border-radius: 7px;
    font-size: 0.75rem;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    border: none;
    transition: all 0.18s ease;

    &.account-btn {
      background: rgba(255, 255, 255, 0.04);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.05);

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #f8fafc;
      }
    }

    &.logout-btn {
      background: rgba(239, 68, 68, 0.08);
      color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.15);

      &:hover {
        background: rgba(239, 68, 68, 0.16);
        color: #fecaca;
        border-color: rgba(239, 68, 68, 0.3);
      }
    }
  }
`;

// ─── Main Component ──────────────────────────────────────────────────────────
export const AppSidebar: React.FC = () => {
  const location = useLocation();
  const { user, logout, tourStepIndex, kycStatus } = useAuth();
  const { currentOrganization, currentRole } = useOrganization();
  const { isCollapsed, toggleSidebar, isMobileOpen, setIsMobileOpen } = useSidebar();

  // Compute plan level
  const plan = currentOrganization?.plan || 'individual';
  const planLevel = ['trazapp', 'demo'].includes(plan) ? 4 :
    ['ong', 'enterprise'].includes(plan) ? 3 :
      ['equipo', 'pro'].includes(plan) ? 2 : 1;

  // Close mobile drawer on navigation
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname, setIsMobileOpen]);

  // Render navigation item helper
  const renderItem = (
    to: string,
    label: string,
    icon: React.ReactNode,
    requiredPlan = 1,
    tourClass = '',
    exact = false
  ) => {
    const isLocked = planLevel < requiredPlan;
    const lockText = requiredPlan === 2 ? 'Requiere Plan Equipo' : 'Requiere Plan ONG';

    return (
      <NavItemContainer key={to}>
        <StyledNavLink
          to={to}
          end={exact}
          $isCollapsed={isCollapsed}
          $isLocked={isLocked}
          className={tourClass}
        >
          <span className="icon">{icon}</span>
          <span className="label">{label}</span>
          {isLocked && <Lock className="lock" size={13} />}
        </StyledNavLink>

        {isCollapsed && (
          <FloatingTooltip>
            <span>{label}</span>
            {isLocked && <Lock size={12} style={{ color: '#f59e0b' }} />}
          </FloatingTooltip>
        )}
      </NavItemContainer>
    );
  };

  return (
    <>
      {/* Mobile Top Navigation */}
      <MobileHeader>
        <div className="header-left-group">
          <button className="menu-btn" onClick={() => setIsMobileOpen(!isMobileOpen)} aria-label="Abrir menú">
            {isMobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>

          <div className="brand-mobile">
            <img
              src={currentOrganization?.logo_url || "/trazappletras.png"}
              alt={currentOrganization?.name || "TrazApp"}
            />
            <div className="org-badge">
              <div className="live-dot" />
              <span>{currentOrganization?.name || 'TrazAPP'}</span>
            </div>
          </div>
        </div>

        <div className="header-right-group">
          <div className="mobile-avatar">
            {(user?.email || 'U')[0].toUpperCase()}
          </div>
        </div>
      </MobileHeader>

      {/* Mobile Overlay */}
      <Overlay $isOpen={isMobileOpen} onClick={() => setIsMobileOpen(false)} />

      {/* Desktop & Mobile AppSidebar */}
      <SidebarContainer
        className="tour-sidebar"
        $isCollapsed={isCollapsed}
        $isMobileOpen={isMobileOpen}
      >
        {/* Header / Workspace Card */}
        <SidebarHeaderWrapper $isCollapsed={isCollapsed}>
          <WorkspaceCard $isCollapsed={isCollapsed}>
            <div className="logo-wrapper">
              <img
                src={currentOrganization?.logo_url || "/logotrazappfix.png"}
                alt={currentOrganization?.name || "Logo"}
              />
            </div>
            <div className="info">
              <span className="name">{currentOrganization?.name || 'TrazAPP'}</span>
              <span className={`plan-tag plan-${plan}`}>
                {plan === 'demo' ? '• Plan Demo' : plan.toUpperCase()}
              </span>
            </div>
          </WorkspaceCard>

          <CollapseButton
            $isCollapsed={isCollapsed}
            onClick={toggleSidebar}
            title="Colapsar menú (Cmd + B)"
            aria-label="Colapsar menú"
          >
            <PanelLeftClose size={18} />
          </CollapseButton>
        </SidebarHeaderWrapper>

        {/* Collapsed Expand Quick Action */}
        {isCollapsed && (
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ExpandMiniButton onClick={toggleSidebar} title="Expandir menú (Cmd + B)">
              <PanelLeft size={18} />
            </ExpandMiniButton>
          </div>
        )}

        {/* Scrollable Navigation Groups */}
        <SidebarContentWrapper $isCollapsed={isCollapsed}>
          {user?.role === 'super_admin' ? (
            /* SUPER ADMIN MENU */
            <GroupSection>
              <GroupHeader $isCollapsed={isCollapsed}>SUPER ADMIN</GroupHeader>
              {renderItem('/admin', 'Dashboard', <LayoutDashboard size={18} />, 1, '', true)}
              {renderItem('/admin/clients', 'Gestión de Clientes', <Users size={18} />)}
              {renderItem('/admin/monitoring', 'Monitoreo Global', <Activity size={18} />)}
              {renderItem('/admin/devices', 'Inventario Dispositivos', <Cpu size={18} />)}
              {renderItem('/settings', 'Configuración', <Settings size={18} />)}
            </GroupSection>
          ) : currentRole === 'partner' ? (
            /* PARTNER / PACIENTE SOCIO MENU */
            <GroupSection>
              <GroupHeader $isCollapsed={isCollapsed}>MI PORTAL</GroupHeader>
              {renderItem('/account', 'Mi Reprocann', <FileCheck size={18} />)}
              {renderItem(`/${currentOrganization?.slug || 'demo'}/portal`, 'Tienda', <ShoppingBag size={18} />)}
              {renderItem('/shipping', 'Mis Envíos', <Package size={18} />)}
            </GroupSection>
          ) : (
            /* STAFF / GROWER / ADMIN / MEDICO MENU */
            <>
              {/* Core Dashboard */}
              <GroupSection>
                {renderItem('/', 'Dashboard', <LayoutDashboard size={18} />, 1, '', true)}
              </GroupSection>

              {/* Cultivo & Operaciones */}
              {['owner', 'grower', 'staff'].includes(currentRole || '') && (
                <GroupSection>
                  <GroupHeader $isCollapsed={isCollapsed}>CULTIVO & OPERACIONES</GroupHeader>
                  {renderItem(
                    '/crops',
                    'Cultivos',
                    <Sprout size={18} />,
                    1,
                    tourStepIndex === 4 && location.pathname !== '/crops' ? 'tour-crops-link tour-active-pulse' : 'tour-crops-link'
                  )}
                  {renderItem('/clones', 'Esquejes', <Scissors size={18} />)}
                  {renderItem('/devices', 'Dispositivos', <Cpu size={18} />)}
                  {renderItem('/genetics', 'Madres', <Dna size={18} />, 2, '', true)}
                  {renderItem('/genetics/rd', 'R&D Cruces', <GitBranch size={18} />, 2)}
                  {['owner', 'medico'].includes(currentRole || '') && (
                    renderItem('/laboratory', 'Laboratorio', <FlaskConical size={18} />, 2)
                  )}
                </GroupSection>
              )}

              {/* Clínico & Dispensario */}
              {['owner', 'admin', 'medico'].includes(currentRole || '') && (
                <GroupSection>
                  <GroupHeader $isCollapsed={isCollapsed}>CLÍNICO & DISPENSARIO</GroupHeader>
                  {renderItem('/dispensary', 'Dispensario', <HeartHandshake size={18} />)}
                  {renderItem('/patients', 'Socios / Pacientes', <Users size={18} />, 3)}
                  {renderItem('/templates', 'Plantillas', <ClipboardList size={18} />, 3)}
                  {renderItem('/appointments', 'Turnos Médicos', <Calendar size={18} />)}
                </GroupSection>
              )}

              {/* Gestión & Finanzas */}
              {['owner', 'admin', 'grower', 'staff'].includes(currentRole || '') && (
                <GroupSection>
                  <GroupHeader $isCollapsed={isCollapsed}>GESTIÓN & FINANZAS</GroupHeader>
                  {renderItem(
                    '/insumos',
                    'Insumos',
                    <ShoppingBag size={18} />,
                    2,
                    tourStepIndex === 15 && location.pathname !== '/insumos' ? 'tour-inventory-link tour-active-pulse' : 'tour-inventory-link'
                  )}
                  {renderItem('/informes', 'Informes', <FileSpreadsheet size={18} />)}
                  {['owner', 'grower'].includes(currentRole || '') && (
                    renderItem('/stock', 'Stock', <Boxes size={18} />)
                  )}
                  {['owner', 'admin'].includes(currentRole || '') && (
                    renderItem('/expenses', 'Gastos', <DollarSign size={18} />, 2)
                  )}
                  {['owner'].includes(currentRole || '') && (
                    <>
                      {renderItem('/metrics', 'Métricas', <TrendingUp size={18} />, 2)}
                      {renderItem('/settings', 'Configuración', <Settings size={18} />)}
                    </>
                  )}
                </GroupSection>
              )}
            </>
          )}
        </SidebarContentWrapper>

        {/* Footer: User Profile Pill */}
        <SidebarFooterWrapper $isCollapsed={isCollapsed}>
          <ProfilePill $isCollapsed={isCollapsed}>
            <div className="avatar">
              {(user?.email || 'U')[0].toUpperCase()}
              <div className="online-indicator" />
            </div>
            <div className="user-details">
              <span className="user-email">{user?.email || 'Usuario'}</span>
              <span className="user-role">{currentRole || user?.role || 'Miembro'}</span>
            </div>
            {kycStatus === 'pending' && !isCollapsed && (
              <AlertTriangle size={15} color="#ef4444" style={{ animation: `${pulse} 2s infinite` }} />
            )}
          </ProfilePill>

          <FooterActions $isCollapsed={isCollapsed}>
            <NavLink
              to="/account"
              className="action-btn account-btn"
              title="Mi Cuenta"
            >
              <User size={15} />
              {!isCollapsed && <span>Mi Cuenta</span>}
            </NavLink>

            <button
              onClick={logout}
              className="action-btn logout-btn"
              title="Cerrar Sesión"
            >
              <LogOut size={15} />
              {!isCollapsed && <span>Salir</span>}
            </button>
          </FooterActions>
        </SidebarFooterWrapper>
      </SidebarContainer>
    </>
  );
};

export default AppSidebar;
