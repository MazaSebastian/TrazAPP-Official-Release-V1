import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// import LiveChat from './components/LiveChat'; // Disabling LiveChat for CRM cleanup
import Dashboard from './pages/Dashboard';
import ClientManagement from './pages/admin/ClientManagement';
import SystemMonitoring from './pages/admin/SystemMonitoring';
import AdminDashboard from './pages/admin/AdminDashboard';
import Crops from './pages/Crops';
import CropDetail from './pages/CropDetail';
import Rooms from './pages/Rooms';
import RoomDetail from './pages/RoomDetail';
import Genetics from './pages/Genetics';
import { GeneticDetail } from './pages/GeneticDetail';
import Clones from './pages/Clones';
import { BatchDetail } from './pages/BatchDetail';
import Devices from './pages/Devices';
import { LaboratoryPage } from './pages/LaboratoryPage';
import { ExtractionsPage as Extractions } from './pages/Extractions';




import Stock from './pages/Stock';
import Dispensary from './pages/Dispensary';
import Settings from './pages/Settings';
import Compras from './pages/Compras';
import Insumos from './pages/Insumos';
import Expenses from './pages/Expenses';
import Metrics from './pages/Metrics'; // New Import
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Templates from './pages/Templates';
import AccountInfo from './pages/AccountInfo';
import { notificationService } from './services/notificationService';
import Login from './pages/Login';
import Register from './pages/Register'; // New Import
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';
import { useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { OrganizationProvider } from './context/OrganizationContext';
import './App.css';

import Sidebar from './components/Sidebar';
import ClickSpark from './components/ClickSpark';

import { ChatWidget } from './components/AI/ChatWidget';
import PageTransition from './components/PageTransition';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MainContent } from './components/MainContent';
import { RoleGuard } from './components/RoleGuard';

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // Init Notifications
    const initNotifications = async () => {
      await notificationService.init();
    };
    initNotifications();
  }, []);

  if (isLoading) return <LoadingSpinner fullScreen text="Iniciando..." duration={3000} />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <PageTransition key={location.key}>
      {children}
    </PageTransition>
  );
};

function App() {
  const location = useLocation();
  const isLogin = location.pathname === '/login';
  const isRegister = location.pathname === '/register';
  const isForgotPassword = location.pathname === '/forgot-password';
  const isUpdatePassword = location.pathname === '/update-password';
  const isPublicRoute = isLogin || isRegister || isForgotPassword || isUpdatePassword;

  return (
    <DataProvider>
      <OrganizationProvider>
        <div className={`App ${isPublicRoute ? 'public-theme' : ''}`}>
          <ClickSpark
            sparkColor="#03fc41"
            sparkSize={5}
            sparkRadius={20}
            sparkCount={8}
            duration={500}
            easing="ease-in-out"
            extraScale={0.9}
          />
          {!isPublicRoute && <Sidebar />}
          {/* Temporarily hidden per user request */}
          {/* {!isPublicRoute && <ChatWidget />} */}

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />



            {/* Protected Routes Wrapped in Main Content */}
            <Route path="/" element={
              <RequireAuth>
                <MainContent>
                  <Dashboard />
                </MainContent>
              </RequireAuth>
            } />

            <Route path="/admin" element={
              <RequireAuth>
                <MainContent>
                  <AdminDashboard />
                </MainContent>
              </RequireAuth>
            } />

            <Route path="/admin/clients" element={
              <RequireAuth>
                <MainContent>
                  <ClientManagement />
                </MainContent>
              </RequireAuth>
            } />

            <Route path="/admin/monitoring" element={
              <RequireAuth>
                <MainContent>
                  <SystemMonitoring />
                </MainContent>
              </RequireAuth>
            } />

            {/* GROWER / CULTIVO MODULES */}
            <Route path="/crops" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['grower', 'staff']}>
                  <MainContent>
                    <Crops />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />
            <Route path="/crops/:id" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['grower', 'staff']}>
                  <MainContent>
                    <CropDetail />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />

            <Route path="/rooms" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['grower', 'staff']}>
                  <MainContent>
                    <Rooms />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />

            <Route path="/rooms/:id" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['grower', 'staff']}>
                  <MainContent>
                    <RoomDetail />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />
            <Route path="/genetics" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['grower', 'staff']}>
                  <MainContent>
                    <Genetics />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />
            <Route path="/genetic/:id" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['grower', 'staff']}>
                  <MainContent>
                    <GeneticDetail />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />
            <Route path="/clones" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['grower', 'staff']}>
                  <MainContent>
                    <Clones />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />
            <Route path="/clones/:id" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['grower', 'staff']}>
                  <MainContent>
                    <BatchDetail />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />
            <Route path="/devices" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['grower', 'staff']}>
                  <MainContent>
                    <Devices />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />

            <Route path="/laboratory" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['medico']}>
                  <MainContent>
                    <LaboratoryPage />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />

            <Route path="/extractions" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['medico']}>
                  <MainContent>
                    <Extractions />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />

            <Route path="/insumos" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['admin', 'grower', 'staff']}>
                  <MainContent>
                    <Insumos />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />

            {/* FINANCE / ADMIN MODULES */}
            <Route path="/stock" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['admin', 'grower']}>
                  <MainContent>
                    <Stock />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />

            <Route path="/settings" element={
              <RequireAuth>
                <RoleGuard allowedRoles={[]}>
                  <MainContent>
                    <Settings />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />
            <Route path="/compras" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['admin']}>
                  <MainContent>
                    <Compras />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />
            <Route path="/expenses" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['admin']}>
                  <MainContent>
                    <Expenses />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />
            <Route path="/metrics" element={
              <RequireAuth>
                <RoleGuard allowedRoles={[]}>
                  <MainContent>
                    <Metrics />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />

            {/* MEDICAL / PATIENTS MODULES */}
            <Route path="/dispensary" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['admin', 'medico']}>
                  <MainContent>
                    <Dispensary />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />
            <Route path="/account" element={
              <RequireAuth>
                <MainContent>
                  <AccountInfo />
                </MainContent>
              </RequireAuth>
            } />

            <Route path="/patients" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['admin', 'medico']}>
                  <MainContent>
                    <Patients />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />
            <Route path="/patients/:id" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['admin', 'medico']}>
                  <MainContent>
                    <PatientDetail />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />
            <Route path="/templates" element={
              <RequireAuth>
                <RoleGuard allowedRoles={['admin', 'medico']}>
                  <MainContent>
                    <Templates />
                  </MainContent>
                </RoleGuard>
              </RequireAuth>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </OrganizationProvider>
    </DataProvider >
  );
}


export default App;
