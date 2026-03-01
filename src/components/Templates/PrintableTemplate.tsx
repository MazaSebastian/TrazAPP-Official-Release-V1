import React from 'react';
import styled from 'styled-components';
import { ClinicalTemplate } from '../../services/templatesService';

const PrintContainer = styled.div`
  @media print {
    /* Hard reset to guarantee purely white/black high contrast */
    background: white !important;
    color: black !important;
    width: 210mm;
    min-height: 297mm;
    padding: 20mm;
    margin: 0;
    font-family: Arial, sans-serif;
    page-break-after: always;
    box-sizing: border-box;

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-shadow: none !important;
      text-shadow: none !important;
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
  align-items: flex-end;
  border-bottom: 2px solid black;
  padding-bottom: 10px;
  margin-bottom: 20px;
`;

const TitleBox = styled.div`
  h1 {
    font-size: 24pt;
    font-weight: bold;
    margin: 0 0 5px 0;
    text-transform: uppercase;
  }
  p {
    margin: 0;
    font-size: 11pt;
    color: #333 !important;
  }
`;

const MetaDataBox = styled.div`
  text-align: right;
  font-size: 9pt;
  color: #555 !important;
  div {
    margin-bottom: 3px;
  }
`;

const PatientSection = styled.div`
  border: 1px solid black;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;
  
  .title {
    font-weight: bold;
    font-size: 12pt;
    margin-bottom: 10px;
    border-bottom: 1px solid #ccc;
    padding-bottom: 5px;
  }

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
      color: #666 !important;
      font-weight: normal;
    }
  }

  .content {
    border: 1px solid #999;
    border-radius: 4px;
    min-height: 40px;
    padding: 10px;
    font-size: 10pt;
    color: #444 !important;
    background: #fafafa !important;
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
        border: 1px solid black;
        border-radius: 2px;
      }
    }
  }
`;

const FooterBox = styled.div`
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid black;
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
}

export const PrintableTemplate = React.forwardRef<HTMLDivElement, PrintableTemplateProps>(
    ({ template }, ref) => {
        return (
            <PrintContainer ref={ref}>
                <Header>
                    <TitleBox>
                        <h1>{template.name}</h1>
                        {template.description && <p>{template.description}</p>}
                    </TitleBox>
                    <MetaDataBox>
                        <div><strong>TrazAPP - Sistema Clínico</strong></div>
                        <div>Fecha: {new Date().toLocaleDateString()}</div>
                        <div>ID Doc: {template.id.slice(0, 8).toUpperCase()}</div>
                    </MetaDataBox>
                </Header>

                <PatientSection>
                    <div className="title">Datos del Paciente</div>
                    <div className="grid">
                        <div className="field"><strong>Nombre:</strong><div className="line" /></div>
                        <div className="field"><strong>DNI/REPROCANN:</strong><div className="line" /></div>
                        <div className="field"><strong>Fecha Nac.:</strong><div className="line" /></div>
                        <div className="field"><strong>Firma:</strong><div className="line" /></div>
                    </div>
                </PatientSection>

                <FieldsSection>
                    {template.fields.map((field) => (
                        <FormField key={field.id}>
                            <div className="label">
                                <span>{field.label} {field.required && '*'}</span>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #ccc' }}>
                                    <span>0 (Sin Dolor)</span>
                                    <div style={{ display: 'flex', gap: '20px' }}>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                            <div key={n} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1px solid black' }} />
                                                <span style={{ fontSize: '8pt' }}>{n}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <span>10 (Máximo)</span>
                                </div>
                            ) : field.type === 'date' ? (
                                <div style={{ width: '150px', borderBottom: '1px solid black', paddingBottom: '5px' }}>
                                    DD / MM / AAAA
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
