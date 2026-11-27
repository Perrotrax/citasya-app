const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { initialProfiles } = require('./seedData');

// Variables de entorno de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let isSupabaseActive = false;

if (supabaseUrl || supabaseKey) {
  if (!supabaseUrl || !supabaseUrl.startsWith('https://') || !supabaseKey) {
    throw new Error('Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para usar Supabase.');
  }
  supabase = createClient(supabaseUrl, supabaseKey);
  isSupabaseActive = true;
  console.log('✅ Supabase configurado.');
} else {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY antes del despliegue.');
  }
  console.log('ℹ️ Variables de Supabase no detectadas. Usando base de datos local en memoria/JSON.');
}

// ==========================================
// Base de datos Local Fallback (JSON)
// ==========================================
const dataDir = path.join(__dirname, '..', 'data');
const dbFilePath = path.join(dataDir, 'local_db.json');

let localDb = {
  profiles: [...initialProfiles],
  swipes: [],
  matches: [
    // Match inicial para que el usuario demo pueda probar el chat de inmediato!
    {
      id: "match-demo-001",
      user1_id: "00000000-0000-0000-0000-000000000001", // Alex Rivera
      user2_id: "00000000-0000-0000-0000-000000000002", // Sofía Castillo
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ],
  messages: [
    {
      id: "msg-001",
      match_id: "match-demo-001",
      sender_id: "00000000-0000-0000-0000-000000000002",
      text: "¡Hola! Vi que te encanta la fotografía y el café, ¿cuál es tu cafetería favorita de la ciudad?",
      created_at: new Date(Date.now() - 3500000).toISOString()
    }
  ]
};

// Cargar o inicializar archivo local
function initLocalDb() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (fs.existsSync(dbFilePath)) {
      const data = fs.readFileSync(dbFilePath, 'utf8');
      localDb = JSON.parse(data);
    } else {
      saveLocalDb();
    }
  } catch (err) {
    console.error('Error al inicializar base de datos local:', err);
  }
}

function saveLocalDb() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dbFilePath, JSON.stringify(localDb, null, 2), 'utf8');
  } catch (err) {
    console.error('Error al guardar base de datos local:', err);
  }
}

initLocalDb();

// ==========================================
// MÉTODOS DE BASE DE DATOS UNIFICADOS
// ==========================================

async function getDbStatus() {
  return {
    provider: isSupabaseActive ? 'supabase' : 'local_json',
    supabaseUrl: isSupabaseActive ? supabaseUrl : null,
    connected: true
  };
}

async function getProfileByEmail(email) {
  if (isSupabaseActive) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Error en Supabase getProfileByEmail:', error);
    }
    return data;
  }
  return localDb.profiles.find(p => p.email.toLowerCase() === email.toLowerCase()) || null;
}

async function getProfileById(id) {
  if (isSupabaseActive) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) console.error('Error en Supabase getProfileById:', error);
    return data;
  }
  return localDb.profiles.find(p => p.id === id) || null;
}

async function createProfile(profileData) {
  const newProfile = {
    id: uuidv4(),
    email: profileData.email.toLowerCase(),
    password_hash: profileData.password_hash,
    name: profileData.name,
    age: parseInt(profileData.age) || 20,
    gender: profileData.gender || 'hombre',
    interested_in: profileData.interested_in || 'todos',
    bio: profileData.bio || '',
    city: profileData.city || 'Ciudad de México',
    occupation: profileData.occupation || '',
    photos: Array.isArray(profileData.photos) && profileData.photos.length > 0 
      ? profileData.photos 
      : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'],
    interests: Array.isArray(profileData.interests) ? profileData.interests : ['Música', 'Café', 'Viajes'],
    is_demo: false,
    created_at: new Date().toISOString()
  };

  if (isSupabaseActive) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([newProfile])
      .select()
      .single();
    if (error) throw new Error('Error al guardar en Supabase: ' + error.message);
    return data;
  }

  localDb.profiles.push(newProfile);
  saveLocalDb();
  return newProfile;
}

async function updateProfile(id, updates) {
  if (isSupabaseActive) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error('Error al actualizar en Supabase: ' + error.message);
    return data;
  }

  const index = localDb.profiles.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Perfil no encontrado');
  localDb.profiles[index] = { ...localDb.profiles[index], ...updates };
  saveLocalDb();
  return localDb.profiles[index];
}

async function getDiscoverProfiles(userId, filters = {}) {
  let swipedTargetIds = [];

  if (isSupabaseActive) {
    const { data: swipes } = await supabase
      .from('swipes')
      .select('target_id')
      .eq('user_id', userId);
    if (swipes) {
      swipedTargetIds = swipes.map(s => s.target_id);
    }

    let query = supabase
      .from('profiles')
      .select('id, name, age, gender, interested_in, bio, city, occupation, photos, interests')
      .neq('id', userId);

    if (swipedTargetIds.length > 0) {
      query = query.not('id', 'in', `(${swipedTargetIds.join(',')})`);
    }

    if (filters.gender && filters.gender !== 'todos') {
      query = query.eq('gender', filters.gender);
    }

    const { data, error } = await query.limit(20);
    if (error) console.error('Error al buscar perfiles en Supabase:', error);
    return data || [];
  }

  // Modo Local
  swipedTargetIds = localDb.swipes
    .filter(s => s.user_id === userId)
    .map(s => s.target_id);

  let results = localDb.profiles.filter(p => p.id !== userId && !swipedTargetIds.includes(p.id));

  if (filters.gender && filters.gender !== 'todos') {
    results = results.filter(p => p.gender === filters.gender);
  }

  return results.slice(0, 20);
}

