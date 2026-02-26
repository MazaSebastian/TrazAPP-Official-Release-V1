import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { tasksService } from '../services/tasksService';
import { stickiesService } from '../services/stickiesService';


import styled, { keyframes, css } from 'styled-components';

import {
  FaSeedling,
  FaExclamationTriangle,
  FaCalendarCheck,
  FaChartLine,
  FaCheck,
  FaCheckCircle,
  FaStickyNote,
  FaPlus,
  FaTrash,
  FaClock
} from 'react-icons/fa';
import { WeatherWidget } from '../components/WeatherWidget';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { GuidedTour } from '../components/GuidedTour';
import { MedicoDashboard } from '../components/MedicoDashboard';


// --- Styled Components (Premium Eco-Tech Theme) ---

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  100% { transform: rotate(360deg); }
`;

const fadeInModal = keyframes`
  from { opacity: 0; backdrop-filter: blur(0px); }
  to { opacity: 1; backdrop-filter: blur(8px); }
`;

const fadeOutModal = keyframes`
  from { opacity: 1; backdrop-filter: blur(8px); }
  to { opacity: 0; backdrop-filter: blur(0px); }
`;

const scaleUp = keyframes`
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
`;

const scaleDown = keyframes`
  from { transform: scale(1); opacity: 1; }
  to { transform: scale(0.95); opacity: 0; }
`;

const Container = styled.div`
  padding: 1.5rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  /* TopNav space is usually handled by a wrapper. If not, keeping it minimal: */
  padding-top: 1.5rem; 
  background-color: transparent; /* Inherit global dark */
  animation: ${fadeIn} 0.5s ease-in-out;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem;
  }
`;

const WelcomeHeader = styled.div`
  margin-bottom: 2.5rem;

  @media (max-width: 768px) {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  h1 {
    font-size: clamp(1.5rem, 5vw, 2.5rem);
    font-weight: 800;
    color: #e2e8f0; /* Softer premium white/slate */
    margin: 0;
    letter-spacing: -0.05rem;
  }

  p {
    font-size: clamp(0.9rem, 3vw, 1.1rem);
    color: #94a3b8;
    margin-top: 0.5rem;
    font-weight: 500;
  }
`;

const DateDisplay = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
  color: #cbd5e1; /* Lighter, more premium slate */
  font-size: clamp(1rem, 3vw, 1.25rem); /* Responsive font size */
  font-weight: 500;
  letter-spacing: 0.025em;

  @media (max-width: 768px) {
    justify-content: center;
  }

  .separator {
    margin: 0 0.5rem;
    opacity: 0.5;

    @media (max-width: 768px) {
      display: none;
    }
  }
  
  svg { 
    color: #38bdf8; /* Brighter accent blue */
    font-size: 1.35rem; /* Make icons slightly larger too */
  }
`;

const KPISection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 240px), 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const KPICard = styled.div<{ active?: boolean, alert?: boolean }>`
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  border-radius: 1.25rem;
  padding: 1.75rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15);
  border: 1px solid ${props => props.alert ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
  }

  /* Decorative accent line */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 100%;
    background: ${props => props.alert ? '#ef4444' : props.active ? '#4ade80' : '#475569'};
  }

  .icon-wrapper {
    display: inline-flex;
    padding: 0.75rem;
    border-radius: 1rem;
    background: ${props => props.alert ? 'rgba(127, 29, 29, 0.3)' : 'rgba(20, 83, 45, 0.3)'};
    color: ${props => props.alert ? '#fca5a5' : '#4ade80'};
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .label {
    font-size: 0.875rem;
    color: #94a3b8;
    text-transform: uppercase;
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .value {
    font-size: 2rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0.25rem 0;
    display: flex;
    align-items: baseline;
    gap: 0.25rem;

    .unit {
      font-size: 1rem;
      color: #64748b;
      font-weight: 500;
    }
  }

  .subtext {
    font-size: 0.8rem;
    color: ${props => props.alert ? '#fca5a5' : '#64748b'};
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .desktop-view {
    display: block;
    @media (max-width: 768px) {
      display: none;
    }
  }

  .mobile-view {
    display: none;
    @media (max-width: 768px) {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .m-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .m-icon {
      display: inline-flex;
      padding: 0.5rem;
      border-radius: 0.5rem;
      background: ${props => props.alert ? 'rgba(127, 29, 29, 0.3)' : 'rgba(20, 83, 45, 0.3)'};
      color: ${props => props.alert ? '#fca5a5' : '#4ade80'};
      font-size: 1.25rem;
    }

    .m-text-group {
      display: flex;
      flex-direction: column;
    }

    .m-label {
      font-size: 0.75rem;
      color: #94a3b8;
      text-transform: uppercase;
      font-weight: 700;
    }

    .m-subtext {
      font-size: 0.7rem;
      color: ${props => props.alert ? '#fca5a5' : '#64748b'};
    }

    .m-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: ${props => props.alert ? '#f8fafc' : '#4ade80'};
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
      margin-right: 0.5rem;

      .m-unit {
        font-size: 0.75rem;
        color: #64748b;
        font-weight: 500;
      }
    }
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const heartbeat = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(229, 62, 62, 0.7); }
  70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(229, 62, 62, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(229, 62, 62, 0); }
`;

const CountdownGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

interface CountdownCardProps {
  stage: string;
  $alertLevel?: number; // 0: None, 1: Badge Red, 2: Border Red, 3: Heartbeat
}

const CountdownCard = styled.div<CountdownCardProps>`
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-left: 5px solid ${p => p.stage === 'vegetation' ? '#4ade80' : p.stage === 'flowering' ? '#f97316' : (p.stage === 'drying' || p.stage === 'curing') ? '#ea580c' : '#475569'};
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    border-left: 4px solid ${p => p.stage === 'vegetation' ? '#4ade80' : p.stage === 'flowering' ? '#f97316' : (p.stage === 'drying' || p.stage === 'curing') ? '#ea580c' : '#475569'};
  }

  // Level 2 Alert: Red Border
  ${p => p.$alertLevel && p.$alertLevel >= 2 && css`
      border: 2px solid rgba(239, 68, 68, 0.5);
      border-left: 5px solid #ef4444;
  `}

  // Level 3 Alert: Heartbeat
  ${p => p.$alertLevel && p.$alertLevel >= 3 && css`
      animation: ${heartbeat} 2s infinite;
  `}
  
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .room-name { font-weight: 700; color: #f8fafc; font-size: 1.1rem; }
  
  .active-badges {
      display: flex; gap: 0.5rem;
  }

  .stage-badge { 
    font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 0.25rem 0.5rem; border-radius: 999px;
    background: ${p => p.stage === 'vegetation' ? 'rgba(34, 197, 94, 0.2)' : p.stage === 'flowering' ? 'rgba(56, 189, 248, 0.2)' : (p.stage === 'drying' || p.stage === 'curing') ? 'rgba(251, 146, 60, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
    color: ${p => p.stage === 'vegetation' ? '#4ade80' : p.stage === 'flowering' ? '#38bdf8' : (p.stage === 'drying' || p.stage === 'curing') ? '#fb923c' : '#94a3b8'};
  }

  .desktop-view {
    display: block;
    @media (max-width: 768px) {
      display: none;
    }
  }

  .mobile-view {
    display: none;
    @media (max-width: 768px) {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    
    .m-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.25rem;
      font-size: 0.85rem;
      line-height: 1.2;
    }
    
    .m-room { font-weight: 700; color: #f8fafc; font-size: 0.95rem; }
    .m-crop { color: #94a3b8; font-weight: 500; font-size: 0.85rem; }
    
    .m-stage {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 0.2rem 0.4rem; border-radius: 999px;
      background: ${p => p.stage === 'vegetation' ? 'rgba(34, 197, 94, 0.2)' : p.stage === 'flowering' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
      color: ${p => p.stage === 'vegetation' ? '#4ade80' : p.stage === 'flowering' ? '#38bdf8' : '#94a3b8'};
    }
    
    .m-days-text { color: #cbd5e1; }
    .m-days-number {
      font-weight: 800; font-size: 1rem;
      color: ${p => p.stage === 'vegetation' ? '#4ade80' : p.stage === 'flowering' ? '#f97316' : '#cbd5e1'};
    }
    .m-genetic { color: #64748b; font-style: italic; }
    .m-separator { color: #475569; font-weight: 400; margin: 0 0.1rem; }
  }

  // Level 1 Alert: Red Badge for "Days Remaining"
  .warning-badge {
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase; padding: 0.25rem 0.5rem; border-radius: 999px;
      background: rgba(239, 68, 68, 0.2); color: #fca5a5; display: flex; align-items: center; gap: 0.25rem;
  }
  
  .countdown { font-size: 1.25rem; font-weight: 600; color: #94a3b8; display: flex; align-items: center; gap: 0.5rem; }
  .days { font-size: 1.5rem; font-weight: 800; color: ${p => p.stage === 'vegetation' ? '#4ade80' : p.stage === 'flowering' ? '#f97316' : (p.stage === 'drying' || p.stage === 'curing') ? '#ea580c' : '#cbd5e1'}; margin: 0 4px; }
  
  .progress-bar {
    height: 6px; background: rgba(255, 255, 255, 0.1); border-radius: 3px; margin-top: 1rem; overflow: hidden;
  }
  .progress-fill {
    height: 100%; 
    background: ${p => p.stage === 'vegetation' ? '#4ade80' : p.stage === 'flowering' ? '#f97316' : (p.stage === 'drying' || p.stage === 'curing') ? '#ea580c' : '#cbd5e1'};
    border-radius: 3px;
  }
`;

