const env = require('./config/env')
const app = require('./app')
const { connectSupabase } = require('./config/supabase')

const PORT = env.PORT

const startServer = async () => {
  // Verify Supabase connection before accepting requests
  await connectSupabase()

  app.listen(PORT, () => {
    console.log(`[SERVER] Running in ${env.NODE_ENV} mode`)
    console.log(`[SERVER] Listening on http://localhost:${PORT}`)
    console.log(`[SERVER] Health check → http://localhost:${PORT}/api/health`)
  })
}

startServer()
