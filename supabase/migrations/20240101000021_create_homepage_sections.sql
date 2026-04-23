-- Create homepage_sections table for customizable homepage content
CREATE TABLE public.homepage_sections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_type  TEXT NOT NULL, -- 'hero', 'category_grid', 'text_block', 'image_banner'
  title         TEXT,
  subtitle      TEXT,
  content       TEXT,
  background_type TEXT NOT NULL DEFAULT 'color', -- 'color', 'image', 'gradient'
  background_value TEXT, -- hex color, image URL, or gradient CSS
  layout        TEXT DEFAULT 'default', -- 'default', 'split', 'full-width', 'centered'
  display_order INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  settings      JSONB DEFAULT '{}', -- additional flexible settings
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_homepage_sections_order ON public.homepage_sections(display_order) WHERE is_active = true;

-- Create homepage_section_items for items within sections (like category cards)
CREATE TABLE public.homepage_section_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id    UUID NOT NULL REFERENCES homepage_sections(id) ON DELETE CASCADE,
  item_type     TEXT NOT NULL, -- 'category', 'product', 'custom'
  title         TEXT,
  subtitle      TEXT,
  image_url     TEXT,
  link_url      TEXT,
  background_color TEXT,
  display_order INT NOT NULL DEFAULT 0,
  settings      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_homepage_section_items_section ON public.homepage_section_items(section_id, display_order);
