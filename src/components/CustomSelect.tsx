import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import { FaChevronDown } from 'react-icons/fa';

const SelectContainer = styled.div`
  position: relative;
  width: 100%;
`;

const SelectTrigger = styled.div<{ $isOpen: boolean; $disabled?: boolean }>`
  width: 100%;
  padding: 0.75rem;
  padding-right: 2.5rem;
  border: 1px solid ${p => p.$isOpen ? '#4ade80' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 0.5rem;
  font-size: 1rem;
  color: #f8fafc;
  background-color: rgba(30, 41, 59, 0.5);
  cursor: ${p => p.$disabled ? 'not-allowed' : 'pointer'};
  opacity: ${p => p.$disabled ? 0.5 : 1};
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${p => p.$isOpen ? '0 0 0 3px rgba(74, 222, 128, 0.1)' : 'none'};
  transition: all 0.2s;
  pointer-events: ${p => p.$disabled ? 'none' : 'auto'};

  &:hover {
    border-color: ${p => p.$disabled ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const DropdownMenu = styled.div<{ $coords: { top: number; left: number; width: number; isUpwards?: boolean } }>`
  position: fixed;
  top: ${p => p.$coords.top}px;
  left: ${p => p.$coords.left}px;
  width: ${p => p.$coords.width}px;
  margin-top: ${p => p.$coords.isUpwards ? '0' : '0.5rem'};
  transform: ${p => p.$coords.isUpwards ? 'translateY(calc(-100% - 3rem))' : 'none'};
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(16px);
  visibility: ${p => p.$coords.width > 0 ? 'visible' : 'hidden'};
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  z-index: 10005; /* Higher z-index to sit on top of everything, including modals (10001) */
  max-height: 250px;
  overflow-y: auto;
  overscroll-behavior: contain;
  animation: fadeIn 0.1s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: ${p => p.$coords.isUpwards ? 'translateY(calc(-100% - 2.5rem))' : 'translateY(-5px)'}; }
    to { opacity: 1; transform: ${p => p.$coords.isUpwards ? 'translateY(calc(-100% - 3rem))' : 'translateY(0)'}; }
  }
`;

const OptionItem = styled.div<{ $isSelected: boolean }>`
  padding: 0.75rem 1rem;
  cursor: pointer;
  color: ${p => p.$isSelected ? '#4ade80' : '#f8fafc'};
  background-color: ${p => p.$isSelected ? 'rgba(74, 222, 128, 0.1)' : 'transparent'};
  font-weight: ${p => p.$isSelected ? '600' : '400'};
  transition: background-color 0.1s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #4ade80;
  }
`;

const GroupLabel = styled.div<{ $isSearchable?: boolean }>`
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: #94a3b8;
  background: rgba(0, 0, 0, 0.2);
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
  padding: 0.5rem;
  position: sticky;
  top: 0;
  background: rgba(15, 23, 42, 0.95);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 20;
  box-sizing: border-box;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.375rem;
  color: #f8fafc;
  font-size: 0.875rem;
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: #4ade80;
    box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.1);
  }

  &::placeholder {
    color: #64748b;
  }
`;

const NoResults = styled.div`
  padding: 0.75rem 1rem;
  color: #64748b;
  text-align: center;
  font-size: 0.9rem;
