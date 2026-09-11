# 🌿 TrazAPP V1 - Plan Maestro y Hoja de Ruta de Rediseño Integral (Shadcn UI)

> **Documento de Continuidad Operativa**  
> **Fecha de creación:** 10 de Septiembre de 2026 (Noche)  
> **Estado del Proyecto:** Compilación estable (`npm run build` con código 0), servidor dev activo en `http://localhost:3001`.  
> **Objetivo:** Retomar la modernización integral al estándar visual **Shadcn UI (Dark Glassmorphism, Lucide Icons, micro-elevación, tipografía nítida)** garantizando consistencia del 100% en todos los modales, pantallas y paneles.

---

## 🏆 1. Resumen de lo Logrado hasta la Fecha

1. **Fase 1 - Nuevo Sidebar High-End**:
   - Componente colapsable a barra de iconos (260px ↔ 72px) con atajo global `Cmd + B` / `Ctrl + B`.
   - Tooltips flotantes con resplandor esmeralda, avatar con estado online, badges de plan dinámicos.
   - Drawer deslizable responsive en móviles (<768px).
2. **Fase 2 - Kit Base de Componentes Shadcn (`src/components/ui/`)**:
   - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
   - `Badge` (variantes esmeralda, ámbar, rosa, cielo, púrpura) con animación `ping dot`.
   - `Button` (variantes `default/emerald`, `secondary`, `destructive`, `outline`, `ghost`, con soporte para iconos y loaders).
   - `Tabs` (segmented switch interactivo).
3. **Dashboard & KPIs en Vivo (`Dashboard.tsx`)**:
   - `DashboardKpiRibbon`: cálculo dinámico en tiempo real de plantas activas, lotes, clima promedio de salas y tareas pendientes.
   - Rediseño de widgets (`IncidentsMonitorWidget`, `WeatherWidget`).
   - Botones de acción rápida con glassmorphism e iconografía Lucide (`Nueva Nota`, `Imprimir Checklist`, `Ver Cultivos`).
4. **Tarjetas de Cultivo en `/crops`**:
   - Tarjeta completa clickeable para ingresar a salas con micro-animaciones hover.
5. **Suite de Modales Centrales Reestilizada**:
   - `PromptModal.tsx` (Editar nombre de cultivo, etc.).
   - `ConfirmationModal.tsx` (Confirmaciones destructivas / advertencias).
   - `ToastModal.tsx` (Notificaciones centrales).
   - `DeleteProtectionModal.tsx` (Confirmación con frase de seguridad).
   - `ColorPickerModal.tsx` (Selector de color para salas/lotes).
   - Modal de creación de cultivo en `Crops.tsx`.
6. **Vista de Detalle de Sala (`/rooms/:id` en `RoomDetail.tsx`)**:
   - Cabecera flotante con `ShadcnButton` "Volver" y `ShadcnBadge` de etapa con dot pulsante.
   - KPI Ribbon de sala (`StatCard` con `LucideSprout`, `LucideLayers`, `LucideThermometer`, `LucideCalendar`).
   - Botones de acción de sala modernizados ("Nueva Tarea", "Historial", "Cosechar/Trasplantar", "Editar Sala").

---

## 🎯 2. Diagnóstico Específico: Modal "Nueva Tarea" (Punto de Partida para Mañana)

En la captura analizada de `RoomDetail.tsx` (líneas ~5929 a 6325), el modal de **Nueva Tarea** presenta las siguientes inconsistencias que deben corregirse:

1. **Cabecera**:
   - Título plano sin badge identificador.
   - Botón de cierre con caracter unicode `✕` plano en lugar del botón `X` de Lucide con contenedor translúcido y micro-hover.
2. **Campos de Formulario (Inputs / Selects / DatePicker)**:
   - Bordes básicos sin foco esmeralda reactivo.
   - Textarea de instrucciones con estilo crudo.
   - Falta de micro-espaciado ergonómico.
3. **Copy Erróneo en Nota de Voz**:
   - Actualmente dice *"Audio Clínico: Graba la entrevista médica. Luego podrás transcribirla y extraer información automáticamente con Inteligencia Artificial."* (texto de telemedicina arrastrado a un cultivo).
   - **Solución:** Reemplazar por *"Nota de Voz del Cultivo: Graba notas operativas rápidas para el equipo de sala (instrucciones de riego, preventivos, defoliación)."*
