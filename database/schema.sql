-- ========================================================
-- Schema de Base de Datos para Aplicación de Citas (CitasYa / Spark)
-- Compatible con Supabase (PostgreSQL)
-- ========================================================

-- Habilitar extensión UUID si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Perfiles de Usuario
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL CHECK (age >= 18),
    gender VARCHAR(20) NOT NULL DEFAULT 'mujer',
    interested_in VARCHAR(20) NOT NULL DEFAULT 'todos',
    bio TEXT DEFAULT '',
    city VARCHAR(100) DEFAULT 'Ciudad de México',
    occupation VARCHAR(100) DEFAULT '',
    photos JSONB DEFAULT '[]'::jsonb,
    interests JSONB DEFAULT '[]'::jsonb,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Swipes (Deslizamientos: Like, Pass, Superlike)
CREATE TABLE IF NOT EXISTS public.swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN ('like', 'pass', 'superlike')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_target_swipe UNIQUE (user_id, target_id)
);

-- 3. Tabla de Matches (Coincidencias mutuas)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_match_pair UNIQUE (user1_id, user2_id)
);

-- 4. Tabla de Mensajes (Chat de matches)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para optimizar consultas de descubrimiento y chat
CREATE INDEX IF NOT EXISTS idx_swipes_user_target ON public.swipes(user_id, target_id);
CREATE INDEX IF NOT EXISTS idx_matches_users ON public.matches(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_match ON public.messages(match_id, created_at ASC);

-- Desactivar RLS o crear políticas públicas para API directa con clave anónima o service_role
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas para la API backend
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Profiles') THEN
        CREATE POLICY "Public Access Profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Swipes') THEN
        CREATE POLICY "Public Access Swipes" ON public.swipes FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Matches') THEN
        CREATE POLICY "Public Access Matches" ON public.matches FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public Access Messages') THEN
        CREATE POLICY "Public Access Messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- Datos de Ejemplo (Seed) para probar inmediatamente la aplicación
INSERT INTO public.profiles (id, email, password_hash, name, age, gender, interested_in, bio, city, occupation, photos, interests, is_demo)
VALUES
('00000000-0000-0000-0000-000000000001', 'demo@citasya.com', '$2b$10$wT8KzI496VfCjE288j/hpeq7hO6Z.oM03t8c6Y1yJ9M9pUv2qD3wS', 'Alex Rivera', 25, 'hombre', 'todos', 'Amante de la tecnología, buen café y escapadas de fin de semana. ¡Busco a alguien para compartir buenas charlas y risas!', 'Ciudad de México', 'Desarrollador de Software', '["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80"]'::jsonb, '["Tecnología", "Café", "Viajes", "Fotografía", "Música"]'::jsonb, TRUE),

('00000000-0000-0000-0000-000000000002', 'sofia@citasya.com', '$2b$10$wT8KzI496VfCjE288j/hpeq7hO6Z.oM03t8c6Y1yJ9M9pUv2qD3wS', 'Sofía Castillo', 24, 'mujer', 'hombres', 'Diseñadora gráfica & fotógrafa aficionada 🎨. Me encantan los museos, la comida italiana y los perritos.', 'Guadalajara', 'Diseñadora Gráfica', '["https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"]'::jsonb, '["Arte", "Diseño", "Fotografía", "Perros", "Cine"]'::jsonb, TRUE),

('00000000-0000-0000-0000-000000000003', 'valentina@citasya.com', '$2b$10$wT8KzI496VfCjE288j/hpeq7hO6Z.oM03t8c6Y1yJ9M9pUv2qD3wS', 'Valentina Méndez', 26, 'mujer', 'hombres', 'Apasionada del senderismo, el yoga y los viajes de aventura ✈️🌿. Siempre lista para un buen taco.', 'Monterrey', 'Arquitecta', '["https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80"]'::jsonb, '["Senderismo", "Yoga", "Viajes", "Gastronomía", "Naturaleza"]'::jsonb, TRUE),

('00000000-0000-0000-0000-000000000004', 'carlos@citasya.com', '$2b$10$wT8KzI496VfCjE288j/hpeq7hO6Z.oM03t8c6Y1yJ9M9pUv2qD3wS', 'Carlos Gómez', 27, 'hombre', 'mujeres', 'Músico de corazón 🎸. Toco la guitarra, adoro los conciertos indie y cocinar para los amigos.', 'Ciudad de México', 'Productor Musical', '["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"]'::jsonb, '["Música", "Guitarra", "Conciertos", "Cocina", "Series"]'::jsonb, TRUE),

('00000000-0000-0000-0000-000000000005', 'camila@citasya.com', '$2b$10$wT8KzI496VfCjE288j/hpeq7hO6Z.oM03t8c6Y1yJ9M9pUv2qD3wS', 'Camila Herrera', 23, 'mujer', 'todos', 'Estudiante de medicina 🩺. Fanática de los libros de misterio, maratones de Netflix y sushi.', 'Puebla', 'Estudiante de Medicina', '["https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"]'::jsonb, '["Libros", "Medicina", "Netflix", "Sushi", "Playa"]'::jsonb, TRUE),

('00000000-0000-0000-0000-000000000006', 'mateo@citasya.com', '$2b$10$wT8KzI496VfCjE288j/hpeq7hO6Z.oM03t8c6Y1yJ9M9pUv2qD3wS', 'Mateo Silva', 28, 'hombre', 'mujeres', 'Crossfit, running y vida activa 🏃‍♂️. Me fascina acampar bajo las estrellas.', 'Querétaro', 'Entrenador Personal', '["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80"]'::jsonb, '["Fitness", "Running", "Aventura", "Camping", "Nutrición"]'::jsonb, TRUE)
ON CONFLICT (id) DO NOTHING;
