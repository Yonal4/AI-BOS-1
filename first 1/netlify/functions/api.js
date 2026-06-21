import serverless from 'serverless-http'
import app from '../../server.js'

const expressHandler = serverless(app)

export async function handler(event, context) {
  const prefix = '/.netlify/functions/api'
  if (event.path?.startsWith(prefix)) {
    event.path = event.path.slice(prefix.length) || '/'
  }
  return expressHandler(event, context)
}
