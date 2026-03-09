# Optimizaciones Pendientes (Backlog de Rendimiento)

Este documento registra planes arquitectónicos de optimización de alto nivel que se investigaron, pero fueron diferidos debido a su complejidad técnica o impacto sobre funcionalidades clave estables (ej: Drag & Drop nativo), y porque representan casos de uso extremo que actualmente no son urgentes en producción.

## 1. Virtualización de Grillas (Windowing) para Mapas de Cultivo Extremadamente Grandes

**Problema documentado:**
Cuando un usuario crea un mapa / matriz de cultivo muy grande (ej. 100x100), la aplicación renderiza simultáneamente 10,000 nodos del DOM (`GridCell`). Esto ahoga el motor de renderizado de React y el Hilo Principal (Main Thread) del navegador, produciendo congelamientos al hacer *scroll*, *hover*, o *drag & drop*.

**Estado Actual:**
Cancelado provisionalmente. Se prioriza la estabilidad de la lógica actual de multiselección y rastrillo aditivo drag-and-drop con `dnd-kit`, la cual depende de colisiones físicas de los dom nodes renderizados en su completitud. El uso de mapas de `100x100` se considera un caso extremo poco realista para los primeros clientes de producción.

**Solución Técnica Diseñada (Plan Futuro):**
Si clientes reales acusan lentitud al escalar a mapas grandes (ej: +50x50), la solución arquitectónica correcta es implementar **Windowing / Virtualización**.

### Pasos de Implementación Futura:
1. Instalar dependencias: `npm install react-window @types/react-window`
2. Refactorizar contenedor `GridContainer` en `LivingSoilGrid.tsx` y `EsquejeraGrid.tsx` para usar un `<FixedSizeGrid>` de `react-window`.
3. Esto limitará la representación del DOM a ~100-300 celdas visibles exclusivas en pantalla, manteniendo O(1) la complejidad de renderizado visual independientemente del tamaño total de la grilla teórica.
4. **Desafío Técnico a Resolver:** Al ocular nodos, el *Droppable* de `dnd-kit` perderá los targets invisibles, lo que requerirá implementar resoluciones de colisión personalizadas y virtualizar el sistema base de Drag and Drop para que reaccione matemáticamente a las coordenadas de celda sobre una grilla virtualizada, en vez de chocar el mouse contra un DIV existente.
