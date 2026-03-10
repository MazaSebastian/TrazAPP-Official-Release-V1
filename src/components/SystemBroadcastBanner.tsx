import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaInfoCircle, FaExclamationTriangle, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { supabase } from '../services/supabaseClient';

const slideDown = keyframes`
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const BannerContainer = styled.div<{ $type: string }>`
  position: relative;
  width: 100%;
  padding: 1rem 3rem 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-weight: 500;
  color: #fff;
  z-index: 9999;
  animation: ${slideDown} 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

  background: ${props => {
        switch (props.$type) {
            case 'danger': return 'linear-gradient(to right, #dc2626, #ef4444)';
            case 'warning': return 'linear-gradient(to right, #d97706, #f59e0b)';
            case 'success': return 'linear-gradient(to right, #059669, #10b981)';
            default: return 'linear-gradient(to right, #2563eb, #3b82f6)';
        }
    }};

  p { margin: 0; font-size: 0.95rem; }
`;

const CloseButton = styled.button`
  position: absolute;
  right: 1.5rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.2);
  }
`;

interface Announcement {
    id: string;
    message: string;
    type: 'info' | 'warning' | 'danger' | 'success';
}

export const SystemBroadcastBanner: React.FC = () => {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const fetchActiveAnnouncement = async () => {
            try {
                const { data, error } = await supabase
                    .from('system_announcements')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (data && !error) {
                    // Check if this specific announcement ID was previously dismissed in this browser
                    const dismissedIds = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
                    if (!dismissedIds.includes(data.id)) {
                        setAnnouncement(data);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch system broadcasts", e);
            }
        };

        fetchActiveAnnouncement();

        // Set up realtime listener for announcements table to push live to currently active users!
        const channel = supabase.channel('public:system_announcements')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'system_announcements' },
                (payload) => {
                    fetchActiveAnnouncement(); // Re-fetch logic to check active status
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleDismiss = () => {
        if (announcement) {
            setIsDismissed(true);
            const dismissedIds = JSON.parse(localStorage.getItem('dismissed_announcements') || '[]');
            dismissedIds.push(announcement.id);
            localStorage.setItem('dismissed_announcements', JSON.stringify(dismissedIds));
        }
    };

    if (!announcement || isDismissed) return null;

    const Icon = () => {
        switch (announcement.type) {
            case 'danger': return <FaExclamationTriangle size={18} />;
            case 'warning': return <FaExclamationTriangle size={18} />;
            case 'success': return <FaCheckCircle size={18} />;
            default: return <FaInfoCircle size={18} />;
        }
    };

    return (
        <BannerContainer $type={announcement.type}>
            <Icon />
            <p dangerouslySetInnerHTML={{ __html: announcement.message }} />
            <CloseButton onClick={handleDismiss} title="Cerrar aviso">
                <FaTimes />
            </CloseButton>
        </BannerContainer>
    );
};
