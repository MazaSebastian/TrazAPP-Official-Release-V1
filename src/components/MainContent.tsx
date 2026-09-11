import React from 'react';
import styled from 'styled-components';
import { useSidebar } from './Sidebar/SidebarContext';

interface StyledMainProps {
  $isCollapsed: boolean;
}

const StyledMain = styled.main<StyledMainProps>`
  margin-left: ${props => props.$isCollapsed ? '72px' : '260px'};
  padding: 2rem;
  min-height: 100vh;
  background-color: transparent; /* Inherits global dark theme #020617 */
  transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding: 1rem;
    padding-top: calc(5rem + env(safe-area-inset-top)); /* Space for MobileHeader */
  }
`;

export const MainContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className, style }) => {
  const { isCollapsed } = useSidebar();

  return (
    <StyledMain $isCollapsed={isCollapsed} className={className} style={style}>
      {children}
    </StyledMain>
  );
};

export default MainContent;
