const fs = require('fs');
const file = 'src/pages/Stock.tsx';
let content = fs.readFileSync(file, 'utf8');

const actionMenuCSS = `\nconst ActionMenuContainer = styled.div\`
  position: relative;
  display: inline-block;
\`;

const ActionMenuToggle = styled.button\`
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  width: 32px;
  height: 32px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  backdrop-filter: blur(8px);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
  }
\`;

const ActionMenuDropdown = styled.div<{ $isOpen: boolean }>\`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  min-width: 180px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(12px);
  z-index: 50;
  display: \${props => props.$isOpen ? 'flex' : 'none'};
  flex-direction: column;
  padding: 0.5rem 0;
  animation: fadeIn 0.2s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
  }
\`;

const ActionMenuItem = styled.button<{ $color?: string }>\`
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: \${props => props.$color || '#cbd5e1'};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: background 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: \${props => props.$color || '#f8fafc'};
  }
\`;\n`;

content = content.replace("const FormGroup = styled.div`", actionMenuCSS + "\nconst FormGroup = styled.div`");

fs.writeFileSync(file, content, 'utf8');
console.log('ActionMenu styled components added!');
