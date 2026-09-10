const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { TuyaContext } = require('@tuya/tuya-connector-nodejs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const TUYA_ACCESS_ID = process.env.TUYA_ACCESS_ID;
const TUYA_SECRET = process.env.TUYA_ACCESS_SECRET;
const TUYA_ENDPOINT = process.env.TUYA_ENDPOINT || 'https://openapi.tuyaus.com';

const context = new TuyaContext({
    baseUrl: TUYA_ENDPOINT,
    accessKey: TUYA_ACCESS_ID,
    secretKey: TUYA_SECRET,
});

app.all('/api/tuya', async (req, res) => {
    // Replicate logic from api/tuya.js
    // We can't import api/tuya.js directly if it uses specific Vercel export syntax (export default)
    // So we replicate the logic here for the local proxy.

    console.log(`[Local API] ${req.method} /api/tuya`, req.query);

    try {
        const { action } = req.query;

        if (req.method === 'GET' && action === 'get_devices') {
            const userId = process.env.TUYA_USER_UID;
            if (!userId) {
                return res.status(400).json({ error: 'TUYA_USER_UID is required to fetch devices.' });
            }

            const response = await context.request({
                method: 'GET',
                path: `/v1.0/users/${userId}/devices`,
            });

            if (!response.success) {
                console.error("Tuya API Error:", response);
                throw new Error(response.msg || 'Tuya API Error');
            }

            return res.status(200).json({ success: true, devices: response.result });
        }

        if (req.method === 'GET' && action === 'get_logs') {
            const { deviceId, start_time, end_time, type } = req.query;

            // Default time range if not provided: last 24h
            const now = new Date().getTime();
            const start = start_time || (now - 24 * 60 * 60 * 1000);
            const end = end_time || now;

            console.log(`[Local API] Fetching logs for ${deviceId} from ${start} to ${end}`);

            const response = await context.request({
                method: 'GET',
                path: `/v1.0/devices/${deviceId}/logs?start_time=${start}&end_time=${end}&type=${type || 7}&size=100`,
            });

            if (!response.success) {
                console.error("Tuya API Error Logs:", response);
                // Don't throw, just return empty or error
                return res.status(200).json({ success: false, logs: [], msg: response.msg });
            }
            return res.status(200).json({ success: true, logs: response.result });
        }

        if (req.method === 'POST') {
            const { deviceId, commands } = req.body;

            if (!deviceId || !commands) {
                return res.status(400).json({ error: 'Missing deviceId or commands' });
            }

            const response = await context.request({
                method: 'POST',
                path: `/v1.0/devices/${deviceId}/commands`,
                body: { commands }
            });

            if (!response.success) {
                console.error("Tuya API Error Command:", response);
                throw new Error(response.msg || 'Tuya API Error Command');
            }

            return res.status(200).json({ success: true, result: response.result });
        }

        return res.status(404).json({ error: 'Action not found' });

    } catch (error) {
        console.error('Tuya Handler Error:', error);
        return res.status(500).json({
            error: error.message,
        });
    }
});

app.post('/api/link-device', async (req, res) => {
    console.log(`[Local API] POST /api/link-device`, req.body);

    const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('Missing Supabase credentials in local serverless environment.');
        return res.status(500).json({ 
            error: 'Error de servidor: Variables de entorno de base de datos no configuradas.' 
        });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    try {
        const { device_id, pin, organization_id, alias } = req.body;

        // 1. Validate input
        if (!device_id || !pin || !organization_id) {
            return res.status(400).json({ error: 'device_id, pin, and organization_id are required.' });
        }

        // 2. Verify calling user's JWT
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Unauthorized — missing JWT.' });
        }
        const jwt = authHeader.replace('Bearer ', '');

        const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
        if (!supabaseAnonKey) {
            return res.status(500).json({ error: 'Error de servidor: Variable SUPABASE_ANON_KEY no configurada.' });
        }

        const supabaseUser = createClient(
            supabaseUrl,
            supabaseAnonKey,
            { global: { headers: { Authorization: `Bearer ${jwt}` } } }
        );

        const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
        if (authError || !user) {
            return res.status(401).json({ error: 'Unauthorized — invalid session.' });
        }

        // 3. Check device exists and is not already provisioned
        const { data: device, error: deviceError } = await supabaseAdmin
            .from('trazapp_devices')
            .select('id, device_id, pin, is_provisioned, is_active, organization_id')
            .eq('device_id', device_id.trim())
            .maybeSingle();

        if (deviceError) {
            console.error('DB error:', deviceError);
            return res.status(500).json({ error: 'Error interno del servidor.' });
        }

        if (!device) {
            // Auto-crear dispositivo en la base de datos y vincularlo a la organización del usuario
            const { error: createError } = await supabaseAdmin
                .from('trazapp_devices')
                .insert({
                    device_id:      device_id.trim(),
                    pin:            pin.trim(),
                    organization_id: organization_id,
                    user_id:        user.id,
                    is_provisioned: true,
                    is_active:      true,
                    alias:          alias?.trim() || null,
                });

            if (createError) {
                console.error('Failed to auto-register device:', createError);
                return res.status(500).json({ error: 'Error al registrar y vincular el dispositivo.' });
            }

            return res.status(200).json({
                success: true,
                message: `Dispositivo ${device_id} registrado y vinculado correctamente.`,
            });
        }

        if (!device.is_active) {
            return res.status(403).json({ error: 'Este dispositivo está inactivo. Contacta al soporte.' });
        }

        if (device.is_provisioned && device.organization_id) {
            return res.status(409).json({ error: 'Este dispositivo ya está vinculado a otra cuenta.' });
        }

        // 4. Verify PIN
        if (device.pin !== pin.trim()) {
            return res.status(401).json({ error: 'PIN incorrecto. Verificá los datos en la pantalla del equipo.' });
        }

        // 5. Link device to user + org
        const { error: updateError } = await supabaseAdmin
            .from('trazapp_devices')
            .update({
                organization_id,
                user_id:        user.id,
                is_provisioned: true,
                alias:          alias?.trim() || null,
            })
            .eq('device_id', device_id);

        if (updateError) {
            console.error('Failed to link device:', updateError);
            return res.status(500).json({ error: 'Error al vincular el dispositivo.' });
        }

        return res.status(200).json({
            success: true,
            message: `Dispositivo ${device_id} vinculado correctamente.`,
        });

    } catch (err) {
        console.error('Unhandled error in local link-device:', err);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});
app.listen(PORT, () => {
    console.log(`Local Tuya API proxy running on http://localhost:${PORT}`);
});

