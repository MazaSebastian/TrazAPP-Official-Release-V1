// api/link-device.js
// Vercel Serverless Function — Called by frontend when user pairs a device.
// Verifies Device ID + PIN, then assigns organization_id and user_id to the device.

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  // ─── Initialize Supabase clients inside handler to prevent loading/import time crashes ───
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase credentials in serverless environment.');
    return res.status(500).json({ 
      error: 'Error de servidor: Variables de entorno de base de datos no configuradas en Vercel (SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY).' 
    });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    const { device_id, pin, organization_id, alias } = req.body;

    // ─── 1. Validate input ─────────────────────────────────────────
    if (!device_id || !pin || !organization_id) {
      return res.status(400).json({ error: 'device_id, pin, and organization_id are required.' });
    }

    // ─── 2. Verify calling user's JWT ──────────────────────────────
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized — missing JWT.' });
    }
    const jwt = authHeader.replace('Bearer ', '');

    // Create a user-context client to verify the JWT
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

    // ─── 3. Check device exists and is not already provisioned ─────
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

    // ─── 4. Verify PIN ──────────────────────────────────────────────
    if (device.pin !== pin.trim()) {
      return res.status(401).json({ error: 'PIN incorrecto. Verificá los datos en la pantalla del equipo.' });
    }

    // ─── 5. Link device to user + org ───────────────────────────────
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
    console.error('Unhandled error in link-device:', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
