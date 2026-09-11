import React from 'react';
import styled, { keyframes } from 'styled-components';
import QRCode from 'react-qr-code';
import { X as LucideX, Download, QrCode } from 'lucide-react';
import { Button as ShadcnButton } from './ui/Button';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(3, 7, 18, 0.82);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(12px);
  padding: 1rem;
  animation: ${fadeIn} 0.2s ease-out;
`;

const Content = styled.div`
  background: rgba(15, 23, 42, 0.96);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1.25rem;
  padding: 1.75rem;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.75);
  animation: ${slideUp} 0.25s cubic-bezier(0.16, 1, 0.3, 1);
`;

const Header = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  .header-left {
    display: flex;
    align-items: center;
    gap: 0.85rem;

    .icon-badge {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: #34d399;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    h3 {
      margin: 0;
      color: #f8fafc;
      font-size: 1.15rem;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #f8fafc;
    border-color: rgba(255, 255, 255, 0.2);
  }
`;

const QRWrapper = styled.div`
  background: #ffffff;
  padding: 1.25rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Actions = styled.div`
  width: 100%;
  display: flex;
  gap: 0.75rem;
  justify-content: center;
`;

interface QRCodeModalProps {
  isOpen: boolean;
  value: string;
  title?: string;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  value,
  title = 'Código QR',
  onClose
}) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR-${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Content onClick={e => e.stopPropagation()}>
        <Header>
          <div className="header-left">
            <div className="icon-badge">
              <QrCode size={20} />
            </div>
            <h3>{title}</h3>
          </div>
          <CloseButton onClick={onClose} title="Cerrar">
            <LucideX size={18} />
          </CloseButton>
        </Header>

        <QRWrapper>
          <QRCode id="qr-code-svg" value={value} size={200} level="H" />
        </QRWrapper>

        <Actions>
          <ShadcnButton variant="secondary" onClick={onClose}>
            Cerrar
          </ShadcnButton>
          <ShadcnButton variant="default" onClick={handleDownload}>
            <Download size={16} style={{ marginRight: 6 }} /> Descargar PNG
          </ShadcnButton>
        </Actions>
      </Content>
    </Overlay>
  );
};