4. **Selector de Periodicidad y Días**:
   - Checkbox nativo plano.
   - Botones de días de semana (`D, L, M, M, J, V, S`) requieren estilo circular Shadcn con glow verde sutil en estado seleccionado.
5. **Botón Gestor de Archivos**:
   - Actualmente es un botón dashed que lanza un `alert()`. Darle estética de uploader profesional.
6. **Botones de Acción Inferiores**:
   - Utilizan `ModalActionButton` antiguo tipo pastilla.
   - Reemplazar por `ShadcnButton` (`variant="secondary"` para Cancelar, `variant="destructive"` para Eliminar y `variant="default"` verde esmeralda con `leftIcon={<LucideCheckSquare />}` para Guardar/Crear Tarea).

---

## 🔍 3. Inventario Exhaustivo de Elementos Pendientes de Rediseño

### CATEGORÍA A: Modales Internos de `RoomDetail.tsx` (Prioridad 1)
- [ ] **Modal "Nueva Tarea" / "Detalle de Tarea"** (Líneas ~5930–6320 & ~6327–6432)
- [ ] **Modal "Nuevo Lote"** (`isCreateBatchModalOpen` - Líneas ~7964–8033)
- [ ] **Modal "Editar Lote"** (`isEditBatchModalOpen` - Líneas ~7098–7148)
- [ ] **Modal "Edición Masiva de Lotes"** (`isBulkEditModalOpen` - Líneas ~7155–7193)
- [ ] **Modal "Crear Nueva Mesa / Mapa"** (`isMapModalOpen` - Líneas ~6657–6704)
- [ ] **Modal "Editar Mesa / Mapa"** (`isEditMapModalOpen` - Líneas ~6711–6752)
- [ ] **Modal "Eliminar Mesa"** (`isDeleteMapModalOpen` - Líneas ~7044–7062)
- [ ] **Modal "Historial de Sala"** (`isHistoryModalOpen` - Líneas ~7359–7444)
- [ ] **Modal "Editar Parámetros de Sala"** (`isEditRoomModalOpen` - Líneas ~7639–7728)
- [ ] **Modal "Cambiar Fase / Etapa"** (`isChangePhaseModalOpen` - Líneas ~6874–7034)
- [ ] **Modal "Asignar Plantas"** (`isAssignModalOpen` - Líneas ~6800–6852)
- [ ] **Modal "Notas Adhesivas / Pizarra"** (`isStickyModalOpen` - Líneas ~6439–6516)
- [ ] **Modal "Finalizar Ciclo de Sala"** (`isFinalizeModalOpen` - Líneas ~7735–7802)
- [ ] **Modal "Siembra / Germinación"** (`isSowingModalOpen` - Líneas ~6598–6650)
- [ ] **Modal "Observaciones de Inspección"** (`isObservationModalOpen` - Líneas ~7897–7941)

### CATEGORÍA B: Modales Desacoplados de Cultivo (Prioridad 2)
- [ ] **`src/components/Esquejera/TransplantModal.tsx`**: Modal de trasplante entre salas.
- [ ] **`src/components/Flowering/HarvestModal.tsx`**: Modal de cosecha y pesaje de cogollos húmedos/secos.
- [ ] **`src/components/LivingSoil/LivingSoilBatchModal.tsx`** & **`StageSelectionModal.tsx`**: Gestión de camas vivas.
- [ ] **`src/components/DeleteReasonModal.tsx`**: Motivo de descarte fitosanitario.
- [ ] **`src/components/MoveConfirmationModal.tsx`**: Confirmación de arrastre de plantas.
- [ ] **`src/components/WorkbenchDetailModal.tsx`** & **`GroupDetailModal.tsx`**: Detalles de mesas de trabajo.
- [ ] **`src/components/ConfirmModal.tsx`**: Unificar con `ConfirmationModal.tsx` nuevo.

### CATEGORÍA C: Modales Clínicos, Dispensario e IoT (Prioridad 3)
- [ ] **`src/components/CreateDispensaryProductModal.tsx`**: Alta de flores, aceites y extractos.
- [ ] **`src/components/EditDispensaryModal.tsx`**: Edición de productos de dispensario.
- [ ] **`src/components/Patients/InvitePatientModal.tsx`**: Invitación a nuevos socios.
- [ ] **`src/components/ImportPatientsModal.tsx`**: Importador masivo de pacientes vía Excel/CSV.
- [ ] **`src/pages/PatientDetail.tsx`**: Modal de evolución clínica (`isEvolutionModalOpen`).
- [ ] **`src/components/DeviceDetailModal.tsx`** & **`TrazAppDeviceDetailModal.tsx`**: Configuración de sensores IoT y relés.
- [ ] **`src/components/QRCodeModal.tsx`**: Visualización e impresión de códigos QR.
- [ ] **`src/pages/admin/CreateOrgModal.tsx`** & **`ManageOrgModal.tsx`**: Gestión de clubes en Super Admin.

