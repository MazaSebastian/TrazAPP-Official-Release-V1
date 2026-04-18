import React from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { ClinicalTemplate } from '../../services/templatesService';

const GlobalPrintStyle = createGlobalStyle`
  @media print {
    html, body, #root, .App, [class*="layout"], [class*="container"], main, section {
      background-color: white !important;
      background-image: none !important;
      color: black !important;
    }
    
    div {
      background-color: transparent !important;
    }
    
    .printable-template, .printable-template * {
      background-color: white !important;
      color: black !important;
    }
  }
`;

const PrintContainer = styled.div`
  @media print {
    /* Hard reset to guarantee purely white/black high contrast */
    background: white !important;
    color: black !important;
    width: 210mm;
    min-height: 297mm;
    padding: 10mm; /* Reduced padding from 20mm */
    margin: 0;
    font-family: 'Inter', sans-serif;
    page-break-after: always;
    box-sizing: border-box;

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-shadow: none !important;
      text-shadow: none !important;
      color: black !important;
    }
  }

  /* Hidden for screen presentation (the react-to-print hook handles iframe mounting) */
  display: none;
  
  @media print {
    display: block;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid black;
  padding-bottom: 10px;
  margin-bottom: 20px;
`;

const TitleBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  h1 {
    font-size: 20pt;
    font-weight: 800;
    margin: 0 0 5px 0;
    text-transform: uppercase;
  }
  p {
    margin: 0;
    font-size: 11pt;
    color: black !important;
  }
`;

const MetaDataBox = styled.div`
  text-align: right;
  font-size: 9pt;
  color: black !important;
  div {
    margin-bottom: 3px;
  }
`;

const SectionTitle = styled.h3`
  font-size: 14pt;
  margin: 0 0 10px 0;
  font-weight: 800;
  text-transform: uppercase;
  border-bottom: 2px solid black;
  padding-bottom: 4px;
`;

const PatientSection = styled.div`
  margin-bottom: 20px;

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .field {
    display: flex;
    gap: 10px;
    align-items: baseline;
    font-size: 11pt;
    
    strong {
      min-width: 80px;
      font-weight: bold;
    }
    
    .line {
      flex: 1;
      border-bottom: 1px dotted black;
    }
  }
`;

const FieldsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormField = styled.div`
  break-inside: avoid;
  
  .label {
    font-weight: bold;
    font-size: 11pt;
    margin-bottom: 8px;
    display: flex;
    justify-content: space-between;
    
    .req {
      font-size: 8pt;
      color: black !important;
      font-weight: normal;
    }
  }

  .content {
    border: 1px solid black;
    border-radius: 2px;
    min-height: 40px;
    padding: 10px;
    font-size: 10pt;
    color: black !important;
    background: transparent !important;
  }
  
  .textarea-content {
    min-height: 100px;
  }

  .options-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-top: 5px;
    
    .checkbox-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 10pt;
      
      .box {
        width: 14px;
        height: 14px;
        border: 2px solid black;
        border-radius: 2px;
      }
    }
  }
`;

const FooterBox = styled.div`
  margin-top: 40px;
  padding-top: 20px;
  border-top: 2px solid black;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-size: 9pt;

  .signature {
    width: 200px;
    border-top: 1px dotted black;
    text-align: center;
    padding-top: 5px;
    margin-top: 40px;
  }
`;

interface PrintableTemplateProps {
  template: ClinicalTemplate;
  forPdf?: boolean;
}

export const PrintableTemplate = React.forwardRef<HTMLDivElement, PrintableTemplateProps>(
  ({ template, forPdf }, ref) => {
    return (
      <PrintContainer
        ref={ref}
        className="printable-template"
        style={forPdf ? {
          display: 'block',
          background: 'white',
          color: 'black',
          width: '210mm',
          minHeight: '297mm',
          padding: '10mm',
          fontFamily: "'Inter', sans-serif",
          boxSizing: 'border-box' as const,
        } : undefined}
      >
        <GlobalPrintStyle />
        <Header>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <img src="/trazapphorizontal.png" alt="TrazApp Logo" style={{ height: '35px', width: 'auto' }} />
            <TitleBox>
              <h1>{template.name}</h1>
              {template.description && <p>{template.description}</p>}
            </TitleBox>
          </div>
          <MetaDataBox>
            <div><strong>TrazAPP - Sistema Clínico</strong></div>
            <div>Fecha: {new Date().toLocaleDateString()}</div>
            <div>ID Doc: {template.id.slice(0, 8).toUpperCase()}</div>
          </MetaDataBox>
        </Header>

        <PatientSection>
          <SectionTitle>Datos del Paciente</SectionTitle>
          <div className="grid">
            <div className="field"><strong>Nombre:</strong><div className="line" /></div>
            <div className="field"><strong>DNI/REPROCANN:</strong><div className="line" /></div>
            <div className="field"><strong>Fecha Nac.:</strong><div className="line" /></div>
            <div className="field"><strong>Firma:</strong><div className="line" /></div>
          </div>
        </PatientSection>

        <FieldsSection>
          <SectionTitle>Datos Clínicos</SectionTitle>
          {template.fields.map((field) => (
            <FormField key={field.id}>
              <div className="label">
                <span>
                  {field.label} {field.required && '*'}
                  {field.type === 'date' && (
                    <span style={{ fontWeight: 'normal', marginLeft: '8px' }}>(DD / MM / AAAA)</span>
                  )}
                </span>
                {field.required && <span className="req">(Requerido)</span>}
              </div>

              {field.type === 'textarea' ? (
                <div className="content textarea-content"></div>
              ) : field.type === 'select' || field.type === 'checkbox' ? (
                <div className="options-grid">
                  {field.options?.map((opt, i) => (
                    <div key={i} className="checkbox-item">
                      <div className="box" />
                      <span>{opt}</span>
                    </div>
                  ))}
                  <div className="checkbox-item">
                    <div className="box" />
                    <span>Otro: ____________</span>
                  </div>
                </div>
              ) : field.type === 'eva' ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid black' }}>
                  <span>0 (Sin Dolor)</span>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid black' }} />
                        <span style={{ fontSize: '8pt', fontWeight: 'bold' }}>{n}</span>
                      </div>
                    ))}
                  </div>
                  <span>10 (Máximo)</span>
                </div>
              ) : field.type === 'date' ? (
                <div style={{ width: '150px', borderBottom: '1px solid black', paddingBottom: '5px', height: '20px' }}>
                </div>
              ) : (
                <div className="content"></div>
              )}
            </FormField>
          ))}
        </FieldsSection>

        <FooterBox>
          <div>
            Documento generado vía TrazAPP.<br />
            Uso exclusivo médico-paciente.
          </div>
          <div className="signature">
            Firma y Sello del Profesional
          </div>
        </FooterBox>
      </PrintContainer>
    );
  }
);
