CREATE TYPE user_role AS ENUM ('customer', 'admin', 'production_staff');

CREATE TYPE order_status AS ENUM (
  'pending_payment',
  'paid',
  'in_production',
  'shipped',
  'delivered',
  'cancelled'
);

CREATE TYPE preflight_status AS ENUM ('pending', 'passed', 'failed');

CREATE TYPE production_status AS ENUM (
  'awaiting_preflight',
  'ripping',
  'on_press',
  'quality_control',
  'dispatched'
);
