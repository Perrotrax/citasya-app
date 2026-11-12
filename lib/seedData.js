// Datos iniciales de perfiles para desarrollo local y demo
const initialProfiles = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    email: "demo@citasya.com",
    password_hash: "$2b$10$wT8KzI496VfCjE288j/hpeq7hO6Z.oM03t8c6Y1yJ9M9pUv2qD3wS", // password123
    name: "Alex Rivera",
    age: 25,
    gender: "hombre",
    interested_in: "todos",
    bio: "Amante de la tecnología, buen café ☕ y escapadas de fin de semana. ¡Busco a alguien para compartir buenas charlas y risas!",
    city: "Ciudad de México",
    occupation: "Desarrollador de Software",
    photos: [
      "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=800&q=80"
    ],
    interests: ["Tecnología", "Café", "Viajes", "Fotografía", "Música"],
    is_demo: true,
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    email: "sofia@citasya.com",
    password_hash: "$2b$10$wT8KzI496VfCjE288j/hpeq7hO6Z.oM03t8c6Y1yJ9M9pUv2qD3wS",
    name: "Sofía Castillo",
    age: 24,
    gender: "mujer",
    interested_in: "hombres",
    bio: "Diseñadora gráfica & fotógrafa aficionada 🎨. Me encantan los museos, la comida italiana y los perritos.",
    city: "Guadalajara",
    occupation: "Diseñadora Gráfica",
    photos: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80"
    ],
    interests: ["Arte", "Diseño", "Fotografía", "Perros", "Cine"],
    is_demo: true,
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    email: "valentina@citasya.com",
    password_hash: "$2b$10$wT8KzI496VfCjE288j/hpeq7hO6Z.oM03t8c6Y1yJ9M9pUv2qD3wS",
    name: "Valentina Méndez",
    age: 26,
    gender: "mujer",
    interested_in: "hombres",
    bio: "Apasionada del senderismo, el yoga y los viajes de aventura ✈️🌿. Siempre lista para un buen taco y descubrir terrazas con buena música.",
    city: "Monterrey",
    occupation: "Arquitecta",
    photos: [
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
    ],
    interests: ["Senderismo", "Yoga", "Viajes", "Gastronomía", "Naturaleza"],
    is_demo: true,
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    email: "carlos@citasya.com",
    password_hash: "$2b$10$wT8KzI496VfCjE288j/hpeq7hO6Z.oM03t8c6Y1yJ9M9pUv2qD3wS",
    name: "Carlos Gómez",
    age: 27,
    gender: "hombre",
    interested_in: "mujeres",
    bio: "Músico de corazón 🎸. Toco la guitarra, adoro los festivales indie y cocinar pasta para mis amigos.",
    city: "Ciudad de México",
    occupation: "Productor Musical",
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80"
    ],
    interests: ["Música", "Guitarra", "Conciertos", "Cocina", "Series"],
    is_demo: true,
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    email: "camila@citasya.com",
    password_hash: "$2b$10$wT8KzI496VfCjE288j/hpeq7hO6Z.oM03t8c6Y1yJ9M9pUv2qD3wS",
    name: "Camila Herrera",
    age: 23,
    gender: "mujer",
    interested_in: "todos",
    bio: "Estudiante de medicina 🩺. Fanática de los libros de misterio, maratones de series y sushi nocturno. Busco planes tranquilos.",
    city: "Puebla",
    occupation: "Estudiante de Medicina",
    photos: [
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80"
    ],
    interests: ["Libros", "Medicina", "Netflix", "Sushi", "Playa"],
    is_demo: true,
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    email: "mateo@citasya.com",
    password_hash: "$2b$10$wT8KzI496VfCjE288j/hpeq7hO6Z.oM03t8c6Y1yJ9M9pUv2qD3wS",
    name: "Mateo Silva",
    age: 28,
    gender: "hombre",
    interested_in: "mujeres",
    bio: "Crossfit, running y vida activa 🏃‍♂️. Me fascina acampar bajo las estrellas y las escapadas espontáneas a la playa.",
    city: "Querétaro",
    occupation: "Entrenador Personal",
    photos: [
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80"
    ],
    interests: ["Fitness", "Running", "Aventura", "Camping", "Nutrición"],
    is_demo: true,
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000007",
    email: "lucia@citasya.com",
    password_hash: "$2b$10$wT8KzI496VfCjE288j/hpeq7hO6Z.oM03t8c6Y1yJ9M9pUv2qD3wS",
    name: "Lucía Morales",
    age: 25,
    gender: "mujer",
    interested_in: "todos",
    bio: "Sommelier y bartender aficionada 🍷✨. Fan de la buena coctelería, museos y atardeceres. Si tienes perrito ya tienes puntos extras.",
    city: "Ciudad de México",
    occupation: "Sommelier / Hostess",
    photos: [
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80"
    ],
    interests: ["Vino", "Coctelería", "Arte", "Mascotas", "Viajes"],
    is_demo: true,
    created_at: new Date().toISOString()
  }
];

module.exports = { initialProfiles };
