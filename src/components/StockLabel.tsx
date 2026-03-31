import React from 'react';
import styled from 'styled-components';

interface LabelSettings {
  themeMode: 'color' | 'bw';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  backgroundPattern: string;
  sidebarDesign?: 'solid' | 'gradient';
  showAddress: boolean;
  addressText: string;
  phoneText: string;
}

interface StockLabelProps {
  patientName: string;
  legajo: string;
  geneticName: string;
  weight: string;
  date?: string;
  organizationName: string;
  logoUrl?: string;
  settings?: LabelSettings;
}

const defaultSettings: LabelSettings = {
  themeMode: 'color',
  primaryColor: '#0f172a',
  secondaryColor: '#00ff88',
  fontFamily: 'Inter',
  backgroundPattern: 'none',
  sidebarDesign: 'solid',
  showAddress: false,
  addressText: '',
  phoneText: ''
};

// Contenedor estricto para impresión (10cm x 5cm aproximado apaisado)
const LabelContainer = styled.div<{ $settings: LabelSettings }>`
  width: 95mm;
  height: 55mm;
  background-color: ${props => props.$settings.themeMode === 'bw' ? '#ffffff' : '#ffffff'};
  color: ${props => props.$settings.themeMode === 'bw' ? '#000000' : props.$settings.primaryColor};
  font-family: ${props => props.$settings.fontFamily}, sans-serif;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  box-shadow: 0 0 10px rgba(0,0,0,0.1); /* Solo para preview, se quita al imprimir */

  /* Patrones de fondo opcionales (Solo Color) */
  ${props => props.$settings.themeMode === 'color' && `
    background-color: #ffffff;
  `}
  
  ${props => props.$settings.themeMode === 'color' && props.$settings.backgroundPattern === 'dots' && `
    background-image: radial-gradient(${props.$settings.primaryColor}20 1px, #ffffff 1px);
    background-size: 10px 10px;
  `}
  
  ${props => props.$settings.themeMode === 'color' && props.$settings.backgroundPattern === 'waves' && `
    background: repeating-linear-gradient(
      45deg,
      #ffffff,
      #ffffff 10px,
      ${props.$settings.primaryColor}10 10px,
      ${props.$settings.primaryColor}10 20px
    );
  `}

  @media print {
    box-shadow: none !important;
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
    page-break-inside: avoid;
    break-inside: avoid;
  }
`;

const BrandSidebar = styled.div<{ $settings: LabelSettings }>`
  width: 30%;
  background: ${props => {
    if (props.$settings.themeMode === 'bw') return 'transparent';
    if (props.$settings.sidebarDesign === 'gradient') {
      return `linear-gradient(135deg, ${props.$settings.primaryColor}, ${props.$settings.secondaryColor})`;
    }
    return props.$settings.primaryColor;
  }};
  border-right: ${props => props.$settings.themeMode === 'bw' ? '2px solid #000' : 'none'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 5mm;
  box-sizing: border-box;
`;

const ContentPanel = styled.div`
  width: 70%;
  padding: 5mm;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  background: transparent;
  z-index: 10;
`;

const LogoImage = styled.img<{ $bw: boolean }>`
  max-width: 100%;
  height: auto;
  max-height: 25mm;
  object-fit: contain;
  filter: ${props => props.$bw ? 'grayscale(100%) contrast(200%)' : 'none'};
`;

const FieldLine = styled.div<{ $settings: LabelSettings }>`
  margin-bottom: 2.5mm;
  font-size: 11pt;
  display: flex;
  align-items: baseline;
  gap: 2mm;

  .label {
    font-size: 8pt;
    font-weight: 600;
    text-transform: uppercase;
    color: ${props => props.$settings.themeMode === 'bw' ? '#666' : '#64748b'};
    min-width: 15mm;
  }

  .value {
    font-weight: 500;
    border-bottom: 1px solid ${props => props.$settings.themeMode === 'bw' ? '#000' : props.$settings.secondaryColor};
    flex-grow: 1;
    padding-bottom: 1mm;
  }

  .weight-value {
    font-size: 14pt;
    font-weight: 800;
    color: ${props => props.$settings.themeMode === 'bw' ? '#000' : props.$settings.secondaryColor};
  }
`;

const FooterLegal = styled.div<{ $settings: LabelSettings }>`
  font-size: 6pt;
  color: ${props => props.$settings.themeMode === 'bw' ? '#000' : '#64748b'};
  text-align: left;
  line-height: 1.2;
  margin-top: 2mm;
  border-top: 1px solid ${props => props.$settings.themeMode === 'bw' ? '#000' : '#e2e8f0'};
  padding-top: 1.5mm;
  display: flex;
  justify-content: space-between;
`;

const OrgTitleFallback = styled.div<{ $settings: LabelSettings }>`
  font-weight: 800;
  font-size: 12pt;
  text-align: center;
  color: ${props => props.$settings.themeMode === 'bw' ? '#000' : '#ffffff'};
  text-transform: uppercase;
`;

export const StockLabel: React.FC<StockLabelProps> = ({
  patientName,
  legajo,
  geneticName,
  weight,
  date,
  organizationName,
  logoUrl,
  settings
}) => {
  const finalSettings = { ...defaultSettings, ...settings };

  return (
    <LabelContainer $settings={finalSettings} className="printable-label">
      <ContentPanel>
        <div>
          <FieldLine $settings={finalSettings}>
            <span className="label">Paciente</span>
            <span className="value">{patientName || '_________________'}</span>
          </FieldLine>

          <FieldLine $settings={finalSettings}>
            <span className="label">Nro Legajo</span>
            <span className="value">{legajo || '_________________'}</span>
          </FieldLine>

          <FieldLine $settings={finalSettings}>
            <span className="label">Genética</span>
            <span className="value">{geneticName || '_________________'}</span>
          </FieldLine>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '4mm' }}>
            <span style={{ fontSize: '8pt', color: finalSettings.themeMode === 'bw' ? '#666' : '#64748b', fontWeight: 600 }}>Peso neto</span>
            <span className="weight-value">{weight || '____g'}</span>
          </div>
        </div>

        {finalSettings.showAddress && (
          <FooterLegal $settings={finalSettings}>
            <span>{finalSettings.addressText}</span>
            <span>{finalSettings.phoneText}</span>
          </FooterLegal>
        )}
      </ContentPanel>

      <BrandSidebar $settings={finalSettings}>
        {logoUrl ? (
          <LogoImage src={logoUrl} alt="Logo" $bw={finalSettings.themeMode === 'bw'} />
        ) : (
          <OrgTitleFallback $settings={finalSettings}>{organizationName}</OrgTitleFallback>
        )}
        <div style={{
          marginTop: 'auto',
          fontSize: '7pt',
          color: finalSettings.themeMode === 'bw' ? '#000' : '#fff',
          opacity: 0.8
        }}>
          {date || new Date().toLocaleDateString('es-AR')}
        </div>
      </BrandSidebar>
    </LabelContainer>
  );
};
