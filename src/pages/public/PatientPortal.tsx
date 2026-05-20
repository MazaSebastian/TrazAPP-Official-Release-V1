import React, { useState } from 'react';
import { DispensaryCatalog } from '../../components/Portal/DispensaryCatalog';
import { PortalLayout } from '../../components/Portal/PortalLayout';
import { PatientKYCGuard } from '../../components/Portal/PatientKYCGuard';
import { MyDataSection } from '../../components/Portal/MyDataSection';
import { ClinicalHistorySection } from '../../components/Portal/ClinicalHistorySection';
import { AppointmentsSection } from '../../components/Portal/AppointmentsSection';
import { useTenantResolver } from '../../hooks/useTenantResolver';
import { useParams } from 'react-router-dom';

const PatientPortal: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const { tenant, isLoading } = useTenantResolver(slug);
    const [activeTab, setActiveTab] = useState('home');

    if (isLoading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#fff' }}>Cargando portal...</div>;
    }

    if (!tenant) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#020617', color: '#ef4444' }}>Portal no encontrado.</div>;
    }

    return (
        <PatientKYCGuard>
            <PortalLayout activeTab={activeTab} onTabChange={setActiveTab}>
            {activeTab === 'home' && (
                <div style={{ maxWidth: '800px' }}>
                    <h2 style={{ fontSize: '2rem', color: 'var(--primary-color, #4ade80)', marginBottom: '1rem' }}>
                        ¡Bienvenido a tu Portal!
                    </h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                        Aquí podrás gestionar tus retiros, ver tu historial de dispensario y mantenerte al tanto de las novedades de la asociación. Utiliza el menú lateral para navegar por las distintas secciones.
                    </p>
                    <div style={{ padding: '1.5rem', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h3 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>Aviso Importante</h3>
                        <p style={{ color: '#cbd5e1', fontSize: '0.95rem' }}>
                            Asegúrate de revisar el dispensario regularmente para conocer la disponibilidad de nuevos insumos de tu tratamiento.
                        </p>
                    </div>
                </div>
            )}

            {activeTab === 'my-data' && <MyDataSection />}

            {activeTab === 'clinical' && <ClinicalHistorySection />}

            {activeTab === 'appointments' && <AppointmentsSection />}
            
            {activeTab === 'dispensary' && (
                <div style={{ maxWidth: '1200px', width: '100%' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '2rem', color: 'var(--primary-color, #4ade80)' }}>Dispensario</h2>
                        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Selecciona los insumos para tu tratamiento y confirma la reserva.</p>
                    </div>
                    <DispensaryCatalog />
                </div>
            )}

            {activeTab === 'history' && (
                <div style={{ maxWidth: '800px' }}>
                    <h2 style={{ fontSize: '2rem', color: 'var(--primary-color, #4ade80)', marginBottom: '1rem' }}>Mis Retiros</h2>
                    <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Historial de tus retiros en el club.</p>
                    {/* Placeholder for future implementation */}
                    <div style={{ marginTop: '2rem', padding: '2rem', textAlign: 'center', background: 'rgba(30, 41, 59, 0.3)', borderRadius: '1rem', border: '1px dashed rgba(255,255,255,0.1)', color: '#64748b' }}>
                        No hay retiros registrados aún.
                    </div>
                </div>
            )}
        </PortalLayout>
        </PatientKYCGuard>
    );
};

export default PatientPortal;