const SectionTitle = styled.h2`
  font-size: clamp(1.25rem, 4vw, 1.5rem);
  color: #cbd5e1; /* Elegant slate instead of harsh white */
  font-weight: 700;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    justify-content: center;
    text-align: center;
  }

  svg {
    color: #4ade80; /* TrazAPP Neon Green */
  }
`;





const AlertItem = styled.div`
  background: rgba(15, 23, 42, 0.4);
  border-left: 4px solid #f97316;
  border-radius: 0.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: start;
  gap: 0.75rem;

  @media (max-width: 768px) {
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    gap: 0.5rem;
  }

  .icon { color: #f97316; margin-top: 0.2rem; }
  
  .content {
    h5 { margin: 0; color: #f8fafc; font-weight: 600; }
    p { margin: 0.25rem 0 0; color: #94a3b8; font-size: 0.85rem; }

    @media (max-width: 768px) {
      h5 { font-size: 0.9rem; }
      p { font-size: 0.75rem; }
    }
  }
`;

const EmptyStateCard = styled.div`
  text-align: center;
  padding: 2rem;
  color: #94a3b8;
  background: rgba(15, 23, 42, 0.4);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);

  .icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #4ade80;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    
    .icon {
      font-size: 1.5rem;
      margin-bottom: 0.25rem;
    }

    p {
      margin: 0;
      font-size: 0.9rem;
    }
  }
`;

const StickyBoard = styled.div`
  margin-bottom: 3rem;
`;

const StickyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
`;

const StickyNoteCard = styled.div<{ color: string }>`
  background-color: ${p => {
    switch (p.color) {
      case 'yellow': return 'rgba(234, 179, 8, 0.15)';
      case 'blue': return 'rgba(56, 189, 248, 0.15)';
      case 'pink': return 'rgba(236, 72, 153, 0.15)';
      case 'green': return 'rgba(34, 197, 94, 0.15)';
      default: return 'rgba(234, 179, 8, 0.15)';
    }
  }};
  border: 1px solid ${p => {
    switch (p.color) {
      case 'yellow': return 'rgba(234, 179, 8, 0.3)';
      case 'blue': return 'rgba(56, 189, 248, 0.3)';
      case 'pink': return 'rgba(236, 72, 153, 0.3)';
      case 'green': return 'rgba(34, 197, 94, 0.3)';
      default: return 'rgba(234, 179, 8, 0.3)';
    }
  }};
  color: ${p => {
    switch (p.color) {
      case 'yellow': return '#fef08a';
      case 'blue': return '#bae6fd';
      case 'pink': return '#fbcfe8';
      case 'green': return '#bbf7d0';
    }
  }};
  padding: 1.25rem;
  border-radius: 0 0 1rem 0;
  box-shadow: 2px 4px 8px rgba(0,0,0,0.3);
  min-height: 180px;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: transform 0.2s;
  
  @media (max-width: 768px) {
    min-height: 120px;
    padding: 1rem;
  }
  
  &:hover {
    transform: scale(1.02) rotate(1deg);
    z-index: 10;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 30px;
    height: 30px;
    background: rgba(255,255,255,0.05);
    border-radius: 0 0 0 30px;
  }

  .content {
    flex: 1;
    font-family: 'Segoe UI', 'Roboto', sans-serif;
    font-size: 1rem;
    white-space: pre-wrap;
    line-height: 1.5;
    font-weight: 500;
  }

  .footer {
    border-top: 1px solid rgba(0,0,0,0.05);
    padding-top: 0.5rem;
    margin-top: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75rem;
    opacity: 0.8;
  }
  
  .delete-btn {
    opacity: 0;
    transition: opacity 0.2s;
    background: none;
    border: none;
    cursor: pointer;
    color: inherit;
    font-size: 1rem;
  }

  &:hover .delete-btn {
    opacity: 1;
  }
