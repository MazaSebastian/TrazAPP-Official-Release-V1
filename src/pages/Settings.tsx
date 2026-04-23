import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaCog, FaSave, FaDna } from 'react-icons/fa';
import { geneticsService } from '../services/geneticsService';
import { ToastModal } from '../components/ToastModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { CustomSelect } from '../components/CustomSelect';
import { Genetic } from '../types/genetics';
import { useOrganization } from '../context/OrganizationContext';
import { useAuth } from '../context/AuthContext';
import { organizationService } from '../services/organizationService';
import { planService } from '../services/planService';
import { getInsumoCategories, createInsumoCategory, deleteInsumoCategory } from '../services/insumosService';
import { Plan, TaskType, InsumoCategory } from '../types';
import { tasksService } from '../services/tasksService';
import { supabase } from '../services/supabaseClient';
import { FaUserPlus, FaUserShield, FaTrash, FaTimes, FaTasks, FaPlus, FaMapMarkerAlt, FaPlay, FaBoxes, FaWrench, FaPalette } from 'react-icons/fa';
import { LoadingSpinner } from '../components/LoadingSpinner';
import Swal from 'sweetalert2';
import { MapSelector } from '../components/MapSelector';
import { useJsApiLoader } from '@react-google-maps/api';
import { StockLabel } from '../components/StockLabel';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import { ImageCropperModal } from '../components/ImageCropperModal';

// Animación de aparición para modales
import { keyframes } from 'styled-components';
export const fadeIn = keyframes`
  from { opacity: 0; backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(8px); }
`;
export const scaleUp = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const PageContainer = styled.div`
  padding: 1rem;
  padding-top: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
  color: #f8fafc;
  
  @media (max-width: 768px) {
    padding: 1rem;
    padding-top: 1.5rem; /* Ajustado para eliminar el padding superior excesivo */
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
  
  h1 {
    font-size: 1.875rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    
    @media (max-width: 768px) {
      justify-content: center;
      width: 100%;
    }
  }
`;

const Section = styled.div`
  background: rgba(30, 41, 59, 0.6);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2);
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
`;

const SectionHeader = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #f8fafc;
  margin: 0 0 1.5rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;    /* Centrado global en móviles */
    text-align: center;
    justify-content: center;
    gap: 1rem;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SaveButton = styled.button`
  background: rgba(var(--primary-color-rgb, 168, 85, 247), 0.2);
  color: #d8b4fe;
  border: 1px solid rgba(var(--primary-color-rgb, 168, 85, 247), 0.5);
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  backdrop-filter: blur(8px);
  
  &:hover:not(:disabled) {
    background: rgba(var(--primary-color-rgb, 168, 85, 247), 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
  }
  
  &:disabled {
    background: rgba(100, 116, 139, 0.2);
    color: #94a3b8;
    border-color: rgba(100, 116, 139, 0.5);
    cursor: not-allowed;
    box-shadow: none;
  }
`;

const ActionButton = styled.button<{ $danger?: boolean }>`
  background: none;
  border: none;
  color: ${props => props.$danger ? '#ef4444' : '#94a3b8'};
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s;
  &:hover {
    color: ${props => props.$danger ? '#dc2626' : '#f8fafc'};
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: #94a3b8;
  font-weight: 600;
  font-size: 0.85rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #f8fafc;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    border-color: rgba(56, 189, 248, 0.5);
  }
`;

// --- Nuevos estilos para la vista móvil de Usuarios ---
const UserCardWrapper = styled.div`
  background: rgba(30, 41, 59, 0.4);
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .userInfo {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .u-name {
    font-size: 0.95rem;
    font-weight: 600;
    color: #f8fafc;
  }
  
  .u-email {
    font-size: 0.8rem;
    color: #94a3b8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }

  .u-role {
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    border-radius: 1rem;
    background: rgba(var(--primary-color-rgb, 168, 85, 247), 0.2);
    color: #d8b4fe;
    white-space: nowrap;
  }
`;

const DesktopView = styled.div`
  display: block;
  @media (max-width: 768px) {
    display: none;
  }
`;

const MobileView = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(8px);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalContentDetail = styled.div`
  background: rgba(30, 41, 59, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  border-radius: 1rem;
  width: 100%;
  max-width: 400px;
  padding: 1.5rem;
  animation: ${scaleUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }
`;

const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: ${props => props.$active ? '#c084fc' : '#94a3b8'};
  border-bottom: 2px solid ${props => props.$active ? '#c084fc' : 'transparent'};
  margin-bottom: -2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s;
  white-space: nowrap;

  &:hover {
    color: #d8b4fe;
  }