`;

interface Option {
    value: string;
    label: string;
    group?: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    triggerStyle?: React.CSSProperties;
    disabled?: boolean;
    isSearchable?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    value,
    onChange,
    options,
    placeholder = "Seleccionar...",
    triggerStyle,
    disabled = false,
    isSearchable = false
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
            
            // Assume dropdown needs max 250px.
            const needsUpwards = spaceBelow < 250 && spaceAbove > spaceBelow;
            
            setCoords({
                top: needsUpwards ? rect.top : rect.bottom, // Wait for render to adjust translated Y if upward
                left: rect.left,
                width: rect.width,
                isUpwards: needsUpwards
            });
        }
    };

    // Calculate position immediately upon opening
    useEffect(() => {
        if (isOpen) {
            updatePosition();
            // Short delay to ensure layout shifts are captured
            const timeoutId = setTimeout(updatePosition, 10);
            return () => clearTimeout(timeoutId);
        } else {
            // Reset coords to hide it immediately when closed to avoid glitch on next open
            setCoords({ top: 0, left: 0, width: 0, isUpwards: false });
        }
    }, [isOpen]);

    const toggleOpen = () => {
        if (!disabled) {
            setIsOpen(!isOpen);
        }
    };

    // Reset search term when dropdown closes
    useEffect(() => {
        if (!isOpen) {
            setSearchTerm('');
        }
    }, [isOpen]);

    // Auto-focus search input when opening
    useEffect(() => {
        if (isOpen && isSearchable && searchInputRef.current) {
            const timeoutId = setTimeout(() => {
                searchInputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timeoutId);
        }
    }, [isOpen, isSearchable]);

    // Close when clicking outside - Updated to handle Portal clicks
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // If clicking inside the container, do nothing (trigger handles it)
            if (containerRef.current && containerRef.current.contains(event.target as Node)) {
                return;
            }
            // If clicking inside the portal dropdown
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
                return;
            }
            setIsOpen(false);
        };

        const handleScroll = (event: Event) => {
            // If scrolling inside the dropdown, do nothing logic-wise (position doesn't change)
            if (dropdownRef.current && dropdownRef.current.contains(event.target as Node)) {
                return;
            }
            // If scrolling outside (window/modal), update position to stay attached
            updatePosition();
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside, { capture: true });
            // Update coords on scroll/resize to prevent detachment
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

    // Filter options based on search term (matching label or group name)
    const filteredOptions = options.filter(opt => {
        const matchesLabel = opt.label.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGroup = opt.group ? opt.group.toLowerCase().includes(searchTerm.toLowerCase()) : false;
        return matchesLabel || matchesGroup;
    });

    return (
        <SelectContainer ref={containerRef}>
            <SelectTrigger $isOpen={isOpen} $disabled={disabled} onClick={toggleOpen} style={triggerStyle}>
                <span>{selectedOption ? selectedOption.label : placeholder}</span>
                <FaChevronDown size={12} color="#94a3b8" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </SelectTrigger>

            {isOpen && ReactDOM.createPortal(
                <DropdownMenu
                    ref={dropdownRef}
                    $coords={coords}
                    onMouseDown={(e) => e.stopPropagation()} // Prevent closing when clicking scrollbar/empty space in dropdown
                >
                    {isSearchable && (
                        <SearchInputContainer>
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
                            return filteredOptions.map(option => (
                                <OptionItem
                                    key={option.value}
                                    $isSelected={option.value === value}
                                    onMouseDown={() => handleSelect(option.value)}
                                >
                                    {option.label}
                                </OptionItem>
                            ));
                        }

                        // Group Options
                        const grouped = filteredOptions.reduce((acc, opt) => {
                            const groupName = opt.group || 'Sin Grupo';
                            if (!acc[groupName]) acc[groupName] = [];
                            acc[groupName].push(opt);
                            return acc;
                        }, {} as Record<string, Option[]>);

                        return Object.entries(grouped).map(([groupName, groupOptions]) => (
                            <React.Fragment key={groupName}>
                                <GroupLabel $isSearchable={isSearchable}>{groupName}</GroupLabel>
                                {groupOptions.map(option => (
                                    <OptionItem
                                        key={option.value}
                                        $isSelected={option.value === value}
                                        onMouseDown={() => handleSelect(option.value)}
                                        style={{ paddingLeft: '2rem' }} // Indent items in groups
                                    >
                                        {option.label}
                                    </OptionItem>
                                ))}
                            </React.Fragment>
                        ));
                    })()}
                </DropdownMenu>,
                document.body
            )}

            {/* Hidden native select for form data/accessibility fallback if needed later */}
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