`;

const AddStickyParams = styled.div`
  background: rgba(15, 23, 42, 0.4);
  border: 2px dashed rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;

  @media (max-width: 768px) {
    min-height: 120px;
  }

  &:hover {
    border-color: rgba(74, 222, 128, 0.5);
    color: #4ade80;
    background: rgba(20, 83, 45, 0.2);
    
    .dashed-circle {
      border-color: #4ade80;
      animation: ${spin} 3s linear infinite;
      
      & > svg {
        animation: ${spin} 3s linear infinite reverse;
      }
    }
  }
`;

const DashedCircle = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s, animation 0.2s;
`;

const ModalOverlay = styled.div<{ $isClosing?: boolean }>`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
  animation: ${p => p.$isClosing ? fadeOutModal : fadeInModal} 0.25s ease-out forwards;
`;

const ModalContent = styled.div<{ $isClosing?: boolean }>`
  background: rgba(15, 23, 42, 0.95);
  padding: 2rem;
  border-radius: 1rem;
  width: 90%;
  max-width: 420px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  animation: ${p => p.$isClosing ? scaleDown : scaleUp} 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  
  h3 { margin-top: 0; margin-bottom: 1.5rem; color: #f8fafc; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
  
  textarea {
    width: 100%;
    height: 120px;
    padding: 0.75rem;
    background: rgba(30, 41, 59, 0.5);
    color: #f8fafc;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.5rem;
    margin: 1rem 0;
    font-size: 1rem;
    resize: none;
    &:focus { outline: none; border-color: #4ade80; }
  }
`;

