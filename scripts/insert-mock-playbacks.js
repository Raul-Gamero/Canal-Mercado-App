// Script para insertar datos de reproducción de prueba
// Usa la Edge Function de Supabase para insertar datos

const SUPABASE_URL = 'YOUR_SUPABASE_URL'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/insert-playback`

// Datos de prueba
const mockPlaybacks = [
  {
    campaign_id: 'CAMPAIGN_ID_1', // Reemplaza con ID real de campaña
    device_id: 'DEVICE_ID_1',     // Reemplaza con ID real de dispositivo
    date: '2024-06-15',
    time: '10:00:00',
    duration: 30
  },
  {
    campaign_id: 'CAMPAIGN_ID_1',
    device_id: 'DEVICE_ID_2',
    date: '2024-06-15',
    time: '10:30:00',
    duration: 30
  },
  {
    campaign_id: 'CAMPAIGN_ID_2',
    device_id: 'DEVICE_ID_3',
    date: '2024-06-15',
    time: '14:00:00',
    duration: 45
  },
  {
    campaign_id: 'CAMPAIGN_ID_2',
    device_id: 'DEVICE_ID_1',
    date: '2024-06-15',
    time: '15:00:00',
    duration: 45
  },
  {
    campaign_id: 'CAMPAIGN_ID_3',
    device_id: 'DEVICE_ID_2',
    date: '2024-06-16',
    time: '09:00:00',
    duration: 60
  }
]

async function insertMockPlaybacks() {
  console.log('Iniciando inserción de datos de reproducción de prueba...')
  
  for (const playback of mockPlaybacks) {
    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify(playback)
      })

      const result = await response.json()

      if (response.ok) {
        console.log(`✅ Reproducción insertada: ${playback.date} ${playback.time} - ${playback.duration}s`)
      } else {
        console.error(`❌ Error al insertar reproducción:`, result.error)
      }
    } catch (error) {
      console.error(`❌ Error de red:`, error.message)
    }

    // Esperar un poco entre inserciones para no sobrecargar la API
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  console.log('Proceso de inserción completado.')
}

// Función para generar datos aleatorios de reproducción
function generateRandomPlaybacks(count = 10) {
  const campaigns = ['CAMPAIGN_ID_1', 'CAMPAIGN_ID_2', 'CAMPAIGN_ID_3']
  const devices = ['DEVICE_ID_1', 'DEVICE_ID_2', 'DEVICE_ID_3']
  const durations = [15, 30, 45, 60, 90]
  
  const playbacks = []
  const startDate = new Date('2024-06-01')
  
  for (let i = 0; i < count; i++) {
    const randomDate = new Date(startDate)
    randomDate.setDate(startDate.getDate() + Math.floor(Math.random() * 30))
    
    const randomHour = Math.floor(Math.random() * 24)
    const randomMinute = Math.floor(Math.random() * 60)
    
    playbacks.push({
      campaign_id: campaigns[Math.floor(Math.random() * campaigns.length)],
      device_id: devices[Math.floor(Math.random() * devices.length)],
      date: randomDate.toISOString().split('T')[0],
      time: `${randomHour.toString().padStart(2, '0')}:${randomMinute.toString().padStart(2, '0')}:00`,
      duration: durations[Math.floor(Math.random() * durations.length)]
    })
  }
  
  return playbacks
}

// Función para insertar datos aleatorios
async function insertRandomPlaybacks(count = 10) {
  console.log(`Generando ${count} reproducciones aleatorias...`)
  const randomPlaybacks = generateRandomPlaybacks(count)
  
  for (const playback of randomPlaybacks) {
    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify(playback)
      })

      const result = await response.json()

      if (response.ok) {
        console.log(`✅ Reproducción aleatoria insertada: ${playback.date} ${playback.time} - ${playback.duration}s`)
      } else {
        console.error(`❌ Error al insertar reproducción aleatoria:`, result.error)
      }
    } catch (error) {
      console.error(`❌ Error de red:`, error.message)
    }

    // Esperar un poco entre inserciones
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('Proceso de inserción aleatoria completado.')
}

// Ejecutar el script
if (require.main === module) {
  // Verificar que las variables de entorno estén configuradas
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
    console.error('❌ Error: Configura las variables SUPABASE_URL y SUPABASE_ANON_KEY en el script')
    process.exit(1)
  }

  const args = process.argv.slice(2)
  const count = parseInt(args[0]) || 10

  if (args.includes('--random')) {
    insertRandomPlaybacks(count)
  } else {
    insertMockPlaybacks()
  }
}

module.exports = {
  insertMockPlaybacks,
  insertRandomPlaybacks,
  generateRandomPlaybacks
}