`;

const placesLibrary: "places"[] = ["places"];

const Settings: React.FC = () => {
  const { user, resetTour } = useAuth();
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'customization' | 'weather' | 'system'>('users');
  const [saving, setSaving] = useState(false);
  const [genetics, setGenetics] = useState<Genetic[]>([]);

  // Google Maps Loader for Places Autocomplete
  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: placesLibrary,
  });
  const [members, setMembers] = useState<any[]>([]);
  const [orgPlan, setOrgPlan] = useState<Plan | null>(null);

  // Task Manager State
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [newTaskTypeName, setNewTaskTypeName] = useState('');
  const [creatingTaskType, setCreatingTaskType] = useState(false);

  // Insumo Categories State
  const [insumoCategories, setInsumoCategories] = useState<InsumoCategory[]>([]);
  const [newInsumoCategoryName, setNewInsumoCategoryName] = useState('');
  const [creatingInsumoCategory, setCreatingInsumoCategory] = useState(false);

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('grower');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Label Settings State
  const [labelSettings, setLabelSettings] = useState<{
    themeMode: 'color' | 'bw';
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
    backgroundPattern: string;
    sidebarDesign: 'solid' | 'gradient';
    showAddress: boolean;
    addressText: string;
    phoneText: string;
  }>({
    themeMode: 'color',
    primaryColor: '#0f172a',
    secondaryColor: '#38bdf8',
    fontFamily: 'Inter',
    backgroundPattern: 'none',
    sidebarDesign: 'solid',
    showAddress: false,
    addressText: '',
    phoneText: ''
  });
  const [savingLabelSettings, setSavingLabelSettings] = useState(false);

  // Branding State
  const [brandingSlug, setBrandingSlug] = useState('');
  const [brandingPrimaryColor, setBrandingPrimaryColor] = useState('var(--primary-color, #a855f7)');
  const [brandingSecondaryColor, setBrandingSecondaryColor] = useState('var(--secondary-color, #7c3aed)');
  const [brandingLogoUrl, setBrandingLogoUrl] = useState('');
  const [brandingLogoFile, setBrandingLogoFile] = useState<File | null>(null);
  const [savingBranding, setSavingBranding] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  // Weather Location State
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      /* Define search scope here if needed */
    },
    debounce: 300,
    initOnMount: isGoogleMapsLoaded,
  });

  const [currentLocationName, setCurrentLocationName] = useState('Munro/Olivos');
  const [currentLat, setCurrentLat] = useState<number>(-34.5882);
  const [currentLng, setCurrentLng] = useState<number>(-58.4552);

  const [inviting, setInviting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null); // Estado para Modal Móvil

  const [toast, setToast] = useState<{ isOpen: boolean, message: string, type: 'success' | 'error' }>({
    isOpen: false,
    message: '',
    type: 'success'
  });

  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean, userId: string | null }>({
    isOpen: false,
    userId: null
  });

  useEffect(() => {
    if (currentOrganization?.label_settings) {
      setLabelSettings({
        ...labelSettings,
        ...(currentOrganization.label_settings as any)
      });
    }

    if (currentOrganization) {
      setBrandingSlug(currentOrganization.slug || '');
      setBrandingPrimaryColor(currentOrganization.primary_color || 'var(--primary-color, #a855f7)');
      setBrandingSecondaryColor(currentOrganization.secondary_color || 'var(--secondary-color, #7c3aed)');
      setBrandingLogoUrl(currentOrganization.logo_url || '');
    }

    loadData();
    const loadLocation = async () => {
      // 1. Try Supabase first (authoritative source per org)
      if (currentOrganization?.id) {
        const { data } = await supabase
          .from('organizations')
          .select('weather_location')
          .eq('id', currentOrganization.id)
          .single();
        if (data?.weather_location) {
          const loc = data.weather_location;
          if (loc.name) setCurrentLocationName(loc.name);
          if (loc.lat !== undefined) setCurrentLat(loc.lat);
          if (loc.lon !== undefined) setCurrentLng(loc.lon);
          // Sync to localStorage so WeatherWidget gets it without extra fetches
          localStorage.setItem('trazapp_weather_location', JSON.stringify(loc));
          return;
        }
      }
      // 2. Fallback to localStorage (legacy / first load)
      const savedLocation = localStorage.getItem('trazapp_weather_location');
      if (savedLocation) {
        try {
          const parsed = JSON.parse(savedLocation);
          if (parsed.name) setCurrentLocationName(parsed.name);
          if (parsed.lat !== undefined && parsed.lat !== null) setCurrentLat(parsed.lat);
          if (parsed.lon !== undefined && parsed.lon !== null) setCurrentLng(parsed.lon);
        } catch (e) { }
      }
    };
    loadLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization]);

  const loadData = async () => {
    setLoading(true);
    try {
      const gData = await geneticsService.getGenetics();
      setGenetics(gData);

      if (currentOrganization) {
        const mData = await organizationService.getOrganizationMembers(currentOrganization.id);
        setMembers(mData || []);

        const planData = await planService.getPlanBySlug(currentOrganization.plan);
        setOrgPlan(planData);

        const tData = await tasksService.getTaskTypes();
        setTaskTypes(tData);

        const icData = await getInsumoCategories();
        setInsumoCategories(icData);
      }
    } catch (e) {
      console.error("Error loading settings data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGenetics = async () => {
    setSaving(true);
    let successCount = 0;
    let errorCount = 0;

    for (const gen of genetics) {
      const success = await geneticsService.updateGenetic(gen.id, { default_price_per_gram: gen.default_price_per_gram });
      if (success) successCount++;
      else errorCount++;
    }

    if (errorCount === 0) {
      setToast({ isOpen: true, message: 'Precios de genéticas actualizados', type: 'success' });
    } else {
      setToast({ isOpen: true, message: `Actualizados: ${successCount}.Errores: ${errorCount} `, type: 'error' });
    }
    setSaving(false);
  };

  const updateGeneticPrice = (id: string, price: string) => {
    setGenetics(genetics.map(g =>
      g.id === id ? { ...g, default_price_per_gram: parseFloat(price) || 0 } : g
    ));
  };

  const closeToast = () => setToast({ ...toast, isOpen: false });

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!currentOrganization) return;
    try {
      await organizationService.updateMemberRole(currentOrganization.id, userId, newRole);
      setToast({ isOpen: true, message: 'Rol actualizado exitosamente', type: 'success' });
      const mData = await organizationService.getOrganizationMembers(currentOrganization.id);
      setMembers(mData || []);
    } catch (error: any) {
      setToast({ isOpen: true, message: error.message || 'Error al actualizar el rol', type: 'error' });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!currentOrganization) return;

    const memberToRemove = members.find(m => m.user_id === userId);
    if (memberToRemove?.role === 'owner') {
      setToast({ isOpen: true, message: 'No puedes eliminar al dueño de la organización', type: 'error' });
      return;
    }

    setConfirmDelete({ isOpen: true, userId });
  };

  const executeRemoveMember = async () => {
    if (!currentOrganization || !confirmDelete.userId) return;

    try {
      await organizationService.removeMember(currentOrganization.id, confirmDelete.userId);
      setToast({ isOpen: true, message: 'Usuario eliminado', type: 'success' });
      const mData = await organizationService.getOrganizationMembers(currentOrganization.id);
      setMembers(mData || []);
      if (selectedUser?.user_id === confirmDelete.userId) {
        setSelectedUser(null);
      }
    } catch (error: any) {
      setToast({ isOpen: true, message: error.message || 'Error al eliminar usuario', type: 'error' });
    } finally {
      setConfirmDelete({ isOpen: false, userId: null });
    }
  };

  const handleCreateUser = async () => {
    if (!currentOrganization || !newUserEmail || !newUserName || !newUserPassword) return;

    // UI double-check limits
    if (orgPlan && members.length >= orgPlan.limits.max_users) {
      setToast({ isOpen: true, message: `Límite alcanzado: ${orgPlan.limits.max_users} usuarios activos.`, type: 'error' });
      return;
    }

    setInviting(true);
    try {
      await organizationService.createUserDirectly(
        currentOrganization.id,
        newUserEmail,
        newUserName,
        newUserRole,
        newUserPassword
      );
      setToast({ isOpen: true, message: 'Usuario creado y añadido exitosamente', type: 'success' });
      const mData = await organizationService.getOrganizationMembers(currentOrganization.id);
      setMembers(mData || []);

      // Reset form
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
    } catch (error: any) {
      setToast({ isOpen: true, message: error.message || 'Error al crear el usuario', type: 'error' });
    }
    setInviting(false);
  };

  const currentUserRole = members.find(m => m.user_id === user?.id)?.role;
  const canManageUsers = currentUserRole === 'owner' || currentUserRole === 'admin';
  const canManageTasks = currentUserRole === 'owner' || currentUserRole === 'grower';

  const handleCreateTaskType = async () => {
    if (!newTaskTypeName.trim()) return;
    setCreatingTaskType(true);
    try {
      const newType = await tasksService.createTaskType(newTaskTypeName.trim());
      if (newType) {
        setTaskTypes([...taskTypes, newType]);
        setNewTaskTypeName('');
        setToast({ isOpen: true, message: 'Tipo de tarea creado', type: 'success' });
      }
    } catch (e: any) {
      setToast({ isOpen: true, message: e.message || 'Error al crear la tarea', type: 'error' });
    } finally {
      setCreatingTaskType(false);
    }
  };

  const handleDeleteTaskType = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar tipo de tarea?',
      text: 'Las tareas existentes con este tipo no se borrarán, pero ya no se podrá seleccionar al crear nuevas tareas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'rgba(30, 41, 59, 0.95)',
      color: '#f8fafc',
      backdrop: 'rgba(15, 23, 42, 0.8)',
      customClass: {
        popup: 'swal2-dark-glass',
        title: 'swal2-title-white',
        htmlContainer: 'swal2-text-light'
      }
    });

    if (!result.isConfirmed) return;

    try {
      const success = await tasksService.deleteTaskType(id);
      if (success) {
        setTaskTypes(taskTypes.filter(t => t.id !== id));
        setToast({ isOpen: true, message: 'Tipo de tarea eliminado', type: 'success' });
      }
    } catch (e: any) {
      setToast({ isOpen: true, message: 'Error al eliminar la tarea', type: 'error' });
    }
  };

  const handleCreateInsumoCategory = async () => {
    if (!newInsumoCategoryName.trim()) return;
    setCreatingInsumoCategory(true);
    try {
      const newCat = await createInsumoCategory(newInsumoCategoryName.trim());
      if (newCat) {
        setInsumoCategories([...insumoCategories, newCat]);
        setNewInsumoCategoryName('');
        setToast({ isOpen: true, message: 'Categoría de insumo creada', type: 'success' });
      }
    } catch (e: any) {
      setToast({ isOpen: true, message: e.message || 'Error al crear la categoría', type: 'error' });
    } finally {
      setCreatingInsumoCategory(false);
    }
  };

  const handleDeleteInsumoCategory = async (id: string) => {
    const result = await Swal.fire({
      title: '¿Eliminar categoría?',
      text: 'Si hay insumos actualmente usando esta categoría, podrías afectar visualmente sus agrupaciones.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'rgba(30, 41, 59, 0.95)',
      color: '#f8fafc',
      backdrop: 'rgba(15, 23, 42, 0.8)',
      customClass: {
        popup: 'swal2-dark-glass',
        title: 'swal2-title-white',
        htmlContainer: 'swal2-text-light'
      }
    });

    if (!result.isConfirmed) return;

    try {
      const success = await deleteInsumoCategory(id);
      if (success) {
        setInsumoCategories(insumoCategories.filter(c => c.id !== id));
        setToast({ isOpen: true, message: 'Categoría eliminada', type: 'success' });
      }
    } catch (e: any) {
      setToast({ isOpen: true, message: 'Error al eliminar la categoría', type: 'error' });
    }
  };

  const handleSaveBranding = async () => {
    if (!currentOrganization) return;
    setSavingBranding(true);
    try {
      const updatedOrg = await organizationService.updateOrganizationBranding(
        currentOrganization.id,
        {
          slug: brandingSlug,
          primary_color: brandingPrimaryColor,
          secondary_color: brandingSecondaryColor
        },
        brandingLogoFile || undefined
      );

      setBrandingLogoUrl(updatedOrg.logo_url || '');
      setBrandingLogoFile(null);
      setToast({ isOpen: true, message: 'Branding actualizado exitosamente', type: 'success' });

      document.documentElement.style.setProperty('--primary-color', updatedOrg.primary_color || 'var(--primary-color, #a855f7)');
      document.documentElement.style.setProperty('--secondary-color', updatedOrg.secondary_color || 'var(--secondary-color, #7c3aed)');
    } catch (e: any) {
      setToast({ isOpen: true, message: e.message || 'Error al guardar branding', type: 'error' });
    } finally {
      setSavingBranding(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setCropImageSrc(reader.result?.toString() || null);
        setShowCropper(true);
      });
      reader.readAsDataURL(file);
    }
    // Permite seleccionar el mismo archivo si el usuario cancela el recorte
    e.target.value = '';
  };

  const handleCropComplete = (croppedFile: File) => {
    setBrandingLogoFile(croppedFile);
    setShowCropper(false);
    setCropImageSrc(null);
  };

  const handleSelectPlace = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);

      setCurrentLocationName(address);
      setCurrentLat(lat);
      setCurrentLng(lng);

      const locationData = { name: address, lat, lon: lng };

      // Save to Supabase (primary) + localStorage (for instant WeatherWidget sync)
      if (currentOrganization?.id) {
        await supabase
          .from('organizations')
          .update({ weather_location: locationData })
          .eq('id', currentOrganization.id);
      }
      localStorage.setItem('trazapp_weather_location', JSON.stringify(locationData));
      setToast({ isOpen: true, message: 'Ubicación guardada correctamente', type: 'success' });
      window.dispatchEvent(new Event('weatherLocationChanged'));
    } catch (error) {
      console.error("Error: ", error);
      setToast({ isOpen: true, message: 'No se pudo obtener la ubicación exacta de este lugar', type: 'error' });
    }
  };

  if (loading) {
    return (
      <PageContainer style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', marginTop: '-10vh' }}>
        <LoadingSpinner />
      </PageContainer>
    );
  }

  const renderUsersTab = () => (
    <>
      {currentOrganization && (
        <Section>
          <SectionHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaUserShield /> Gestor de Roles y Usuarios
            </div>

            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: orgPlan && members.length >= orgPlan.limits.max_users ? '#ef4444' : '#4ade80', background: 'rgba(15, 23, 42, 0.5)', padding: '0.25rem 0.75rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}>
              {orgPlan ? `Usuarios Disponibles: ${orgPlan.limits.max_users - members.length} de ${orgPlan.limits.max_users} (${orgPlan.name})` : `Miembros: ${members.length}`}
            </div>
          </SectionHeader>

          {canManageUsers && (
            <div style={{ marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.5)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#cbd5e1' }}>Crear Usuario Directamente</h3>
              </div>

              <FormGrid>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(30,41,59,0.5)', color: '#fff', boxSizing: 'border-box' }}
                />
                <input
                  type="email"
                  placeholder="Email del usuario"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(30,41,59,0.5)', color: '#fff', boxSizing: 'border-box' }}
                />
                <input
                  type="password"
                  placeholder="Contraseña (Mín. 6 caracteres)"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(30,41,59,0.5)', color: '#fff', boxSizing: 'border-box' }}
                />
                <CustomSelect
                  value={newUserRole}
                  onChange={val => setNewUserRole(val)}
                  options={[
                    { value: 'owner', label: 'Dueño' },
                    { value: 'admin', label: 'Administrador' },
                    { value: 'grower', label: 'Grower / Director de Cultivo' },
                    { value: 'medico', label: 'Médico / Director Médico' },
                    { value: 'staff', label: 'Staff / Operario' }
                  ]}
                  triggerStyle={{ padding: '0.625rem', borderRadius: '0.25rem', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(30,41,59,0.5)', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }}
                />
              </FormGrid>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
                <SaveButton
                  onClick={handleCreateUser}
                  disabled={inviting || !newUserEmail || !newUserPassword || !newUserName || (orgPlan ? members.length >= orgPlan.limits.max_users : false)}
                  style={{ background: '#22c55e', color: 'white', maxWidth: '100%', width: '100%', justifyContent: 'center' }}
                >
                  <FaUserPlus /> {inviting ? 'Creando...' : 'Crear Usuario y Añadir'}
                </SaveButton>
              </div>
            </div>
          )}

          <DesktopView>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', margin: '0 -1rem', padding: '0 1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                    <th style={{ padding: '0.75rem', width: '22%' }}>Nombre</th>
                    <th style={{ padding: '0.75rem', width: '30%' }}>Email</th>
                    <th style={{ padding: '0.75rem', width: '13%' }}>Ingreso</th>
                    <th style={{ padding: '0.75rem', width: '23%', textAlign: 'center' }}>Rol</th>
                    {canManageUsers && <th style={{ padding: '0.75rem', width: '12%', textAlign: 'right' }}>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => (
                    <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.profile?.full_name || 'Sin nombre'}</td>
                      <td style={{ padding: '0.75rem', color: '#cbd5e1', wordBreak: 'break-all' }}>{member.profile?.email || 'N/A'}</td>
                      <td style={{ padding: '0.75rem', color: '#94a3b8' }}>{new Date(member.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        {canManageUsers ? (
                          <CustomSelect
                            value={member.role}
                            onChange={val => handleRoleChange(member.user_id, val)}
                            options={[
                              { value: 'owner', label: 'Dueño' },
                              { value: 'admin', label: 'Administrador' },
                              { value: 'grower', label: 'Grower' },
                              { value: 'medico', label: 'Médico' },
                              { value: 'staff', label: 'Staff' }
                            ]}
                            triggerStyle={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.5rem', boxShadow: 'none', fontSize: '0.9rem', justifyContent: 'center' }}
                          />
                        ) : (
                          <span style={{ color: '#cbd5e1' }}>
                            {member.role === 'owner' ? 'Dueño' :
                              member.role === 'admin' ? 'Administrador' :
                                member.role === 'grower' ? 'Grower' :
                                  member.role === 'medico' ? 'Médico' : 'Staff'}
                          </span>
                        )}
                      </td>
                      {canManageUsers && (
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <ActionButton $danger onClick={() => handleRemoveMember(member.user_id)} title="Eliminar usuario">
                            <FaTrash />
                          </ActionButton>
                        </td>
                      )}
                    </tr>
                  ))}
                  {members.length === 0 && (
                    <tr>
                      <td colSpan={canManageUsers ? 5 : 4} style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>No hay miembros registrados</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </DesktopView>

          <MobileView>
            {members.map(member => (
              <UserCardWrapper key={member.id} onClick={() => setSelectedUser(member)}>
                <div className="userInfo">
                  <span className="u-name">{member.profile?.full_name || 'Sin nombre'}</span>
                  <span className="u-email">{member.profile?.email || 'N/A'}</span>
                </div>
                <span className="u-role">
                  {member.role === 'owner' ? 'Dueño' : member.role === 'admin' ? 'Administrador' : member.role === 'grower' ? 'Grower' : member.role === 'medico' ? 'Médico' : 'Staff'}
                </span>
              </UserCardWrapper>
            ))}
            {members.length === 0 && (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>No hay miembros registrados</div>
            )}
          </MobileView>
        </Section>
      )}
    </>
  );

  const renderCustomizationTab = () => (
    <>
      <Section>
        <SectionHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaPalette /> Branding del Club (Marca Blanca)
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#94a3b8' }}>
            Personaliza el portal de socios y e-commerce
          </div>
        </SectionHeader>

        <FormGrid style={{ marginBottom: '1.5rem', alignItems: 'start' }}>
          <FormGroup>
            <Label>Logotipo del Club (PNG, JPG, WebP)</Label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
              {(brandingLogoFile || brandingLogoUrl) ? (
                <img
                  src={brandingLogoFile ? URL.createObjectURL(brandingLogoFile) : brandingLogoUrl}
                  alt="Logo del Club"
                  style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '0.5rem', background: '#fff', padding: '0.2rem' }}
                />
              ) : (
                <div style={{ width: '60px', height: '60px', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FaDna size={24} color="#94a3b8" />
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleLogoChange} style={{ color: '#94a3b8', width: '100%' }} />
            </div>
          </FormGroup>

          <FormGroup>
            <Label>Enlace Público (Slug)</Label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.5)', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
              <span style={{ padding: '0.75rem', color: '#64748b', background: 'rgba(0,0,0,0.2)' }}>/portal/</span>
              <input
                type="text"
                value={brandingSlug}
                onChange={e => setBrandingSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="mi-club"
                style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: 'none', color: '#f8fafc', outline: 'none', margin: 0 }}
              />
            </div>
            <small style={{ color: '#64748b', marginTop: '0.25rem' }}>Ej: trazapp.ar/portal/mi-club</small>
          </FormGroup>

          <FormGroup>
            <Label>Color Primario (Botones y destacados)</Label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
              <input type="color" value={brandingPrimaryColor} onChange={e => setBrandingPrimaryColor(e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }} />
              <Input type="text" value={brandingPrimaryColor} onChange={e => setBrandingPrimaryColor(e.target.value)} style={{ width: '100px' }} />
            </div>
          </FormGroup>

          <FormGroup>
            <Label>Color Secundario (Degradados)</Label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem' }}>
              <input type="color" value={brandingSecondaryColor} onChange={e => setBrandingSecondaryColor(e.target.value)} style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '0.25rem', cursor: 'pointer' }} />
              <Input type="text" value={brandingSecondaryColor} onChange={e => setBrandingSecondaryColor(e.target.value)} style={{ width: '100px' }} />
            </div>
          </FormGroup>
        </FormGrid>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <SaveButton onClick={handleSaveBranding} disabled={savingBranding}>
            <FaSave /> {savingBranding ? 'Guardando...' : 'Guardar Branding'}
          </SaveButton>
        </div>
      </Section>

      {canManageTasks && (
        <Section>
          <SectionHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaTasks /> Gestor de Tipos de Tarea
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#94a3b8' }}>
              Personaliza las tareas disponibles
            </div>
          </SectionHeader>

          <div style={{ marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.5)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#cbd5e1' }}>Añadir Nuevo Tipo</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <FormGroup style={{ flex: '1 1 200px' }}>
                <Label>Nombre de la tarea (Ej: 'Limpieza de filtros')</Label>
                <Input
                  type="text"
                  placeholder="Escriba aquí..."
                  value={newTaskTypeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTaskTypeName(e.target.value)}
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleCreateTaskType()}
                />
              </FormGroup>
              <SaveButton
                onClick={handleCreateTaskType}
                disabled={creatingTaskType || !newTaskTypeName.trim()}
                style={{ width: 'auto', background: '#22c55e' }}
              >
                {creatingTaskType ? 'Guardando...' : <><FaPlus /> Añadir</>}
              </SaveButton>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.5)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            {taskTypes.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>TIPO DE TAREA</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600, width: '100px' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {taskTypes.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '1rem', color: '#f8fafc', fontWeight: 500 }}>
                        {t.name}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <ActionButton $danger onClick={() => handleDeleteTaskType(t.id)} title="Eliminar tipo">
                          <FaTrash />
                        </ActionButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                No hay tipos de tarea personalizados registrados.
              </div>
            )}
          </div>
        </Section>
      )}

      {canManageTasks && (
        <Section>
          <SectionHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaBoxes /> Gestor de Categorías de Insumos
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#94a3b8' }}>
              Crea filtros personalizados para tu inventario
            </div>
          </SectionHeader>

          <div style={{ marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.5)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#cbd5e1' }}>Añadir Nueva Categoría</h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <FormGroup style={{ flex: '1 1 200px' }}>
                <Label>Nombre de Categoría (Ej: 'Iluminación')</Label>
                <Input
                  type="text"
                  placeholder="Escriba aquí..."
                  value={newInsumoCategoryName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewInsumoCategoryName(e.target.value)}
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleCreateInsumoCategory()}
                />
              </FormGroup>
              <SaveButton
                onClick={handleCreateInsumoCategory}
                disabled={creatingInsumoCategory || !newInsumoCategoryName.trim()}
                style={{ width: 'auto', background: '#3b82f6' }}
              >
                {creatingInsumoCategory ? 'Guardando...' : <><FaPlus /> Añadir</>}
              </SaveButton>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.5)', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
            {insumoCategories.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', color: '#94a3b8', fontWeight: 600 }}>TIPO DE CATEGORÍA</th>
                    <th style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontWeight: 600, width: '100px' }}>ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {insumoCategories.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '1rem', color: '#f8fafc', fontWeight: 500 }}>
                        {c.name}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <ActionButton $danger onClick={() => handleDeleteInsumoCategory(c.id)} title="Eliminar categoría">
                          <FaTrash />
                        </ActionButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                No hay categorías de insumos registradas.
              </div>
            )}
          </div>
        </Section>
      )}

      {canManageTasks && (
        <Section>
          <SectionHeader>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaPalette /> Diseño de Etiquetas (Impresión)
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#94a3b8' }}>
              Personaliza el formato de las etiquetas de tus frascos y despachos
            </div>
          </SectionHeader>

          <div style={{ display: 'flex', flexDirection: window.innerWidth > 768 ? 'row' : 'column', gap: '2rem', background: 'rgba(15, 23, 42, 0.5)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>

            {/* Left Panel: Controls */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              <FormGroup>
                <Label>Modo de Impresión</Label>
                <CustomSelect
                  value={labelSettings.themeMode}
                  onChange={(val) => setLabelSettings({ ...labelSettings, themeMode: val as 'color' | 'bw' })}
                  options={[
                    { value: 'color', label: 'A Color (Estilo Premium)' },
                    { value: 'bw', label: 'Blanco y Negro (Impresora Térmica)' }
                  ]}
                  triggerStyle={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  Seleccioná "Blanco y Negro" si vas a usar una ticketera o impresora térmica (rollo blanco continuo).
                </p>
              </FormGroup>

              {labelSettings.themeMode === 'color' && (
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
                    <FormGroup style={{ flex: 1 }}>
                      <Label>Color Primario</Label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="color"
                          value={labelSettings.primaryColor}
                          onChange={(e) => setLabelSettings({ ...labelSettings, primaryColor: e.target.value })}
                          style={{ width: '48px', height: '48px', padding: 0, border: 'none', borderRadius: '0.5rem', cursor: 'pointer', boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }}
                        />
                        <Input
                          type="text"
                          value={labelSettings.primaryColor}
                          onChange={(e) => setLabelSettings({ ...labelSettings, primaryColor: e.target.value })}
                          style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace' }}
                        />
                      </div>
                    </FormGroup>

                    <FormGroup style={{ flex: 1 }}>
                      <Label>Color de Acento</Label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="color"
                          value={labelSettings.secondaryColor}
                          onChange={(e) => setLabelSettings({ ...labelSettings, secondaryColor: e.target.value })}
                          style={{ width: '48px', height: '48px', padding: 0, border: 'none', borderRadius: '0.5rem', cursor: 'pointer', boxShadow: '0 0 0 1px rgba(255,255,255,0.1)' }}
                        />
                        <Input
                          type="text"
                          value={labelSettings.secondaryColor}
                          onChange={(e) => setLabelSettings({ ...labelSettings, secondaryColor: e.target.value })}
                          style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace' }}
                        />
                      </div>
                    </FormGroup>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
                    <FormGroup>
                      <Label>Estilo de Barra Lateral</Label>
                      <CustomSelect
                        value={labelSettings.sidebarDesign || 'solid'}
                        onChange={(val) => setLabelSettings({ ...labelSettings, sidebarDesign: val as 'solid' | 'gradient' })}
                        options={[
                          { value: 'solid', label: 'Color Sólido' },
                          { value: 'gradient', label: 'Degradado Lineal' }
                        ]}
                        triggerStyle={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label>Diseño de Fondo de Etiqueta</Label>
                      <CustomSelect
                        value={labelSettings.backgroundPattern}
                        onChange={(val) => setLabelSettings({ ...labelSettings, backgroundPattern: val })}
                        options={[
                          { value: 'none', label: 'Liso (Blanco)' },
                          { value: 'dots', label: 'Puntos (Dots)' },
                          { value: 'waves', label: 'Líneas Diagonales' }
                        ]}
                        triggerStyle={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                    </FormGroup>
                  </div>
                </div>
              )}

              <FormGroup>
                <Label>Tipografía</Label>
                <CustomSelect
                  value={labelSettings.fontFamily}
                  onChange={(val) => setLabelSettings({ ...labelSettings, fontFamily: val })}
                  options={[
                    { value: 'Inter', label: 'Inter (Moderna)' },
                    { value: 'Roboto', label: 'Roboto' },
                    { value: 'serif', label: 'Clásica (Serif)' },
                    { value: 'monospace', label: 'Monospace (Técnica)' }
                  ]}
                  triggerStyle={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </FormGroup>

              <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '1rem' }}>
                  <input
                    type="checkbox"
                    checked={labelSettings.showAddress}
                    onChange={(e) => setLabelSettings({ ...labelSettings, showAddress: e.target.checked })}
                  />
                  Incluir info de la organización (Dirección/Teléfono)
                </Label>

                {labelSettings.showAddress && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input
                      type="text"
                      placeholder="Ej: Av. Siempreviva 123"
                      value={labelSettings.addressText}
                      onChange={(e) => setLabelSettings({ ...labelSettings, addressText: e.target.value })}
                    />
                    <Input
                      type="text"
                      placeholder="Ej: +54 9 11 1234-5678"
                      value={labelSettings.phoneText}
                      onChange={(e) => setLabelSettings({ ...labelSettings, phoneText: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <SaveButton
                onClick={async () => {
                  if (!currentOrganization) return;
                  setSavingLabelSettings(true);
                  try {
                    await supabase
                      .from('organizations')
                      .update({ label_settings: labelSettings })
                      .eq('id', currentOrganization.id);
                    setToast({ isOpen: true, message: 'Diseño de etiquetas guardado', type: 'success' });
                  } catch (e) {
                    console.error("Error saving label settings", e);
                  } finally {
                    setSavingLabelSettings(false);
                  }
                }}
                disabled={savingLabelSettings}
                style={{ marginTop: 'auto' }}
              >
                {savingLabelSettings ? 'Guardando...' : <><FaSave /> Guardar Diseño</>}
              </SaveButton>
            </div>

            {/* Right Panel: Preview */}
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', background: '#000', borderRadius: '0.5rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ marginBottom: '1rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                Vista Previa (No imprimible desde esta pantalla)
              </div>
              <div style={{ background: '#fff', padding: '2mm', boxShadow: '0 0 15px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                <StockLabel
                  patientName="Paciente de Prueba"
                  legajo="TRZ-001"
                  geneticName="Devil Line"
                  weight="175g"
                  organizationName={currentOrganization?.name || 'TrazAPP'}
                  logoUrl={currentOrganization?.logo_url || ''}
                  settings={labelSettings}
                />
              </div>
              <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '1.5rem', textAlign: 'center' }}>
                El diseño aplicará exactamente sobre etiquetas de 10x5 cm al imprimirlas desde el módulo de Dispensario/Lotes.
              </p>
            </div>

          </div>
        </Section>
      )}
    </>
  );

  const renderWeatherTab = () => (
    <>
      {/* Weather UI Components Module */}
      <Section style={{ position: 'relative', zIndex: 10 }}>
        <SectionHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaMapMarkerAlt /> Ubicación del Clima
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#94a3b8' }}>
            Configura tu zona para el Pronóstico
          </div>
        </SectionHeader>

        <div style={{ marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.5)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <Label style={{ display: 'block', marginBottom: '0.5rem' }}>Ubicación Actual</Label>
            <div style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FaMapMarkerAlt /> {currentLocationName}
            </div>
          </div>

          <FormGroup style={{ position: 'relative' }}>
            <Label>Buscar dirección exacta o barrio (Google Maps)</Label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="search-address-input"
                type="text"
                placeholder="Ej: Av. del Libertador 1000, Buenos Aires..."
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                }}
                disabled={!ready || !isGoogleMapsLoaded}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.5rem',
                  color: '#f8fafc',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {status === "OK" && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem',
                marginTop: '0.25rem', zIndex: 50, maxHeight: '200px', overflowY: 'auto',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                {data.map(({ place_id, description }) => (
                  <div
                    key={place_id}
                    onClick={() => handleSelectPlace(description)}
                    style={{
                      padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)',
                      color: '#f8fafc', display: 'flex', flexDirection: 'column'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ fontWeight: '500' }}>{description}</span>
                  </div>
                ))}
              </div>
            )}
          </FormGroup>

          {currentLat !== null && currentLng !== null && (
            <div style={{ marginTop: '2rem', zIndex: 5, position: 'relative' }}>
              <Label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc' }}>Ajustar Ubicación Exacta (Pin Arrastrable)</Label>
              <MapSelector
                lat={currentLat}
                lng={currentLng}
                onChange={(lat, lng) => {
                  const manualName = `Ajuste Manual (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                  setCurrentLat(lat);
                  setCurrentLng(lng);
                  setCurrentLocationName(manualName);

                  const locationData = { name: manualName, lat, lon: lng };

                  // Save to Supabase + localStorage
                  if (currentOrganization?.id) {
                    supabase
                      .from('organizations')
                      .update({ weather_location: locationData })
                      .eq('id', currentOrganization.id)
                      .then(() => { });
                  }
                  localStorage.setItem('trazapp_weather_location', JSON.stringify(locationData));
                  window.dispatchEvent(new Event('weatherLocationChanged'));
                }}
              />
            </div>
          )}
        </div>
      </Section>
    </>
  );

  const renderSystemTab = () => (
    <>
      <Section>
        <SectionHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FaPlay /> Opciones de Desarrollo / Tutorial
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 'normal', color: '#94a3b8' }}>
            Herramientas para pruebas
          </div>
        </SectionHeader>

        <div style={{ marginBottom: '1.5rem', background: 'rgba(15, 23, 42, 0.5)', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ marginBottom: '1rem' }}>
            <Label style={{ display: 'block', marginBottom: '0.5rem', color: '#f8fafc' }}>Tutorial Guiado Inicial</Label>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 1rem 0' }}>
              Al reiniciar el tutorial, volverá a aparecer el pop-up de bienvenida para realizar el recorrido guiado por la plataforma.
            </p>
          </div>

          <SaveButton
            onClick={async () => {
              if (window.confirm('¿Seguro que deseas reiniciar el tutorial guiado?')) {
                await resetTour();
                setToast({ isOpen: true, message: 'Tutorial reiniciado. Ve al Dashboard para verlo.', type: 'success' });
              }
            }}
            style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.5)' }}
          >
            <FaPlay /> Reiniciar Tutorial Guiado
          </SaveButton>
        </div>
      </Section>
    </>
  );

  return (
    <PageContainer>
      <Header>
        <h1><FaCog /> Configuración</h1>
      </Header>

      <TabsContainer>
        <Tab $active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
          <FaUserShield /> Roles y Usuarios
        </Tab>
        <Tab $active={activeTab === 'customization'} onClick={() => setActiveTab('customization')}>
          <FaPalette /> Personalización
        </Tab>
        <Tab $active={activeTab === 'weather'} onClick={() => setActiveTab('weather')}>
          <FaMapMarkerAlt /> Clima y Ubicación
        </Tab>
        <Tab $active={activeTab === 'system'} onClick={() => setActiveTab('system')}>
          <FaWrench /> Sistema
        </Tab>
      </TabsContainer>

      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'customization' && renderCustomizationTab()}
      {activeTab === 'weather' && renderWeatherTab()}
      {activeTab === 'system' && renderSystemTab()}

      {selectedUser && (
        <ModalOverlay onClick={() => setSelectedUser(null)}>
          <ModalContentDetail onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedUser(null)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <FaTimes size={20} />
            </button>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.25rem' }}>{selectedUser.profile?.full_name || 'Sin nombre'}</h3>
            <p style={{ margin: '0 0 1.5rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>{selectedUser.profile?.email || 'N/A'}</p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>Rol del usuario</label>
              {canManageUsers ? (
                <CustomSelect
                  value={selectedUser.role}
                  onChange={val => {
                    setSelectedUser({ ...selectedUser, role: val });
                    handleRoleChange(selectedUser.user_id, val);
                  }}
                  options={[
                    { value: 'owner', label: 'Dueño' },
                    { value: 'admin', label: 'Administrador' },
                    { value: 'grower', label: 'Grower / Director de Cultivo' },
                    { value: 'medico', label: 'Médico / Director Médico' },
                    { value: 'staff', label: 'Staff / Operario' }
                  ]}
                  triggerStyle={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.1)', width: '100%', boxSizing: 'border-box' }}
                />
              ) : (
                <div style={{ padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255,255,255,0.05)', color: '#f8fafc' }}>
                  {selectedUser.role === 'owner' ? 'Dueño' : selectedUser.role === 'admin' ? 'Administrador' : selectedUser.role === 'grower' ? 'Grower' : selectedUser.role === 'medico' ? 'Médico' : 'Staff'}
                </div>
              )}
            </div>

            {canManageUsers && selectedUser.role !== 'owner' && (
              <button
                onClick={() => handleRemoveMember(selectedUser.user_id)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <FaTrash /> Eliminar Usuario
              </button>
            )}
          </ModalContentDetail>
        </ModalOverlay>
      )}

      <ToastModal
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={closeToast}
      />

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Eliminar usuario"
        message="¿Estás seguro de que deseas eliminar a este usuario de la organización?"
        onConfirm={executeRemoveMember}
        onClose={() => setConfirmDelete({ isOpen: false, userId: null })}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDanger={true}
      />

      {showCropper && cropImageSrc && (
        <ImageCropperModal
          imageSrc={cropImageSrc}
          aspectRatio={1}
          shape="rect"
          onCropComplete={handleCropComplete}
          onClose={() => {
            setShowCropper(false);
            setCropImageSrc(null);
          }}
        />
      )}
    </PageContainer>
  );
};

export default Settings;
