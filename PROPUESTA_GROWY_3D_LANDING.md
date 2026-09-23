# Propuesta Conceptual y Técnica: Sección y Componente 3D de "Growy" para la Web de TrazAPP

Este documento contiene la conceptualización, especificaciones de diseño, arquitectura técnica del componente 3D interactivo y las funcionalidades completas de **Growy**, el asistente de cultivo asistido por Inteligencia Artificial y conectado con TrazAPP vía protocolo MCP.

---

## 1. Visión General del Producto

**Growy** no es un termohigrómetro tradicional ni un simple registrador de datos. Es un **dispositivo de hardware inteligente y autónomo** que reside físicamente en la sala de cultivo, diseñado para monitorear el entorno biológico y actuar como la extensión física de **TrazAPP**.

### Identidad Visual y Física (Basada en el Prototipo Real)
- **Carcasa Industrial:** Color grafito oscuro con acabado superior y posterior en **fibra de carbono** texturizada.
- **Tornillería Vista:** Tornillos Allen metálicos en bordes y esquinas que acentúan su estética industrial robusta.
- **Identidad de Marca:** Logotipo geométrico de TrazAPP y marca en relieve en el panel trasero.
- **Sistema de Montaje:** Abrazaderas dobles reforzadas para anclaje directo a caños estructurales de carpas o salas de cultivo técnico.
- **Frente:**
  - Pantalla táctil de alta definición.
  - Tapa / visera frontal abatible inferior con bisagras integradas y rejillas circulares concéntricas.
  - Botón selector central con marco de fibra de carbono.
  - Dos rejillas de ventilación y toma de sensores atmosféricos.

---

## 2. Los Dos Modos de Interfaz de Growy

### A. Modo Rostro IA ("Face Mode" / Standby / Alerta)
- **Expresión visual:** Dos ojos redondeados tipo cápsula luminosos con estética ciberpunk amigable (tonos violeta / magenta / cian según estado de ánimo y salud del cultivo).
- **Telemetría instantánea al pie de la pantalla:**
  - `[TEMP] 20.7 °C`
  - `[HUM] 65.6 %`
  - `[VPD] 0.55 kPa` (Déficit de Presión de Vapor)
  - `[SUELO] 91.4 %`
  - `[PLANTAS] 18`
- **Comportamiento interactivo:**
  - En estado óptimo: Ojos con parpadeo suave y seguimiento del cursor / usuario.
  - En estado crítico: Título `[ALERTA CRÍTICA] PARÁMETROS AMBIENTALES FUERA DE RANGO` con ojos en alerta magenta/rojo.
  - Indicador de acción: *"Toca la pantalla para desbloquear el búnker"*.

### B. Modo Operativo ("TRAZAPP SENSE")
- **Barra superior de estado:**
  - Nombre: `TRAZAPP SENSE`
  - Reloj en tiempo real
  - Chips de estado: `✓ ONLINE`, `REPOSO`, `SUPABASE: ONLINE`
- **Dashboard de Cultivo:**
  - Título y conteo de macetas: `MAPA DE PLANTAS -- 18 MACETAS`
  - Selector de lote / genética activa (ej. `Lemon Cherry`, `Tapeche`, `Papaya Dream`, `ZOAP`)
  - Controles de zoom y visualización (`- 100% +`)
  - Cuadrícula con celdas de macetas individuales codificadas por color (A1, A2, B1, etc.)
  - Botón de acción rápida: `+ REGISTRAR INCIDENCIA` para registrar plagas, anomalías o notas directamente desde el dispositivo sin usar guantes ni celulares.

---

## 3. Conectividad y Ecosistema de Inteligencia Artificial (MCP)

### Sensores Integrados
- **Sustrato / Suelo:**
  - Humedad volumétrica de sustrato (VWC)
  - Electroconductividad (EC)
  - pH de suelo
  - Temperatura de raíz
- **Ambiente / Atmósfera:**
  - Temperatura ambiental
  - Humedad Relativa (HR)
  - Déficit de Presión de Vapor (VPD)
  - Sensor de CO₂ (ppm) y sensor de radiación fotosintética activa (PPFD)

### Comunicación con TrazAPP vía MCP (Model Context Protocol)
Growy expone las herramientas y telemetría de la sala al protocolo MCP:
- Permite que modelos de lenguaje de vanguardia (**Gemini, Claude, ChatGPT**) actúen como copilotos del cultivador.
- **Acciones que puede ejecutar la IA en base a Growy:**
  1. `trazapp_get_room_telemetry`: Consulta en lenguaje natural de variables en tiempo real.
  2. `trazapp_record_dispensary_movement`: Sincronización de trazabilidad y stock.
  3. `trazapp_create_task`: Creación automática de tareas ante desviaciones (ej: *"Riego de contingencia"* o *"Revisar deshumidificador"*).
  4. `trazapp_update_batch_stage`: Sugerencias y transiciones de lote por acumulación térmica y fotoperiodo.
- **Experiencia de usuario conversacional:** El cultivador puede preguntarle a Gemini/Claude desde el celular:
  > *"¿Cómo viene el secado del lote B-4?"*  
  > La IA consulta a Growy vía MCP, procesa las curvas de VPD y responde con precisión agronómica.

---

## 4. Arquitectura del Componente 3D Interactivo para la Landing

### Tecnologías sugeridas en la Landing
- `@react-three/fiber` (ya instalado)
- `three` (ya instalado)
- `framer-motion` (ya instalado)
- `@react-three/drei` (para `OrbitControls`, `Float`, `Html`, `MeshTransmissionMaterial` o `Decal`)

### Características de la Experiencia 3D en la Web
1. **Renderizado PBR Fotorealista:**
   - Textura procedural o mapa normal de fibra de carbono en panel trasero y frontal.
   - Material metálico rugoso para tornillos Allen.
   - Material plástico técnico grafito con bevel suave para el cuerpo.
   - Material emisivo para la pantalla y los ojos robóticos.
   - Abrazaderas cilíndricas laterales montadas sobre caño metálico horizontal.
2. **Rotación 360° Libre / Modo Orbital:**
   - Permite al usuario rotar el hardware para apreciar la tapa trasera con el logo TrazAPP, los agarres al caño y el diseño ergonómico.
3. **Pantalla Interactiva Dinámica (Texture Canvas / HTML Overlay):**
   - Un botón o clic directo sobre la pantalla hace toggle entre **Face Mode** (los ojos robóticos que siguen el mouse) y el **Sense Mode** (el mapa de plantas interactivo).
4. **Hotspots / Puntos de Inspección Flotantes:**
   - Burbujas interactivas alrededor del modelo:
     - `[+] Sensores Suelo & Aire`
     - `[+] Pantalla Touch TrazAPP SENSE`
     - `[+] Agente IA MCP Autónomo`
     - `[+] Montaje Universal en Sala`
5. **Simulador de Casos de Uso / Split Screen:**
   - Al lado o debajo del visor 3D, un simulador donde el usuario puede elegir situaciones:
     - *Simular caída de VPD*: Growy reacciona visualmente en el 3D y la terminal de chat IA muestra la resolución automática vía MCP.
     - *Simular alerta de riego*: Notificación y creación de tarea en tiempo real.

---

## 5. Resumen del Ajuste Realizado en la Landing (Para tu referencia)
- Se ocultó el bloque `<span className="text-slate-400">Verificado REPROCANN</span>` en `app/src/components/interactive/InteractiveBatchTracker.tsx` (debajo del QR del lote).
