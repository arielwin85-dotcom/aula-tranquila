-- Tokens en profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS tokens_disponibles INTEGER DEFAULT 5;
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS tokens_totales INTEGER DEFAULT 5;

-- Tabla historial de tokens
CREATE TABLE IF NOT EXISTS token_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tipo TEXT NOT NULL,
  cantidad INTEGER NOT NULL,
  tokens_antes INTEGER NOT NULL,
  tokens_despues INTEGER NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'token_transactions' AND policyname = 'solo_propio_tokens'
  ) THEN
    CREATE POLICY "solo_propio_tokens"
      ON token_transactions FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Trigger: nuevos usuarios reciben 5 tokens
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    tokens_disponibles,
    tokens_totales,
    role
  )
  VALUES (
    new.id,
    5,
    5,
    'docente'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