### CATEGORÍA D: Pantallas Principales (Vistas y Tablas)
- [ ] **`/crops/:id` (`CropDetail.tsx`)**: Tarjetas de salas, botón "+ Nueva Sala", modal `isRoomModalOpen`.
- [ ] **`/rooms` (`Rooms.tsx`)**: Grilla de salas con filtros y badges Shadcn.
- [ ] **`/clones` (`Clones.tsx`)**: Esquejera y banco de madres, modales de corte y loteo.
- [ ] **`/genetics` (`Genetics.tsx`) & `/genetics/rd` (`GeneticsRD.tsx`)**: Variedades, modal de creación con sliders.
- [ ] **`/insumos` (`Insumos.tsx`) & `/stock` (`Stock.tsx`)**: Tablas de fertilizantes y cosechas con glassmorphism.
- [ ] **`/dispensary` (`Dispensary.tsx`)**: Punto de retiro de socios, entrega y stock.
- [ ] **`/patients` (`Patients.tsx`) & `/patients/:id` (`PatientDetail.tsx`)**: Directorio de pacientes y ficha REPROCANN.
- [ ] **`/devices` (`Devices.tsx`)**: Panel de sensores con telemetría en vivo.
- [ ] **`/expenses` (`Expenses.tsx`) & `/compras` (`Compras.tsx`)**: Flujo financiero y facturación.
- [ ] **`/settings` (`Settings.tsx`)**: Paneles de configuración, branding y firma digital.

---

## ⚡ 4. Plan de Acción Inmediato para Mañana por la Mañana

Al iniciar la sesión mañana, ejecutar en este orden estricto:

1. **Paso 1: Rediseñar el Modal "Nueva Tarea" en `RoomDetail.tsx`**:
   - Reemplazar contenedor y cabecera con estilo `Card` / `Dialog` Shadcn.
   - Corregir el texto médico por la nota de cultivo correspondiente.
   - Integrar `CustomSelect`, `CustomDatePicker` e inputs estilizados con borde sutil y glow esmeralda.
   - Modernizar selector de periodicidad y botones circulares de días.
   - Sustituir `ModalActionButton` por `ShadcnButton`.
2. **Paso 2: Rediseñar los Modales Operativos Clave de `RoomDetail.tsx`**:
   - `Nuevo Lote`, `Editar Lote`, `Crear/Editar Mesa`, `Historial de Sala`.
3. **Paso 3: Validar Compilación**:
   - Ejecutar `npm run build` y verificar en el navegador (`localhost:3001/rooms/[id]`).
4. **Paso 4: Continuar con los modales desacoplados de cultivo** (`TransplantModal.tsx` y `HarvestModal.tsx`).

---

## 🎨 5. Estándares y Reglas de Diseño Shadcn para TrazAPP

- **Contenedores y Modales**: `background: rgba(15, 23, 42, 0.95)`, `backdrop-filter: blur(20px)`, borde `1px solid rgba(255, 255, 255, 0.1)`, `border-radius: 1rem` o `1.25rem`, sombra `0 25px 50px -12px rgba(0, 0, 0, 0.7)`.
- **Inputs & Selects**: Fondo `rgba(15, 23, 42, 0.6)`, borde `rgba(255, 255, 255, 0.12)`, foco con glow `0 0 0 2px rgba(74, 222, 128, 0.25)` y borde `#4ade80`.
- **Iconografía**: Exclusivamente `lucide-react` de trazo uniforme (evitar FontAwesome tosco en modales nuevos).
- **Botones**: Siempre utilizar [ShadcnButton](file:///Users/sebamaza/Desktop/PROYECTOS%20DEV/APIDC%20GROW/TrazAPP%20V1%20-%20First%20Release/TrazAPP%20V1/src/components/ui/Button.tsx) con variantes semánticas:
  - Principal/Acción positiva: `variant="default"` (verde esmeralda con halo).
  - Cancelar/Cerrar: `variant="secondary"`.
  - Peligro/Eliminar: `variant="destructive"`.
