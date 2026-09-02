# 🌿 Servidor MCP Oficial de TrazAPP (`@trazapp/mcp-server`)

Servidor **Model Context Protocol (MCP)** para integrar agentes autónomos de Inteligencia Artificial (**Claude Code, Antigravity IDE, Cursor, Codex**) con la plataforma de gestión y trazabilidad agronómica **TrazAPP**.

---

## 🚀 Capacidades Soportadas

### 🛠️ Herramientas (Tools)
* `trazapp_list_rooms`: Lista de salas de cultivo activas con parámetros ambientales recomendados.
* `trazapp_get_room_details`: Detalle de sala con lotes alojados y tareas pendientes.
* `trazapp_list_batches`: Consulta de lotes por etapa (esquejes, vegetativo, floración, secado).
* `trazapp_create_batch`: Creación de nuevos lotes y registro de trazabilidad genealógica.
* `trazapp_update_batch_stage`: Avance de fase fenológica o reubicación de sala.
* `trazapp_list_crops` / `trazapp_create_crop`: Gestión de temporadas y ciclos generales.
* `trazapp_list_tasks` / `trazapp_create_task` / `trazapp_complete_task`: Automatización de tareas de riego, podas, fertilización y controles fitosanitarios.
* `trazapp_list_insumos`: Monitoreo de stock de fertilizantes, sustratos y preventivos (alerta de stock crítico).
* `trazapp_list_dispensary_stock` / `trazapp_record_dispensary_movement`: Control de inventario de medicina y registro de entregas a pacientes.
* `trazapp_get_room_telemetry` / `trazapp_list_iot_devices`: Lectura en tiempo real de sensores IoT (temperatura, humedad, VPD) y evaluación contra rangos ideales.

### 📚 Recursos (Resources)
* `trazapp://org/daily-overview`: Snapshot en tiempo real del estado consolidado del cultivo.

### 💡 Prompts Guiados (Prompts)
* `trazapp_climate_audit`: Auditoría climática integral y diagnóstico agronómico autónomo.
* `trazapp_daily_briefing`: Resumen operativo matutino para cultivadores y directores técnicos.

---

## 📦 Instalación y Compilación

1. **Instalar dependencias**:
   ```bash
   cd mcp-server
   npm install
   ```

2. **Compilar TypeScript**:
   ```bash
   npm run build
   ```

---

## ⚙️ Configuración en Clientes de IA

### 1. Claude Desktop / Claude Code (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "trazapp": {
      "command": "node",
      "args": ["/ABSOLUTE_PATH/TrazAPP V1/mcp-server/dist/index.js"],
      "env": {
        "TRAZAPP_SUPABASE_URL": "https://tu-proyecto.supabase.co",
        "TRAZAPP_SUPABASE_KEY": "tu-service-role-key-o-anon-key",
        "TRAZAPP_ORGANIZATION_ID": "tu-organization-id-aqui"
      }
    }
  }
}
```

### 2. Antigravity IDE (`.agents/mcp_config.json` o `antigravity-ide`)
```json
{
  "mcpServers": {
    "trazapp": {
      "command": "node",
      "args": ["${workspaceRoot}/mcp-server/dist/index.js"],
      "env": {
        "TRAZAPP_SUPABASE_URL": "${env:REACT_APP_SUPABASE_URL}",
        "TRAZAPP_SUPABASE_KEY": "${env:REACT_APP_SUPABASE_ANON_KEY}",
        "TRAZAPP_ORGANIZATION_ID": "uuid-de-tu-organizacion"
      }
    }
  }
}
```

---

## 🔐 Seguridad y Multi-Tenancy
El servidor garantiza aislamiento total mediante `TRAZAPP_ORGANIZATION_ID`, aplicando filtros automáticos a todas las consultas de la base de datos Supabase.
