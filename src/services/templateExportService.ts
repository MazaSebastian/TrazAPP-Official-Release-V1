import { ClinicalTemplate, FormField } from './templatesService';
import { templatesService } from './templatesService';

// ─── Portable Template Format ───────────────────────────────────────
interface TrazAppTemplateFile {
  format: 'trazapp-template';
  version: '1.0';
  exported_at: string;
  template: {
    name: string;
    description: string | null;
    fields: FormField[];
  };
}

// ─── helpers ────────────────────────────────────────────────────────
function buildFieldHTML(field: FormField): string {
  const labelHtml = `
      <div style="font-weight:bold;font-size:11pt;margin-bottom:8px;display:flex;justify-content:space-between;">
        <span>${field.label}${field.required ? ' *' : ''}</span>
        ${field.required ? '<span style="font-size:8pt;font-weight:normal;">(Requerido)</span>' : ''}
      </div>`;

  let contentHtml = '';

  if (field.type === 'textarea') {
    contentHtml = `<div style="border:1px solid black;border-radius:2px;min-height:100px;padding:10px;font-size:10pt;background:transparent;"></div>`;
  } else if (field.type === 'select' || field.type === 'checkbox') {
    const items = (field.options ?? []).map(
      (opt) => `<div style="display:flex;align-items:center;gap:8px;font-size:10pt;">
                        <div style="width:14px;height:14px;border:2px solid black;border-radius:2px;flex-shrink:0;"></div>
                        <span>${opt}</span>
                      </div>`
    ).join('');
    const other = `<div style="display:flex;align-items:center;gap:8px;font-size:10pt;">
                         <div style="width:14px;height:14px;border:2px solid black;border-radius:2px;flex-shrink:0;"></div>
                         <span>Otro: ____________</span>
                       </div>`;
    contentHtml = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:5px;">${items}${other}</div>`;
  } else if (field.type === 'eva') {
    const circles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
      (n) => `<div style="display:flex;flex-direction:column;align-items:center;gap:5px;">
                      <div style="width:16px;height:16px;border-radius:50%;border:2px solid black;"></div>
                      <span style="font-size:8pt;font-weight:bold;">${n}</span>
                    </div>`
    ).join('');
    contentHtml = `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid black;">
            <span style="font-size:9pt;">0 (Sin Dolor)</span>
            <div style="display:flex;gap:14px;">${circles}</div>
            <span style="font-size:9pt;">10 (Máximo)</span>
          </div>`;
  } else if (field.type === 'date') {
    contentHtml = `<div style="width:160px;border-bottom:1px solid black;padding-bottom:5px;font-size:10pt;">DD / MM / AAAA</div>`;
  } else {
    contentHtml = `<div style="border:1px solid black;border-radius:2px;min-height:40px;padding:10px;font-size:10pt;background:transparent;"></div>`;
  }

  return `<div style="break-inside:avoid;margin-bottom:20px;">${labelHtml}${contentHtml}</div>`;
}

