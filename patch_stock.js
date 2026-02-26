const fs = require('fs');
const file = 'src/pages/Stock.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add hook
content = content.replace(
  "  const clearFilters = () => {",
  `  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Close ActionMenu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      // Very simple way to close menu if clicking anywhere else
      if (!(e.target as Element).closest('button[title="Opciones"]')) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const clearFilters = () => {`
);

// 2. Add styled components and update table dimensions
content = content.replace(
  "  tr:last-child td {\n    border-bottom: none;\n  }\n`;",
  `  tr:last-child td {
    border-bottom: none;
  }

  @media (max-width: 768px) {
    th, td {
      padding: 0.75rem 0.5rem;
      font-size: 0.75rem;
    }
  }
\`;`
);

content = content.replace(
  "const MainTable = styled.table`\n  width: 100%;\n  min-width: 900px;\n  border-collapse: collapse;\n\n  th {\n    padding: 1rem;\n    text-align: left;\n    background: rgba(30, 41, 59, 0.6);\n    color: #94a3b8;\n    font-weight: 600;\n    font-size: 0.875rem;\n    border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n  }\n\n  td {\n    padding: 1rem;\n    border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n    color: #cbd5e1;\n    vertical-align: middle;\n  }",
  `const MainTable = styled.table\`
  width: 100%;
  min-width: 500px;
  border-collapse: collapse;

  th {
    padding: 1rem 0.75rem;
    text-align: left;
    background: rgba(30, 41, 59, 0.6);
    color: #94a3b8;
    font-weight: 600;
    font-size: 0.85rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  td {
    padding: 1rem 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: #cbd5e1;
    vertical-align: middle;
    font-size: 0.85rem;
  }`
);

content = content.replace(
  "  td {\n    padding: 0.75rem 1rem;\n    font-size: 0.9rem;\n    border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n    color: #e2e8f0;\n  }",
  `  td {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
  }`
);

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


// 3. MainTable items
content = content.replace(
  /<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>\s*<IconButton onClick={\(e\) => { e\.stopPropagation\(\); handleGroupDispense\(item\.strain\); }} title="Dispensar todos">\s*<FaHandHoldingMedical \/>\s*<\/IconButton>\s*<IconButton color="#3182ce" onClick={\(e\) => {[^}]*\}\} title="Editar genética de todos">\s*<FaEdit \/>\s*<\/IconButton>\s*<IconButton color="#805ad5" onClick={\(e\) => {[^}]*\}\} title="Enviar a Laboratorio agrupado">\s*<FaFlask \/>\s*<\/IconButton>\s*<IconButton color="#e53e3e" onClick={\(e\) => {[^}]*\}\} title="Eliminar todos">\s*<FaTrash \/>\s*<\/IconButton>\s*<\/div>/g,
  `<ActionMenuContainer onClick={(e) => e.stopPropagation()}>
                          <ActionMenuToggle onClick={() => setOpenActionMenuId(openActionMenuId === item.strain ? null : item.strain)} title="Opciones">
                            <span style={{ fontSize: '1.2rem', lineHeight: 0, paddingBottom: '4px' }}>...</span>
                          </ActionMenuToggle>
                          <ActionMenuDropdown $isOpen={openActionMenuId === item.strain}>
                            <ActionMenuItem $color="#4ade80" onClick={() => {
                              setOpenActionMenuId(null);
                              handleGroupDispense(item.strain);
                            }}>
                              <FaHandHoldingMedical /> Dispensar
                            </ActionMenuItem>
                            <ActionMenuItem $color="#38bdf8" onClick={() => {
                              setOpenActionMenuId(null);
                              showToast("Edición masiva de genética próximamente.", 'info');
                            }}>
                              <FaEdit /> Editar Genética
                            </ActionMenuItem>
                            <ActionMenuItem $color="#a855f7" onClick={() => {
                              setOpenActionMenuId(null);
                              openGroupLabTransfer(item.strain);
                            }}>
                              <FaFlask /> Enviar a Laboratorio
                            </ActionMenuItem>
                            <ActionMenuItem $color="#f87171" onClick={() => {
                              setOpenActionMenuId(null);
                              setDeleteData({ batch: { strain_name: item.strain }, reason: '', isBulk: true });
                              setIsDeleteOpen(true);
                            }}>
                              <FaTrash /> Eliminar Todos
                            </ActionMenuItem>
                          </ActionMenuDropdown>
                        </ActionMenuContainer>`
);

// 4. DetailTable items
content = content.replace(
  /<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>\s*<IconButton color="#3182ce" onClick={\(e\) => { e\.stopPropagation\(\); openEdit\(batch\); }} title="Editar">\s*<FaEdit \/>\s*<\/IconButton>\s*<IconButton color="#e53e3e" onClick={\(e\) => { e\.stopPropagation\(\); initDelete\(batch\); }} title="Eliminar">\s*<FaTrash \/>\s*<\/IconButton>\s*<\/div>/g,
  `<ActionMenuContainer onClick={(e) => e.stopPropagation()}>
                                          <ActionMenuToggle onClick={() => setOpenActionMenuId(openActionMenuId === batch.id ? null : batch.id)} title="Opciones">
                                            <span style={{ fontSize: '1.2rem', lineHeight: 0, paddingBottom: '4px' }}>...</span>
                                          </ActionMenuToggle>
                                          <ActionMenuDropdown $isOpen={openActionMenuId === batch.id}>
                                            <ActionMenuItem $color="#38bdf8" onClick={() => {
                                              setOpenActionMenuId(null);
                                              openEdit(batch);
                                            }}>
                                              <FaEdit /> Editar Lote
                                            </ActionMenuItem>
                                            <ActionMenuItem $color="#f87171" onClick={() => {
                                              setOpenActionMenuId(null);
                                              initDelete(batch);
                                            }}>
                                              <FaTrash /> Eliminar Lote
                                            </ActionMenuItem>
                                          </ActionMenuDropdown>
                                        </ActionMenuContainer>`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Stock patches applied!');
