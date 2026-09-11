import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled, { keyframes } from 'styled-components';
import { ChevronDown, Check, Search } from 'lucide-react';

const dropdownFadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const dropdownFadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(calc(-100% - 2.4rem)) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(calc(-100% - 2.8rem)) scale(1);
  }
`;

const SelectContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SelectTrigger = styled.div<{ $isOpen: boolean; $disabled?: boolean }>`
  width: 100%;
  padding: 0.7rem 0.95rem;
  border: 1px solid ${p => p.$isOpen ? 'rgba(16, 185, 129, 0.6)' : 'rgba(255, 255, 255, 0.12)'};
  border-radius: 0.65rem;
  font-size: 0.9rem;
  font-weight: 500;
  color: #f8fafc;
  background-color: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  cursor: ${p => p.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${p => p.$disabled ? 0.5 : 1};
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${p => p.$isOpen ? '0 0 0 3px rgba(16, 185, 129, 0.18)' : '0 1px 2px rgba(0, 0, 0, 0.2)'};
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: ${p => p.$disabled ? 'none' : 'auto'};
  box-sizing: border-box;

  &:hover {
    border-color: ${p => p.$disabled ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.22)'};
    background-color: rgba(15, 23, 42, 0.8);
  }

  .trigger-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${p => p.children ? '#f8fafc' : '#94a3b8'};
  }

  .chevron-icon {
    flex-shrink: 0;
    margin-left: 0.5rem;
    color: ${p => p.$isOpen ? '#34d399' : '#94a3b8'};
    transform: ${p => p.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), color 0.2s ease;
  }
`;

const DropdownMenu = styled.div<{ $coords: { top: number; left: number; width: number; isUpwards?: boolean } }>`
  position: fixed;
  top: ${p => p.$coords.top}px;
  left: ${p => p.$coords.left}px;
  width: ${p => p.$coords.width}px;
  margin-top: ${p => p.$coords.isUpwards ? '0' : '0.4rem'};
  transform: ${p => p.$coords.isUpwards ? 'translateY(calc(-100% - 2.8rem))' : 'none'};
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  visibility: ${p => p.$coords.width > 0 ? 'visible' : 'hidden'};
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.75rem;
  box-shadow: 0 20px 45px -10px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.06);
  z-index: 10005; /* Above modals (z-index 9999-10001) */
  max-height: 260px;
  padding: 0.35rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  box-sizing: border-box;
  animation: ${p => p.$coords.isUpwards ? dropdownFadeInUp : dropdownFadeIn} 0.16s cubic-bezier(0.16, 1, 0.3, 1);

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 3px;
  }
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.25);
  }
`;

const OptionItem = styled.div<{ $isSelected: boolean }>`
  padding: 0.6rem 0.85rem;
  margin-bottom: 2px;
  border-radius: 0.5rem;
  cursor: pointer;
  color: ${p => p.$isSelected ? '#34d399' : '#f1f5f9'};
  background-color: ${p => p.$isSelected ? 'rgba(16, 185, 129, 0.14)' : 'transparent'};
  font-size: 0.875rem;
  font-weight: ${p => p.$isSelected ? '600' : '450'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.15s ease;
  user-select: none;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover {
    background-color: ${p => p.$isSelected ? 'rgba(16, 185, 129, 0.22)' : 'rgba(255, 255, 255, 0.08)'};
    color: ${p => p.$isSelected ? '#34d399' : '#ffffff'};
  }

  .option-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-right: 0.5rem;
  }

  .check-icon {
    flex-shrink: 0;
    color: #34d399;
  }
`;

const GroupLabel = styled.div<{ $isSearchable?: boolean }>`
  padding: 0.45rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #94a3b8;
  background: rgba(2, 6, 23, 0.4);
  border-radius: 0.375rem;
  margin: 0.25rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: sticky;
  top: ${p => p.$isSearchable ? '48px' : '0'};
  z-index: 10;
`;

const HiddenSelect = styled.select`
  display: none;
