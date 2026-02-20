import React from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import styled from 'styled-components';
import { es } from 'date-fns/locale';

// Register locale for Spanish
registerLocale('es', es);

const Wrapper = styled.div`
  width: 100%;
  
  /* Override styles to match app theme */
  .react-datepicker-wrapper {
    width: 100%;
  }

  .react-datepicker__input-container {
    width: 100%;

    input {
      width: 100%;
      padding: 0.75rem;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 0.5rem;
      font-size: 1rem;
      color: #f8fafc;
      transition: all 0.2s;

      &:focus {
        outline: none;
        border-color: #4ade80;
        box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.1);
      }
    }
  }

  /* Calendar Container */
  .react-datepicker {
    font-family: inherit;
    background: rgba(15, 23, 42, 0.95);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 0.75rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    overflow: hidden;
  }

  /* Header */
  .react-datepicker__header {
    background-color: transparent;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 1rem;
  }

  .react-datepicker__current-month {
    color: #f8fafc;
    font-weight: 700;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  .react-datepicker__day-name {
    color: #94a3b8;
    font-weight: 600;
    margin: 0.3rem;
  }

  /* Days */
  .react-datepicker__day {
    margin: 0.3rem;
    border-radius: 0.5rem;
    color: #cbd5e1;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: #4ade80;
    }
  }

  .react-datepicker__day--selected, 
  .react-datepicker__day--keyboard-selected {
    background: #4ade80;
    color: #020617;
    font-weight: 600;

    &:hover {
      background-color: #22c55e;
    }
  }

  .react-datepicker__day--today {
    font-weight: 700;
    border: 1px solid #4ade80;
    background-color: transparent;
    color: #4ade80;

    &.react-datepicker__day--selected {
      background: #4ade80;
      color: #020617;
      border: none;
    }
  }

  /* Navigation Arrows */
  .react-datepicker__navigation-icon::before {
    border-color: #718096;
  }
`;

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  dateFormat?: string;
  minDate?: Date;
  maxDate?: Date;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  selected,
  onChange,
  placeholderText = "Seleccionar fecha",
  dateFormat = "dd/MM/yyyy",
  minDate,
  maxDate
}) => {
  return (
    <Wrapper>
      <DatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholderText}
        dateFormat={dateFormat}
        minDate={minDate}
        maxDate={maxDate}
        locale="es"
        showPopperArrow={false}
      />
    </Wrapper>
  );
};
