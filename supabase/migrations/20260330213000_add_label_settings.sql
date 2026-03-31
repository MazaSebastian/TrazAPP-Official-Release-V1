-- Add label_settings JSONB column to organizations for white-labeling prints

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS label_settings JSONB DEFAULT '{
    "themeMode": "color",
    "primaryColor": "#0f172a",
    "secondaryColor": "#38bdf8",
    "fontFamily": "Inter",
    "backgroundPattern": "none",
    "showAddress": false,
    "addressText": "",
    "phoneText": ""
  }'::jsonb;
