export async function callAI(
  system: string,
  message: string,
  maxTokens = 700
): Promise<string> {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, message, maxTokens })
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data.text || ''
  } catch (e: any) {
    throw new Error(e.message || 'AI request failed')
  }
}

export async function callAIWithHistory(
  system: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens = 700
): Promise<string> {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, messages, maxTokens })
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    return data.text || ''
  } catch (e: any) {
    throw new Error(e.message || 'AI request failed')
  }
}
