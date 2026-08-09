insert into public.permissions (key, description) values
  ('fto_resources.read', 'View FTO and above sheets, forms, SOPs and interview records')
on conflict (key) do update set
  description = excluded.description;
