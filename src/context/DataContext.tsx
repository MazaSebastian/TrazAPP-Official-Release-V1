import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Crop, Task } from '../types';
import { Room } from '../types/rooms';
import { tasksService } from '../services/tasksService';
import { cropsService } from '../services/cropsService';
import { roomsService } from '../services/roomsService';
import { stickiesService } from '../services/stickiesService';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';

interface DataContextType {
    crops: Crop[];
    rooms: Room[];
    tasks: Task[];
    stickies: any[];
    isLoading: boolean;
    refreshData: (isInitial?: boolean) => Promise<void>;
    updateTasks: () => Promise<void>;
    updateCrops: () => Promise<void>;
    updateRooms: () => Promise<void>;
    updateStickies: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData debe ser usado dentro de un DataProvider');
    }
    return context;
};

interface DataProviderProps {
    children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
    const { user } = useAuth();
    const { currentOrganization } = useOrganization();
    const [crops, setCrops] = useState<Crop[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [stickies, setStickies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCrops = useCallback(async (orgId?: string) => {
        const targetOrg = orgId || currentOrganization?.id;
        if (!targetOrg) return;
        try {
            const data = await cropsService.getCrops(targetOrg);
            setCrops(data);
        } catch (e) {
            console.error("Error fetching crops", e);
        }
    }, [currentOrganization?.id]);

    const fetchRooms = useCallback(async (orgId?: string) => {
        const targetOrg = orgId || currentOrganization?.id;
        if (!targetOrg) return;
        try {
            const data = await roomsService.getRooms(undefined, targetOrg);
            setRooms(data);
        } catch (e) {
            console.error("Error fetching rooms", e);
        }
    }, [currentOrganization?.id]);

    const fetchTasks = useCallback(async (orgId?: string) => {
        const targetOrg = orgId || currentOrganization?.id;
        if (!targetOrg) return;
        try {
            const data = await tasksService.getPendingTasks(targetOrg);
            setTasks(data);
        } catch (e) {
            console.error("Error fetching tasks", e);
        }
    }, [currentOrganization?.id]);

    const fetchStickies = useCallback(async (orgId?: string) => {
        const targetOrg = orgId || currentOrganization?.id;
        if (!targetOrg) return;
        try {
            const data = await stickiesService.getStickies(undefined, targetOrg);
            setStickies(data);
        } catch (e) {
            console.error("Error fetching stickies", e);
        }
    }, [currentOrganization?.id]);

    const refreshData = useCallback(async (isInitial = false) => {
        if (!currentOrganization?.id) {
            setIsLoading(false);
            return;
        }

        // If initial load, ensure minimum time for branding animation (2.5s)
        const minTimePromise = isInitial
            ? new Promise(resolve => setTimeout(resolve, 2500))
            : Promise.resolve();

        await Promise.all([
            fetchCrops(currentOrganization.id),
            fetchRooms(currentOrganization.id),
            fetchTasks(currentOrganization.id),
            fetchStickies(currentOrganization.id),
            minTimePromise
        ]);
    }, [currentOrganization?.id, fetchCrops, fetchRooms, fetchTasks, fetchStickies]);

    // Initial Load and on Org Change
    useEffect(() => {
        if (user?.id && currentOrganization?.id) {
            setIsLoading(true);
            const safetyTimer = setTimeout(() => {
                console.warn('[DataContext] Safety timer reached, forcing isLoading=false');
                setIsLoading(false);
            }, 3500);

            refreshData(true).finally(() => {
                clearTimeout(safetyTimer);
                setIsLoading(false);
            });
        } else if (!user?.id) {
            // If no user, keep loading false
            setIsLoading(false);
        }
    }, [user?.id, currentOrganization?.id, refreshData]);

    const value: DataContextType = {
        crops,
        rooms,
        tasks,
        stickies,
        isLoading,
        refreshData,
        updateTasks: fetchTasks,
        updateCrops: fetchCrops,
        updateRooms: fetchRooms,
        updateStickies: fetchStickies
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