const ColorPicker = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ColorOption = styled.button<{ color: string, selected: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid ${p => p.selected ? '#4a5568' : 'transparent'};
  cursor: pointer;
  background-color: ${p => {
    switch (p.color) {
      case 'yellow': return '#fff7cd';
      case 'blue': return '#d0f2ff';
      case 'pink': return '#ffe7ea';
      case 'green': return '#e3fce3';
      default: return '#fff';
    }
  }};
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transform: ${p => p.selected ? 'scale(1.1)' : 'scale(1)'};
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid ${p => p.variant === 'secondary' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(74, 222, 128, 0.3)'};
  background: ${p => p.variant === 'secondary' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(20, 83, 45, 0.3)'};
  color: ${p => p.variant === 'secondary' ? '#94a3b8' : '#4ade80'};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1; /* Makes buttons equal width */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  backdrop-filter: blur(4px);
  position: relative;
  overflow: hidden;

  /* Subtle top highlight for glass effect */
  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%);
    pointer-events: none;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px ${p => p.variant === 'secondary' ? 'rgba(0,0,0,0.4)' : 'rgba(74, 222, 128, 0.15)'};
    background: ${p => p.variant === 'secondary' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(20, 83, 45, 0.5)'};
    border-color: ${p => p.variant === 'secondary' ? 'rgba(255, 255, 255, 0.2)' : '#4ade80'};
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
`;



const ActionButtonSmall = styled.button<{ type: 'success' | 'danger' }>`
  background: none;
  border: none;
  cursor: pointer;
  color: ${props => props.type === 'success' ? '#38a169' : '#e53e3e'};
  padding: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.type === 'success' ? '#c6f6d5' : '#fed7d7'};
  }
`;

const AlertActions = styled.div`
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
`;




// ... (existing imports)

const Dashboard: React.FC = () => {
  const { user } = useAuth();


  const { tasks, crops, rooms, stickies, isLoading, refreshData, updateStickies, updateTasks } = useData();
  const [alerts, setAlerts] = useState<any[]>([]);

  // Time state for the clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Sticky Modal State
  const [isStickyModalOpen, setIsStickyModalOpen] = useState(false);
  const [isClosingStickyModal, setIsClosingStickyModal] = useState(false);
  const [newStickyContent, setNewStickyContent] = useState('');
  const [newStickyColor, setNewStickyColor] = useState<'yellow' | 'blue' | 'pink' | 'green'>('yellow');

  const handleCloseStickyModal = () => {
    setIsClosingStickyModal(true);
    setTimeout(() => {
      setIsStickyModalOpen(false);
      setIsClosingStickyModal(false);
    }, 240); // Wait for CSS animation to nearly finish before unmounting
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'warning': return <FaExclamationTriangle />;
      case 'info': return <FaCalendarCheck />;
      case 'danger': return <FaExclamationTriangle />;
      default: return <FaCheckCircle />;
    }
  };

  useEffect(() => {
    // Map DB tasks to UI alert format whenever tasks change
    const mappedAlerts = tasks.map(t => ({
      id: t.id,
      type: t.type,
      title: t.title,
      message: t.description || '',
      icon: getIconForType(t.type)
    }));
    setAlerts(mappedAlerts);
  }, [tasks]);

  // Optional: Refresh data silently on mount to ensure freshness
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Redirect Super Admin (Placed after all hooks)
  if ((user?.role as string) === 'super_admin') {
    return <Navigate to="/admin" replace />;
  }

  // Medico Dashboard (Placed after all hooks)
  if (user?.role === 'medico') {
    return (
      <>
        <GuidedTour />
        <MedicoDashboard />
      </>
    );
  }

  const handleCreateSticky = async () => {
    if (!newStickyContent.trim()) return;
    const note = await stickiesService.createSticky(newStickyContent, newStickyColor);
    if (note) {
      updateStickies();
      handleCloseStickyModal();
      setNewStickyContent('');
      setNewStickyColor('yellow');
    }
  };

  const handleDeleteSticky = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Borrar esta nota?')) return;
    const success = await stickiesService.deleteSticky(id);
    if (success) {
      updateStickies();
    }
  };

  const removeAlert = async (id: string, action: 'done' | 'dismissed') => {
    // Optimistic update
    setAlerts(prev => prev.filter(a => a.id !== id));
    const success = await tasksService.updateStatus(id, action);
    if (success) {
      updateTasks();
    } else {
      refreshData(); // Revert on failure
    }
  };

  const handleAction = (id: any, action: 'done' | 'dismissed') => {
    removeAlert(id, action);
  };

  const activeCrops = crops.filter(c => c.status === 'active');

  // Helper to calculate days since start (Stage mockup)


  if (isLoading) {
    return <LoadingSpinner text="Cargando panel..." fullScreen duration={3000} />;
  }

  return (
    <Container>
      <GuidedTour />
      <WelcomeHeader className="tour-welcome">
        <h1>Hola, {user?.name || 'Cultivador'}, ¿qué vamos a hacer hoy?</h1>
        <DateDisplay>
          <FaCalendarCheck />
          {format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          <span className="separator">|</span>
          <FaClock />
          {format(currentTime, "HH:mm")}
        </DateDisplay>
      </WelcomeHeader>

      <StickyBoard>
        <SectionTitle><FaStickyNote /> Tablero de Notas (Stick-it)</SectionTitle>
        <StickyGrid>
          {stickies.map(note => (
            <StickyNoteCard key={note.id} color={note.color}>
              <div className="content">{note.content}</div>
              <div className="footer">
                <span>{note.created_by || 'Anónimo'} • {new Date(note.created_at).toLocaleDateString()}</span>
                <button className="delete-btn" onClick={(e) => handleDeleteSticky(note.id, e)}><FaTrash /></button>
              </div>
            </StickyNoteCard>
          ))}
          <AddStickyParams onClick={() => setIsStickyModalOpen(true)}>
            <DashedCircle className="dashed-circle">
              <FaPlus size={20} />
            </DashedCircle>
            <span style={{ marginTop: '1rem', fontWeight: 600 }}>Nueva Nota</span>
          </AddStickyParams>
        </StickyGrid>
      </StickyBoard>

      {/* Sticky Modal */}
      {isStickyModalOpen && (
        <ModalOverlay $isClosing={isClosingStickyModal} onClick={handleCloseStickyModal}>
          <ModalContent $isClosing={isClosingStickyModal} onClick={e => e.stopPropagation()}>
            <h3><FaStickyNote style={{ color: '#4ade80' }} /> Nueva Nota Adhesiva</h3>
            <ColorPicker>
              {['yellow', 'blue', 'pink', 'green'].map(c => (
                <ColorOption
                  key={c}
                  color={c}
                  selected={newStickyColor === c}
                  onClick={() => setNewStickyColor(c as any)}
                />
              ))}
            </ColorPicker>
            <textarea
              placeholder="Escribe tu recordatorio aquí..."
              value={newStickyContent}
              onChange={e => setNewStickyContent(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={handleCloseStickyModal}>Cancelar</Button>
              <Button onClick={handleCreateSticky}>Pegar Nota</Button>
            </div>
          </ModalContent>
        </ModalOverlay>
      )}

      <WeatherWidget />

      {/* Stage Countdowns */}
      {rooms.some(r => (r.type === 'vegetation' || r.type === 'flowering') && r.start_date) && (
        <StickyBoard>
          <SectionTitle><FaClock style={{ color: '#805ad5' }} /> Próximos Cambios de Etapa</SectionTitle>
          <CountdownGrid>
            {rooms
              .filter(r => (r.type === 'vegetation' || r.type === 'flowering') && r.start_date)
              .map(room => {
                // Calculation Logic
                const startDate = new Date(room.start_date!);
                const activeBatch = room.batches?.find(b => b.genetic); // Heuristic: use first batch with genetic info
                const genetic = activeBatch?.genetic;

                // Defaults if no genetic info (fallback to standard 4 weeks veg / 9 weeks flora)
                const vegWeeks = genetic?.vegetative_weeks || 4;
                const floraWeeks = genetic?.flowering_weeks || 9;

                let totalDays = 0;

                if (room.type === 'vegetation') {
                  totalDays = vegWeeks * 7;
                } else {
                  totalDays = floraWeeks * 7;
                }

                const daysElapsed = differenceInDays(new Date(), startDate);
                const daysRemaining = totalDays - daysElapsed;
                const progress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));

                // ALERT LOGIC
                let alertLevel = 0;
                if (daysRemaining <= 3) alertLevel = 3;      // Heartbeat
                else if (daysRemaining <= 5) alertLevel = 2; // Red Border
                else if (daysRemaining <= 7) alertLevel = 1; // Red Badge only

                return (
                  <CountdownCard key={room.id} stage={room.type} $alertLevel={alertLevel}>
                    {/* Desktop View (Standard layout, hidden on mobile) */}
                    <div className="desktop-view">
                      <div className="header">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="room-name">{room.name}</span>
                          <span style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 500 }}>
                            {crops.find(c => c.id === room.spot_id)?.name || 'Sin Crop Asignado'}
                          </span>
                        </div>
                        <div className="active-badges">
                          {alertLevel >= 1 && (
                            <span className="warning-badge">
                              <FaExclamationTriangle /> Faltan {Math.max(0, daysRemaining)} días
                            </span>
                          )}
                          <span className="stage-badge">{room.type === 'vegetation' ? 'Vegetativo' : 'Floración'}</span>
                        </div>
                      </div>

                      <div className="countdown">
                        Van <span className="days">{daysElapsed}</span> días de {room.type === 'vegetation' ? 'Vegetativo' : 'Floración'}
                      </div>

                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#a0aec0', marginTop: '0.5rem', textAlign: 'right' }}>
                        Base: {genetic?.name || 'Genética Estándar'} ({room.type === 'vegetation' ? vegWeeks : floraWeeks} sem)
                      </div>
                    </div>

                    {/* Mobile View (Extremely compressed, hidden on desktop) */}
                    <div className="mobile-view">
                      <div className="m-row">
                        <span className="m-room">{room.name}</span>
                        <span className="m-separator">-</span>
                        <span className="m-crop">{crops.find(c => c.id === room.spot_id)?.name || 'Sin Crop'}</span>
                        <span className="m-separator">-</span>
                        <span className="m-stage">{room.type === 'vegetation' ? 'Vegetativo' : 'Floración'}</span>
                        <span className="m-separator">-</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <span className="m-days-number">{daysElapsed}</span>
                          <span className="m-days-text">/{totalDays} días</span>
                        </div>
                        <span className="m-separator">-</span>
                        <span className="m-genetic">{genetic?.name || 'Estándar'}</span>
                      </div>
                    </div>
                  </CountdownCard>
                );
              })}
          </CountdownGrid>
        </StickyBoard>
      )}

      <KPISection>
        <Link to="/crops" style={{ textDecoration: 'none', color: 'inherit' }}>
          <KPICard active>
            <div className="desktop-view">
              <div className="icon-wrapper"><FaSeedling /></div>
              <div className="label">Cultivos Activos</div>
              <div className="value">{activeCrops.length} <span className="unit">variedades</span></div>
              <div className="subtext"><FaChartLine /> En curso</div>
            </div>
            <div className="mobile-view">
              <div className="m-left">
                <div className="m-icon"><FaSeedling /></div>
                <div className="m-text-group">
                  <span className="m-label">Cultivos Activos</span>
                  <span className="m-subtext">En curso</span>
                </div>
              </div>
              <div className="m-value">
                {activeCrops.length} <span className="m-unit">var.</span>
              </div>
            </div>
          </KPICard>
        </Link>

        {/* Removed Temperature and Humidity cards as requested */}

        <KPICard alert={alerts.length > 0}>
          <div className="desktop-view">
            <div className="icon-wrapper"><FaExclamationTriangle /></div>
            <div className="label">Alertas</div>
            <div className="value">{alerts.length} <span className="unit">pendientes</span></div>
          </div>
          <div className="mobile-view">
            <div className="m-left">
              <div className="m-icon"><FaExclamationTriangle /></div>
              <div className="m-text-group">
                <span className="m-label">Alertas</span>
                <span className="m-subtext">{alerts.length > 0 ? 'Requieren atención' : 'Todo al día'}</span>
              </div>
            </div>
            <div className="m-value">
              {alerts.length} <span className="m-unit">pend.</span>
            </div>
          </div>

        </KPICard>
      </KPISection>






      <ContentGrid>


        <div>
          <SectionTitle><FaExclamationTriangle /> Alertas & Tareas</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {alerts.map(alert => (
              <AlertItem key={alert.id} style={alert.type === 'info' ? { background: '#ebf8ff', borderLeftColor: '#4299e1' } : {}}>
                <div className="icon" style={alert.type === 'info' ? { color: '#4299e1' } : {}}>{alert.icon}</div>
                <div className="content">
                  <h5 style={alert.type === 'info' ? { color: '#2b6cb0' } : {}}>{alert.title}</h5>
                  <p style={alert.type === 'info' ? { color: '#2c5282' } : {}}>{alert.message}</p>
                </div>
                <AlertActions>
                  <ActionButtonSmall type="success" onClick={() => handleAction(alert.id, 'done')} title="Marcar como realizado">
                    <FaCheck />
                  </ActionButtonSmall>
                  <ActionButtonSmall type="danger" onClick={() => handleAction(alert.id, 'dismissed')} title="Descartar">
                    <FaTrash />
                  </ActionButtonSmall>
                </AlertActions>

              </AlertItem>
            ))}

            {alerts.length === 0 && (
              <EmptyStateCard>
                <FaCheckCircle className="icon" />
                <p>¡Todo al día!</p>
              </EmptyStateCard>
            )}


          </div>
        </div>
      </ContentGrid>
    </Container>
  );
};

export default Dashboard;
