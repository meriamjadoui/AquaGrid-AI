/**
 * Remote leak detection helper.
 * Calls the backend ML endpoint and returns a normalized leak result.
 */

function makeTimeoutError() {
  return new Error('Leak model request timed out')
}

export async function predictLeakWithModel(features, timeoutMs = 3000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(makeTimeoutError()), timeoutMs)

  try {
    const response = await fetch('http://localhost:3001/api/predict-leak', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(features),
      signal: controller.signal,
    })

    if (!response.ok) {
      let errorBody = null
      try {
        errorBody = await response.json()
      } catch {
        errorBody = null
      }
      const statusMessage = errorBody?.error || `Leak model request failed with HTTP ${response.status}`
      const error = new Error(statusMessage)
      error.status = response.status
      error.body = errorBody
      throw error
    }

    const data = await response.json()
    return {
      isLeak: Boolean(data.isLeak),
      confidence: Number.isFinite(Number(data.confidence)) ? Number(data.confidence) : 0,
      source: 'ml-model',
    }
  } finally {
    clearTimeout(timeoutId)
  }
}