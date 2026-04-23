import React, { useState, useRef } from 'react';
import styled, { keyframes } from 'styled-components';
import { FaCloudUploadAlt, FaFileExcel, FaTimes, FaExclamationTriangle, FaInfoCircle, FaDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Patient } from '../services/patientsService';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  animation: ${fadeIn} 0.3s ease-out;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(var(--primary-color-rgb, 168, 85, 247), 0.3);
  border-radius: 1rem;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
  animation: ${slideUp} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
`;

const Header = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #f8fafc;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  button {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.5rem;
    
    &:hover {
      color: #f8fafc;
    }
  }
`;

const Body = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
`;

const DropZone = styled.div<{ $isDragActive: boolean }>`
  border: 2px dashed ${props => props.$isDragActive ? 'var(--primary-color, #a855f7)' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 0.5rem;
  padding: 3rem 2rem;
  text-align: center;
  background: ${props => props.$isDragActive ? 'rgba(var(--primary-color-rgb, 168, 85, 247), 0.1)' : 'rgba(30, 41, 59, 0.5)'};
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1.5rem;

  &:hover {
    border-color: rgba(var(--primary-color-rgb, 168, 85, 247), 0.5);
    background: rgba(var(--primary-color-rgb, 168, 85, 247), 0.05);
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.9rem;

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  th {
    color: #94a3b8;
    font-weight: 500;
  }

  td {
    color: #f8fafc;
  }
  
  tr.error td {
    background: rgba(239, 68, 68, 0.1);
  }
  
  tr.duplicate td {
    background: rgba(234, 179, 8, 0.1);
  }
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.95);
  border-bottom-left-radius: 1rem;
  border-bottom-right-radius: 1rem;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' | 'warning' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  border: ${props => props.$variant === 'secondary' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'};
  background: ${props => {
        if (props.$variant === 'primary') return 'linear-gradient(135deg, var(--primary-color, #a855f7) 0%, var(--secondary-color, #7c3aed) 100%)';
        if (props.$variant === 'danger') return '#ef4444';
        if (props.$variant === 'warning') return '#eab308';
        return 'transparent';
    }};
  color: ${props => props.$variant === 'secondary' ? '#cbd5e1' : '#ffffff'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const StatusPill = styled.span<{ $type: 'ok' | 'error' | 'duplicate' }>`
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: ${props => {
        if (props.$type === 'ok') return 'rgba(74, 222, 128, 0.2)';
        if (props.$type === 'error') return 'rgba(239, 68, 68, 0.2)';
        return 'rgba(234, 179, 8, 0.2)';
    }};
  color: ${props => {
        if (props.$type === 'ok') return '#4ade80';
        if (props.$type === 'error') return '#f87171';
        return '#facc15';
    }};
`;

const ConflictModalContent = styled.div`
  background: rgba(15, 23, 42, 0.98);
  border: 1px solid rgba(234, 179, 8, 0.5);
  padding: 2rem;
  border-radius: 1rem;
  width: 100%;
  max-width: 600px;
  text-align: center;
  color: #f8fafc;
`;

const ConflictDataComparison = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 1.5rem 0;
  text-align: left;
  
  .box {
    background: rgba(30, 41, 59, 0.5);
    padding: 1rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .title {
    font-size: 0.8rem;
    color: #94a3b8;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    font-weight: 600;
  }
`;

export const parseDateSafe = (val: any): string => {
    if (!val) return "";

    if (val instanceof Date) {
        if (isNaN(val.getTime())) return "";
        // Avoid timezone shift by getting local date parts
        const year = val.getFullYear();
        const month = (val.getMonth() + 1).toString().padStart(2, '0');
        const day = val.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    if (typeof val === 'number') {
        const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (isNaN(jsDate.getTime())) return "";
        return jsDate.toISOString().split('T')[0];
    }

    const str = val.toString().trim();
    if (!str) return "";

    const dmyRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
    const dmyMatch = str.match(dmyRegex);
    if (dmyMatch) {
        let day = parseInt(dmyMatch[1], 10);
        let month = parseInt(dmyMatch[2], 10);
        let year = parseInt(dmyMatch[3], 10);
        if (year < 100) year += year < 50 ? 2000 : 1900;
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    const ymdRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
    const ymdMatch = str.match(ymdRegex);
    if (ymdMatch) {
        let year = parseInt(ymdMatch[1], 10);
        let month = parseInt(ymdMatch[2], 10);
        let day = parseInt(ymdMatch[3], 10);
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
    }

    return str;
};

export interface ParsedPatient {
    index: number;
    fullName: string;
    email: string;
    documentNumber: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    reprocannNumber: string;
    issueDate: string;
    expirationDate: string;
    status: string;
    pathology: string;
    monthlyLimit: number;
    notes: string;
    validationStatus: 'ok' | 'error' | 'duplicate';
    validationMessage: string;
    duplicateTargetId?: string;
    rawObj: any;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    existingPatients: Patient[];
    onProcessBatch: (patients: ParsedPatient[], onConflict: (p: ParsedPatient, existing: Patient) => Promise<'update' | 'skip' | 'duplicate' | 'abort'>) => Promise<void>;
}

export const ImportPatientsModal: React.FC<Props> = ({ isOpen, onClose, existingPatients, onProcessBatch }) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedPatient[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [conflictState, setConflictState] = useState<{
        pendingPatient: ParsedPatient;
        existingPatient: Patient;
        resolve: (action: 'update' | 'skip' | 'duplicate' | 'abort') => void;
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleDownloadTemplate = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Plantilla_Pacientes', {
                views: [{ showGridLines: false, state: 'frozen', ySplit: 5 }] // Oculta la grilla general y congela
            });

            // 1. Anchos de columna predefinidos (Sin estilos por ahora para evitar bugs de Apple Numbers)
            worksheet.columns = [
                { width: 30 }, // Nombre
                { width: 35 }, // Email
                { width: 22 }, // DNI
                { width: 22 }, // Telefono
                { width: 22 }, // Nacimiento
                { width: 45 }, // Direccion
                { width: 25 }, // Nro Reprocann
                { width: 28 }, // Emision
                { width: 28 }, // Vencimiento
                { width: 20 }, // Estado
                { width: 35 }, // Patologia
                { width: 18 }, // Limite
                { width: 50 }, // Notas
            ];

            // 2. Fusionar área del Logo (esquina plana) y Título
            worksheet.mergeCells('A1:C4'); // Bloque ininterrumpido para el logo
            worksheet.mergeCells('D1:M4'); // Bloque ininterrumpido para el titulo principal

            const titleCell = worksheet.getCell('D1');
            titleCell.value = 'PLANTILLA DE IMPORTACIÓN MASIVA DE PACIENTES';
            titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
            titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

            // 3. Encabezados (Fila 5)
            const headerRow = worksheet.getRow(5);
            headerRow.values = [
                "Nombre Completo",
                "Email",
                "Documento / DNI",
                "Teléfono",
                "Fecha de Nacimiento",
                "Dirección",
                "Número REPROCANN",
                "Fecha Emisión",
                "Fecha Vencimiento",
                "Estado REPROCANN",
                "Patología",
                "Límite Mensual",
                "Notas (Opcional)"
            ];
            headerRow.height = 30;

            // 4. Fila de Ejemplo (Fila 6)
            const exampleRow = worksheet.getRow(6);
            exampleRow.values = [
                "Ejemplo Perez",
                "ejemplo@dominio.com",
                "12345678",
                "+5491122334455",
                "1990-05-20",
                "Av. Siempreviva 742",
                "12345-67890",
                "2024-01-01",
                "2027-01-01",
                "Activo",
                "Dolor crónico",
                "Libre",
                "Paciente importado de prueba, borrar o sobreescribir esta fila."
            ];
            exampleRow.height = 25;

            // 5. Aplicar Estilos de Forma Explícita a 100 filas x 13 columnas (A prueba de balas)
            // Esto garantiza que cualquier visor (incluso mac) muestre la grilla diseñada y no blanco vacio
            for (let r = 1; r <= 100; r++) {
                const row = worksheet.getRow(r);
                for (let c = 1; c <= 13; c++) {
                    const cell = row.getCell(c);

                    // Estilos Globales: Texto claro
                    cell.font = { color: { argb: 'FFE2E8F0' }, size: 11 };
                    cell.alignment = { vertical: 'middle', wrapText: true };

                    if (r <= 4) {
                        // Área Top: Fondo sólido oscuro y liso (Sin divisiones)
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111315' } }; // Pure Dark
                        cell.border = {};

                    } else if (r === 5) {
                        // Fila Header: Fondo oscuro y separador inferior
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111315' } };
                        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                        cell.border = { bottom: { style: 'medium', color: { argb: 'FF475569' } } }; // Divisor

                    } else {
                        // Filas de Datos (Inputs interactivos): Ligeramente mas claros con border delineado
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C2128' } }; // Lighter
                        cell.border = {
                            top: { style: 'thin', color: { argb: 'FF30363D' } },
                            left: { style: 'thin', color: { argb: 'FF30363D' } },
                            bottom: { style: 'thin', color: { argb: 'FF30363D' } },
                            right: { style: 'thin', color: { argb: 'FF30363D' } }
                        };
                    }
                }

                // Dar altura a las celdas interactivas
                if (r > 5) row.height = 25;
            }

            // 6. Intentar cargar e incrustar logo sobre la esquina tratada
            try {
                const response = await fetch('/trazapphorizontal.png');
                if (response.ok) {
                    const blob = await response.blob();
                    const arrayBuffer = await blob.arrayBuffer();
                    const logoId = workbook.addImage({ buffer: arrayBuffer, extension: 'png' });
                    worksheet.addImage(logoId, {
                        tl: { col: 0.3, row: 0.5 }, // Centrado óptico en su bloque A1:C4
                        ext: { width: 170, height: 45 } // Proporción natural para el logo horizontal
                    });
                }
            } catch (ignored) { }

            // 7. Validaciones (Menú Desplegable)
            for (let i = 6; i <= 100; i++) {
                worksheet.getCell(i, 10).dataValidation = {
                    type: 'list',
                    allowBlank: false,
                    formulae: ['"Activo,Pendiente,Vencido"'],
                    showErrorMessage: true,
                    errorStyle: 'error',
                    errorTitle: 'Estado Inválido',
                    error: 'Por favor, selecciona un estado de la lista (Activo, Pendiente, Vencido).'
                };
            }

            // Descargar
            const buffer = await workbook.xlsx.writeBuffer();
            const fileData = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            saveAs(fileData, 'Plantilla_Importacion_Pacientes_TrazAPP.xlsx');

        } catch (error) {
            console.error("Error generating template:", error);
            alert("No se pudo generar la plantilla. Intente nuevamente.");
        }
    };

    const processFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy-mm-dd' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                // El encabezado real está en la fila 5 (índice 4). Rango 4 le indica a xlsx que omita el título y logo.
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { range: 4 });

                const mappedData: ParsedPatient[] = jsonData.map((row: any, i) => {
                    const email = (row["Email"] || "").toString().trim().toLowerCase();
                    const dni = (row["Documento / DNI"] || "").toString().trim();
                    const fullName = (row["Nombre Completo"] || "").toString().trim();

                    let status: 'ok' | 'error' | 'duplicate' = 'ok';
                    let message = "Listo para importar";
                    let targetId = undefined;

                    // Valida básicos
                    if (!email || !fullName) {
                        status = 'error';
                        if (!email && !fullName) {
                            message = "Falta Nombre y Email. Ambos son requeridos.";
                        } else {
                            message = !email ? "Falta Email. Debe ingresar un correo electrónico." : "Falta Nombre. Debe ingresar el nombre completo.";
                        }
                    } else {
                        // Chequea duplicados locales
                        const dup = existingPatients.find(p => p.profile?.email === email || (dni && p.document_number === dni));
                        if (dup) {
                            status = 'duplicate';
                            message = `Duplicado detectado (${dup.profile?.email === email ? 'Email' : 'DNI'})`;
                            targetId = dup.id;
                        }
                    }

                    let limitVal = row["Límite Mensual"];
                    let limitNumber = 40;
                    if (typeof limitVal === 'string' && limitVal.trim().toLowerCase() === 'libre') {
                        limitNumber = 999;
                    } else if (!isNaN(parseFloat(limitVal))) {
                        limitNumber = parseFloat(limitVal);
                    }

                    let statusRaw = (row["Estado REPROCANN"] || "pendiente").toString().toLowerCase().trim();
                    let statusEnum = 'pending';
                    if (statusRaw === 'activo' || statusRaw === 'active') statusEnum = 'active';
                    else if (statusRaw === 'vencido' || statusRaw === 'expired') statusEnum = 'expired';

                    return {
                        index: i,
                        fullName,
                        email,
                        documentNumber: dni,
                        phone: (row["Teléfono"] || "").toString(),
                        dateOfBirth: parseDateSafe(row["Fecha de Nacimiento"]),
                        address: (row["Dirección"] || "").toString(),
                        reprocannNumber: (row["Número REPROCANN"] || "").toString(),
                        issueDate: parseDateSafe(row["Fecha Emisión"] || row["Fecha Emisión REPROCANN"]),
                        expirationDate: parseDateSafe(row["Fecha Vencimiento"] || row["Fecha Vencimiento REPROCANN"]),
                        status: statusEnum,
                        pathology: (row["Patología"] || "").toString(),
                        monthlyLimit: limitNumber,
                        notes: (row["Notas (Opcional)"] || row["Notas"] || "").toString(),
                        validationStatus: status,
                        validationMessage: message,
                        duplicateTargetId: targetId,
                        rawObj: row
                    };
                });

                setParsedData(mappedData);
            } catch (err) {
                console.error("Error parseando XLSX:", err);
                alert("Error al leer el archivo. Asegúrese de que sea un Excel válido.");
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragActive(true);
        } else if (e.type === "dragleave") {
            setIsDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleImport = async () => {
        setIsProcessing(true);

        // Función callback que se llamará si hay conflicto durante el batch processing
        const handleConflict = (p: ParsedPatient, existing: Patient) => {
            return new Promise<'update' | 'skip' | 'duplicate' | 'abort'>((resolve) => {
                setConflictState({ pendingPatient: p, existingPatient: existing, resolve });
            });
        };

        try {
            await onProcessBatch(parsedData.filter(p => p.validationStatus !== 'error'), handleConflict);
            onClose();
        } catch (e) {
            console.error("Batch aborted or failed", e);
        } finally {
            setIsProcessing(false);
            setConflictState(null);
        }
    };

    const resolveConflict = (action: 'update' | 'skip' | 'duplicate' | 'abort') => {
        if (conflictState) {
            conflictState.resolve(action);
            setConflictState(null);
        }
    };

    return (
        <>
            <ModalOverlay>
                <ModalContent>
                    <Header>
                        <h2><FaFileExcel style={{ color: '#22c55e' }} /> Importar Pacientes desde CSV/XLSX</h2>
                        <button onClick={onClose} disabled={isProcessing}><FaTimes size={20} /></button>
                    </Header>
                    <Body>
                        {parsedData.length === 0 ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <p style={{ color: '#94a3b8', margin: 0 }}>
                                        Sube un archivo de Excel (.xlsx) o de valores separados por coma (.csv). Puedes descargar la plantilla oficial aquí.
                                    </p>
                                    <Button $variant="secondary" onClick={handleDownloadTemplate}>
                                        <FaDownload /> Plantilla
                                    </Button>
                                </div>

                                <DropZone
                                    $isDragActive={isDragActive}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <FaCloudUploadAlt size={48} color={isDragActive ? "var(--primary-color, #a855f7)" : "#64748b"} style={{ marginBottom: '1rem' }} />
                                    <h3 style={{ color: '#f8fafc', margin: '0 0 0.5rem 0' }}>Arrastra el archivo aquí o haz clic</h3>
                                    <p style={{ color: '#64748b', margin: 0 }}>Archivos soportados: .xlsx, .csv (Máximo 200 filas recomendadas)</p>
                                    <input
                                        type="file"
                                        accept=".xlsx, .csv"
                                        ref={fileInputRef}
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
                                        }}
                                    />
                                </DropZone>
                            </>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ color: '#f8fafc', margin: 0 }}>Vista Previa ({parsedData.length} filas detectadas)</h3>
                                    <Button $variant="secondary" onClick={() => setParsedData([])} disabled={isProcessing}>Subir otro archivo</Button>
                                </div>

                                <div style={{ overflowX: 'auto', marginTop: '1rem', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem' }}>
                                    <Table>
                                        <thead>
                                            <tr>
                                                <th>Estado</th>
                                                <th>Nombre</th>
                                                <th>Email</th>
                                                <th>DNI</th>
                                                <th>REPROCANN</th>
                                                <th>Detalle</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.map((row, idx) => (
                                                <tr key={idx} className={row.validationStatus}>
                                                    <td>
                                                        <StatusPill $type={row.validationStatus}>
                                                            {row.validationStatus.toUpperCase()}
                                                        </StatusPill>
                                                    </td>
                                                    <td>{row.fullName}</td>
                                                    <td>{row.email}</td>
                                                    <td>{row.documentNumber}</td>
                                                    <td>{row.reprocannNumber}</td>
                                                    <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{row.validationMessage}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </>
                        )}
                    </Body>

                    {parsedData.length > 0 && (() => {
                        const errorCount = parsedData.filter(p => p.validationStatus === 'error').length;
                        const validCount = parsedData.filter(p => p.validationStatus !== 'error').length;
                        const hasOnlyErrors = validCount === 0;

                        return (
                            <ActionRow>
                                <div style={{ color: hasOnlyErrors ? '#ef4444' : '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {hasOnlyErrors ? <FaExclamationTriangle /> : <FaInfoCircle />}
                                    {hasOnlyErrors
                                        ? "No hay registros válidos para importar. Por favor, corrija los errores en la plantilla."
                                        : `${errorCount > 0 ? `${errorCount} errores detectados que serán omitidos.` : 'Todos los registros son válidos.'}`
                                    }
                                </div>
                                <Button
                                    $variant="primary"
                                    onClick={handleImport}
                                    disabled={isProcessing || hasOnlyErrors}
                                >
                                    {isProcessing ? "Importando..." : `Procesar e Importar (${validCount} válidos)`}
                                </Button>
                            </ActionRow>
                        );
                    })()}
                </ModalContent>
            </ModalOverlay>

            {/* Moda de Resolución de Conflictos */}
            {conflictState && (
                <ModalOverlay style={{ zIndex: 1100 }}>
                    <ConflictModalContent>
                        <FaExclamationTriangle size={48} color="#eab308" style={{ marginBottom: '1rem' }} />
                        <h2 style={{ margin: '0 0 0.5rem 0' }}>Paciente Duplicado Detectado</h2>
                        <p style={{ color: '#94a3b8', margin: 0 }}>
                            El sistema encontró un paciente existente con el mismo Email o DNI.
                        </p>

                        <ConflictDataComparison>
                            <div className="box">
                                <div className="title">Datos Existentes en Base de Datos</div>
                                <p><strong>{conflictState.existingPatient.profile?.full_name}</strong></p>
                                <p>{conflictState.existingPatient.profile?.email}</p>
                                <p>DNI: {conflictState.existingPatient.document_number || 'N/A'}</p>
                                <p>Reprocann: {conflictState.existingPatient.reprocann_number || 'N/A'}</p>
                            </div>
                            <div className="box" style={{ borderColor: 'rgba(var(--primary-color-rgb, 168, 85, 247), 0.5)', background: 'rgba(var(--primary-color-rgb, 168, 85, 247), 0.05)' }}>
                                <div className="title" style={{ color: '#d8b4fe' }}>Datos a Importar (Excel)</div>
                                <p><strong>{conflictState.pendingPatient.fullName}</strong></p>
                                <p>{conflictState.pendingPatient.email}</p>
                                <p>DNI: {conflictState.pendingPatient.documentNumber || 'N/A'}</p>
                                <p>Reprocann: {conflictState.pendingPatient.reprocannNumber || 'N/A'}</p>
                            </div>
                        </ConflictDataComparison>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '2rem' }}>
                            <Button $variant="primary" onClick={() => resolveConflict('update')} style={{ justifyContent: 'center' }}>
                                Actualizar con Nuevos Datos (Recomendado)
                            </Button>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <Button $variant="warning" onClick={() => resolveConflict('duplicate')} style={{ justifyContent: 'center', color: '#854d0e', background: 'rgba(234, 179, 8, 0.2)' }}>
                                    Copiar de Todas Formas
                                </Button>
                                <Button $variant="secondary" onClick={() => resolveConflict('skip')} style={{ justifyContent: 'center' }}>
                                    Omitir este Registro
                                </Button>
                            </div>
                            <Button $variant="danger" onClick={() => resolveConflict('abort')} style={{ justifyContent: 'center', marginTop: '1rem', background: 'transparent', border: '1px solid #ef4444' }}>
                                Cancelar toda la Importación
                            </Button>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '1.5rem', marginBottom: 0 }}>
                            Nota: "Copiar de Todas Formas" puede fallar si el email provisto no puede registrarse por duplicidad en el sistema de seguridad.
                        </p>
                    </ConflictModalContent>
                </ModalOverlay>
            )}
        </>
    );
};