async function recordSwipe(userId, targetId, action) {
  const swipeRecord = {
    id: uuidv4(),
    user_id: userId,
    target_id: targetId,
    action: action, // 'like', 'pass', 'superlike'
    created_at: new Date().toISOString()
  };

  let isMatch = false;
  let matchData = null;

  if (action === 'like' || action === 'superlike') {
    // Comprobar si el usuario objetivo también le dio like al usuario actual
    let reciprocalSwipe = null;

    if (isSupabaseActive) {
      const { data } = await supabase
        .from('swipes')
        .select('*')
        .eq('user_id', targetId)
        .eq('target_id', userId)
        .in('action', ['like', 'superlike'])
        .single();
      reciprocalSwipe = data;
    } else {
      reciprocalSwipe = localDb.swipes.find(
        s => s.user_id === targetId && s.target_id === userId && (s.action === 'like' || s.action === 'superlike')
      );
    }

    if (reciprocalSwipe) {
      isMatch = true;
      // Crear registro de Match
      matchData = await createMatch(userId, targetId);
    }
  }

  if (isSupabaseActive) {
    await supabase.from('swipes').upsert([swipeRecord], { onConflict: 'user_id,target_id' });
  } else {
    // Filtrar duplicados previos si hubiera
    localDb.swipes = localDb.swipes.filter(s => !(s.user_id === userId && s.target_id === targetId));
    localDb.swipes.push(swipeRecord);
    saveLocalDb();
  }

  return {
    swipe: swipeRecord,
    isMatch,
    match: matchData
  };
}

async function createMatch(user1Id, user2Id) {
  // Aseguramos orden consistente para evitar duplicados invertidos
  const [u1, u2] = [user1Id, user2Id].sort();

  const newMatch = {
    id: uuidv4(),
    user1_id: u1,
    user2_id: u2,
    created_at: new Date().toISOString()
  };

  if (isSupabaseActive) {
    const { data, error } = await supabase
      .from('matches')
      .upsert([newMatch], { onConflict: 'user1_id,user2_id' })
      .select()
      .single();
    if (error) console.error('Error al crear match en Supabase:', error);
    return data || newMatch;
  }

  const existing = localDb.matches.find(m => m.user1_id === u1 && m.user2_id === u2);
  if (!existing) {
    localDb.matches.push(newMatch);
    saveLocalDb();
    return newMatch;
  }
  return existing;
}

async function getMatches(userId) {
  let userMatches = [];

  if (isSupabaseActive) {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (error) {
      console.error('Error al obtener matches en Supabase:', error);
      return [];
    }
    userMatches = matches || [];
  } else {
    userMatches = localDb.matches.filter(m => m.user1_id === userId || m.user2_id === userId);
  }

  // Enriquecer con la información del otro usuario y el último mensaje
  const enriched = [];
  for (const m of userMatches) {
    const otherUserId = m.user1_id === userId ? m.user2_id : m.user1_id;
    const otherProfile = await getProfileById(otherUserId);
    if (!otherProfile) continue;

    // Obtener último mensaje
    let lastMsg = null;
    if (isSupabaseActive) {
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', m.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (msgs && msgs.length > 0) lastMsg = msgs[0];
    } else {
      const msgs = localDb.messages.filter(msg => msg.match_id === m.id);
      if (msgs.length > 0) {
        lastMsg = msgs[msgs.length - 1];
      }
    }

    enriched.push({
      match_id: m.id,
      created_at: m.created_at,
      user: {
        id: otherProfile.id,
        name: otherProfile.name,
        age: otherProfile.age,
        photos: otherProfile.photos,
        occupation: otherProfile.occupation,
        city: otherProfile.city
      },
      last_message: lastMsg
    });
  }

  return enriched;
}

async function getMessages(matchId) {
  if (isSupabaseActive) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });
    if (error) console.error('Error al obtener mensajes en Supabase:', error);
    return data || [];
  }

  return localDb.messages.filter(m => m.match_id === matchId);
}

async function sendMessage(matchId, senderId, text) {
  const newMsg = {
    id: uuidv4(),
    match_id: matchId,
    sender_id: senderId,
    text: text.trim(),
    created_at: new Date().toISOString()
  };

  if (isSupabaseActive) {
    const { data, error } = await supabase
      .from('messages')
      .insert([newMsg])
      .select()
      .single();
    if (error) throw new Error('Error al enviar mensaje en Supabase: ' + error.message);
    return data;
  }

  localDb.messages.push(newMsg);
  saveLocalDb();
  return newMsg;
}

// Restablecer swipes para poder volver a ver todos los perfiles de demostración
async function resetSwipes(userId) {
  if (isSupabaseActive) {
    await supabase.from('swipes').delete().eq('user_id', userId);
  } else {
    localDb.swipes = localDb.swipes.filter(s => s.user_id !== userId);
    saveLocalDb();
  }
  return true;
}

module.exports = {
  getDbStatus,
  getProfileByEmail,
  getProfileById,
  createProfile,
  updateProfile,
  getDiscoverProfiles,
  recordSwipe,
  createMatch,
  getMatches,
  getMessages,
  sendMessage,
  resetSwipes
};

