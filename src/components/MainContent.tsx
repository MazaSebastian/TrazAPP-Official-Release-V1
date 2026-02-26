import styled from 'styled-components';

export const MainContent = styled.main`
  margin-left: 260px;
  padding: 2rem;
  min-height: 100vh;
  background-color: transparent; /* Inherits global dark theme #020617 */
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding: 1rem;
    padding-top: calc(5rem + env(safe-area-inset-top)); /* Space for MobileHeader */
  }
`;