function buildPDFHtml(template: ClinicalTemplate): string {
  const today = new Date().toLocaleDateString('es-AR');
  const docId = template.id.slice(0, 8).toUpperCase();

  const fieldsHtml = template.fields.map(buildFieldHTML).join('');

  return `
      <div style="
        background:white;color:black;width:190mm;
        padding:10mm;font-family:Arial,sans-serif;
        box-sizing:border-box;font-size:11pt;
      ">
        <!-- HEADER -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid black;padding-bottom:10px;margin-bottom:20px;">
          <div style="display:flex;align-items:flex-start;gap:16px;">
            <div>
              <div style="font-size:20pt;font-weight:900;text-transform:uppercase;margin:0 0 4px 0;letter-spacing:1px;">TrazAPP</div>
              <div style="font-size:16pt;font-weight:800;text-transform:uppercase;">${template.name}</div>
              ${template.description ? `<div style="font-size:10pt;margin-top:2px;">${template.description}</div>` : ''}
            </div>
          </div>
          <div style="text-align:right;font-size:9pt;">
            <div><strong>TrazAPP — Sistema Clínico</strong></div>
            <div>Fecha: ${today}</div>
            <div>ID Doc: ${docId}</div>
          </div>
        </div>

        <!-- DATOS DEL PACIENTE -->
        <div style="margin-bottom:20px;">
          <h3 style="font-size:13pt;font-weight:900;text-transform:uppercase;border-bottom:2px solid black;padding-bottom:4px;margin:0 0 12px 0;">Datos del Paciente</h3>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
            ${['Nombre', 'DNI / REPROCANN', 'Fecha Nac.', 'Firma'].map(l => `
              <div style="display:flex;gap:10px;align-items:baseline;font-size:11pt;">
                <strong style="min-width:100px;white-space:nowrap;">${l}:</strong>
                <div style="flex:1;border-bottom:1px dotted black;">&nbsp;</div>
              </div>`).join('')}
          </div>
        </div>

        <!-- CAMPOS CLÍNICOS -->
        <div>
          <h3 style="font-size:13pt;font-weight:900;text-transform:uppercase;border-bottom:2px solid black;padding-bottom:4px;margin:0 0 16px 0;">Datos Clínicos</h3>
          ${fieldsHtml}
        </div>

        <!-- FOOTER -->
        <div style="margin-top:40px;padding-top:20px;border-top:2px solid black;display:flex;justify-content:space-between;align-items:flex-end;font-size:9pt;">
          <div>Documento generado vía TrazAPP.<br/>Uso exclusivo médico-paciente.</div>
          <div style="width:200px;border-top:1px dotted black;text-align:center;padding-top:5px;margin-top:40px;">
            Firma y Sello del Profesional
          </div>
        </div>
      </div>`;
}

// ─── PDF Export (pure inline HTML — bypasses styled-components) ──────
export async function exportAsPDF(template: ClinicalTemplate): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default;

  const container = document.createElement('div');
  container.innerHTML = buildPDFHtml(template);
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.background = 'white';
  document.body.appendChild(container);

  const sanitizedName = template.name.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s_-]/g, '').trim();

  const opt = {
    margin: [5, 5, 5, 5] as [number, number, number, number],
    filename: `Plantilla-${sanitizedName}.pdf`,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    },
    jsPDF: {
      unit: 'mm' as const,
      format: 'a4',
      orientation: 'portrait' as const,
    },
  };

  try {
    await html2pdf().from(container.firstElementChild as HTMLElement).set(opt).save();
  } finally {
    document.body.removeChild(container);
  }
}


// ─── Template Export (.trazapp.json) ────────────────────────────────
export function exportAsTemplate(template: ClinicalTemplate): void {
  const exportData: TrazAppTemplateFile = {
    format: 'trazapp-template',
    version: '1.0',
    exported_at: new Date().toISOString(),
    template: {
      name: template.name,
      description: template.description,
      fields: template.fields.map((f) => ({
        // Regenerate IDs to avoid collisions on import
        id: f.id,
        type: f.type,
        label: f.label,
        required: f.required,
        ...(f.options && f.options.length > 0 ? { options: f.options } : {}),
      })),
    },
  };

  const json = JSON.stringify(exportData, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const sanitizedName = template.name.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s_-]/g, '').trim();

  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizedName}.trazapp.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Template Import (.trazapp.json) ────────────────────────────────
export async function importTemplate(
  file: File
): Promise<ClinicalTemplate | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text) as TrazAppTemplateFile;

        // Validate structure
        if (data.format !== 'trazapp-template') {
          throw new Error('Formato de archivo inválido. Se esperaba un archivo .trazapp.json');
        }

        if (!data.template?.name || !Array.isArray(data.template?.fields)) {
          throw new Error('El archivo no contiene una plantilla válida');
        }

        // Validate each field
        const validTypes = ['text', 'textarea', 'select', 'checkbox', 'date', 'eva'];
        for (const field of data.template.fields) {
          if (!field.label || !field.type || !validTypes.includes(field.type)) {
            throw new Error(`Campo inválido encontrado: "${field.label || 'sin nombre'}"`);
          }
        }

        // Regenerate field IDs to prevent collisions
        const newFields: FormField[] = data.template.fields.map((f, i) => ({
          id: `field_${Date.now()}_${i}`,
          type: f.type,
          label: f.label,
          required: f.required ?? false,
          ...(f.options ? { options: f.options } : {}),
        }));

        // Create the template in the current organization
        const created = await templatesService.createTemplate({
          name: `${data.template.name} (Importada)`,
          description: data.template.description,
          is_active: true,
          fields: newFields,
        });

        resolve(created);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
}
