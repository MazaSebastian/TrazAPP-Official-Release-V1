import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useOrganization } from '../context/OrganizationContext';
import { FaUserCircle, FaEnvelope, FaBuilding, FaUserShield, FaExclamationTriangle } from 'react-icons/fa';

const PageContainer = styled.div`
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    svg {
      color: #3b82f6; 
    }
  }
`;

const ProfileCard = styled.div`
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const AvatarCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
`;

const UserName = styled.h2`
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: #f8fafc;
`;

const UserEmail = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #94a3b8;
  font-size: 0.95rem;

  svg {
    color: #64748b;
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const InfoCard = styled.div`
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 0.75rem;
  padding: 1.5rem;

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #cbd5e1;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    svg {
      color: #3b82f6;
    }
  }
`;

const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }

  .label {
    font-size: 0.8rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .value {
    font-size: 1rem;
    color: #f8fafc;
    font-weight: 500;
  }
`;

const RoleBadge = styled.span<{ role: string }>`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: capitalize;

  background: ${props => {
        switch (props.role?.toLowerCase()) {
            case 'owner': return 'rgba(168, 85, 247, 0.15)'; // Purple
            case 'super_admin': return 'rgba(239, 68, 68, 0.15)'; // Red
            case 'admin': return 'rgba(59, 130, 246, 0.15)'; // Blue
            case 'grower': return 'rgba(34, 197, 94, 0.15)'; // Green
            case 'medico': return 'rgba(234, 179, 8, 0.15)'; // Yellow
            default: return 'rgba(100, 116, 139, 0.15)'; // Slate
        }
    }};
  
  color: ${props => {
        switch (props.role?.toLowerCase()) {
            case 'owner': return '#c084fc';
            case 'super_admin': return '#f87171';
            case 'admin': return '#60a5fa';
            case 'grower': return '#4ade80';
            case 'medico': return '#facc15';
            default: return '#94a3b8';
        }
    }};
  
  border: 1px solid ${props => {
        switch (props.role?.toLowerCase()) {
            case 'owner': return 'rgba(168, 85, 247, 0.3)';
            case 'super_admin': return 'rgba(239, 68, 68, 0.3)';
            case 'admin': return 'rgba(59, 130, 246, 0.3)';
            case 'grower': return 'rgba(34, 197, 94, 0.3)';
            case 'medico': return 'rgba(234, 179, 8, 0.3)';
            default: return 'rgba(100, 116, 139, 0.3)';
        }
    }};
`;

const AccountInfo: React.FC = () => {
    const { user } = useAuth();
    const { currentOrganization, currentRole } = useOrganization();

    // Get initials for Avatar
    const getInitials = (name: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const roleDisplayNames: Record<string, string> = {
        'owner': 'Dueño',
        'admin': 'Administrador',
        'grower': 'Director de Cultivo',
        'medico': 'Director Médico',
        'staff': 'Operario',
        'super_admin': 'Super Administrador'
    };

    const displayRoleName = currentRole ? (roleDisplayNames[currentRole] || currentRole) : 'Usuario';

    return (
        <PageContainer>
            <Header>
                <h1><FaUserCircle /> Información de Cuenta</h1>
            </Header>

            <ProfileCard>
                <ProfileHeader>
                    <AvatarCircle>
                        {getInitials(user?.name || user?.email || '')}
                    </AvatarCircle>
                    <div>
                        <UserName>{user?.name || 'Usuario'}</UserName>
                        <UserEmail>
                            <FaEnvelope /> {user?.email}
                        </UserEmail>
                    </div>
                </ProfileHeader>

                <InfoGrid>
                    <InfoCard>
                        <h3><FaUserShield /> Permisos y Rol</h3>
                        <InfoRow>
                            <span className="label">Nivel de Acceso</span>
                            <div style={{ marginTop: '0.25rem' }}>
                                <RoleBadge role={currentRole || 'N/A'}>
                                    {displayRoleName}
                                </RoleBadge>
                            </div>
                        </InfoRow>
                        <InfoRow>
                            <span className="label">Identificador de Usuario (ID)</span>
                            <span className="value" style={{ fontSize: '0.85rem', color: '#94a3b8', wordBreak: 'break-all' }}>
                                {user?.id}
                            </span>
                        </InfoRow>
                    </InfoCard>

                    <InfoCard>
                        <h3><FaBuilding /> Organización Actual</h3>
                        {currentOrganization ? (
                            <>
                                <InfoRow>
                                    <span className="label">Nombre</span>
                                    <span className="value">{currentOrganization.name}</span>
                                </InfoRow>
                                <InfoRow>
                                    <span className="label">Tipo de Plan</span>
                                    <span className="value" style={{ textTransform: 'capitalize' }}>
                                        {currentOrganization.plan || 'Free'}
                                    </span>
                                </InfoRow>
                                <InfoRow>
                                    <span className="label">Organización ID</span>
                                    <span className="value" style={{ fontSize: '0.85rem', color: '#94a3b8', wordBreak: 'break-all' }}>
                                        {currentOrganization.id}
                                    </span>
                                </InfoRow>
                            </>
                        ) : (
                            <div style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <FaExclamationTriangle style={{ color: '#facc15' }} />
                                No estás asociado a ninguna organización activa.
                            </div>
                        )}
                    </InfoCard>
                </InfoGrid>

            </ProfileCard>
        </PageContainer>
    );
};

export default AccountInfo;