`;

const SearchInputContainer = styled.div`
  padding: 0.4rem 0.5rem 0.5rem 0.5rem;
  position: sticky;
  top: 0;
  background: rgba(15, 23, 42, 0.98);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 20;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;

  .search-icon {
    color: #64748b;
    flex-shrink: 0;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.45rem 0.65rem;
  background: rgba(30, 41, 59, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.45rem;
  color: #f8fafc;
  font-size: 0.85rem;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: rgba(16, 185, 129, 0.6);
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
  }

  &::placeholder {
    color: #64748b;
  }
`;

const NoResults = styled.div`
  padding: 0.85rem 1rem;
  color: #94a3b8;
  text-align: center;
  font-size: 0.85rem;
`;

export interface Option {
  value: string;
  label: string;
  group?: string;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  triggerStyle?: React.CSSProperties;
  disabled?: boolean;
  isSearchable?: boolean;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Seleccionar...",
  triggerStyle,
  disabled = false,
  isSearchable = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, isUpwards: false });
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  const updatePosition = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      const needsUpwards = spaceBelow < 260 && spaceAbove > spaceBelow;

      setCoords({
        top: needsUpwards ? rect.top : rect.bottom,
        left: rect.left,
        width: rect.width,
        isUpwards: needsUpwards
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const timeoutId = setTimeout(updatePosition, 10);
      return () => clearTimeout(timeoutId);
    } else {
      setCoords({ top: 0, left: 0, width: 0, isUpwards: false });
    }
  }, [isOpen]);

  const toggleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      const timeoutId = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isSearchable]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && containerRef.current.contains(event.target as Node)) {
        return;
      }
      if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };

    const handleScroll = (event: Event) => {
      if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
        return;
      }
      updatePosition();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside, { capture: true });
      window.addEventListener('scroll', handleScroll, { capture: true });
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, { capture: true });
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const filteredOptions = options.filter(opt => {
    const matchesLabel = opt.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = opt.group ? opt.group.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    return matchesLabel || matchesGroup;
  });

  return (
    <SelectContainer ref={containerRef} className={className}>
      <SelectTrigger $isOpen={isOpen} $disabled={disabled} onClick={toggleOpen} style={triggerStyle}>
        <span className="trigger-label">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={16} className="chevron-icon" />
      </SelectTrigger>

      {isOpen && ReactDOM.createPortal(
        <DropdownMenu
          ref={dropdownRef}
          $coords={coords}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {isSearchable && (
            <SearchInputContainer>
              <Search size={14} className="search-icon" />
              <SearchInput
                ref={searchInputRef}
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </SearchInputContainer>
          )}
          {(() => {
            if (filteredOptions.length === 0) {
              return <NoResults>No se encontraron resultados</NoResults>;
            }

            const hasGroups = filteredOptions.some(opt => opt.group);

            if (!hasGroups) {
              return filteredOptions.map(option => {
                const isSelected = option.value === value;
                return (
                  <OptionItem
                    key={option.value}
                    $isSelected={isSelected}
                    onMouseDown={() => handleSelect(option.value)}
                  >
                    <span className="option-label">{option.label}</span>
                    {isSelected && <Check size={15} className="check-icon" />}
                  </OptionItem>
                );
              });
            }

            const grouped = filteredOptions.reduce((acc, opt) => {
              const groupName = opt.group || 'Sin Grupo';
              if (!acc[groupName]) acc[groupName] = [];
              acc[groupName].push(opt);
              return acc;
            }, {} as Record<string, Option[]>);

            return Object.entries(grouped).map(([groupName, groupOptions]) => (
              <React.Fragment key={groupName}>
                <GroupLabel $isSearchable={isSearchable}>{groupName}</GroupLabel>
                {groupOptions.map(option => {
                  const isSelected = option.value === value;
                  return (
                    <OptionItem
                      key={option.value}
                      $isSelected={isSelected}
                      onMouseDown={() => handleSelect(option.value)}
                      style={{ paddingLeft: '1.5rem' }}
                    >
                      <span className="option-label">{option.label}</span>
                      {isSelected && <Check size={15} className="check-icon" />}
                    </OptionItem>
                  );
                })}
              </React.Fragment>
            ));
          })()}
        </DropdownMenu>,
        document.body
      )}

      <HiddenSelect value={value} onChange={e => onChange(e.target.value)} tabIndex={-1}>
        {(() => {
          const hasGroups = options.some(opt => opt.group);
          if (!hasGroups) {
            return options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ));
          }

          const grouped = options.reduce((acc, opt) => {
            const groupName = opt.group || 'Sin Grupo';
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(opt);
            return acc;
          }, {} as Record<string, Option[]>);

          return Object.entries(grouped).map(([groupName, groupOptions]) => (
            <optgroup key={groupName} label={groupName}>
              {groupOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </optgroup>
          ));
        })()}
      </HiddenSelect>
    </SelectContainer>
  );
};
