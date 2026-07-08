import { GoogleGenerativeAI } from '@google/generative-ai'

/**
 * chatEngine.js — Agentic AI Response Engine (Powered by Gemini)
 *
 * Connects to Google Gemini 1.5 Flash to provide dynamic, context-aware answers
 * based on the user's questions and the live system state.
 */

// ── Typing delay simulation (makes the chat feel natural) ─────────────────────
export function simulateTypingDelay(text) {
  const words = text.split(/\s+/).length
  return Math.min(Math.max(words * 20, 400), 1200)
}

// ── Fallback response generator ───────────────────────────────────────────────
export function generateFallbackResponse(message) {
  const m = message.toLowerCase()
  if (/hi|hello|hey/.test(m)) return 'Hello! \u{1F44B} How can I help you today?'
  return 'I\'m currently in offline mode because the API key is missing. Please configure it in the chat header to enable full AI capabilities! \u{1F916}'
}

// ── Gemini Agentic Engine ─────────────────────────────────────────────────────
export async function generateAgenticResponse(message, history, sensors, aiResults, pumpOn, alerts, impact) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || apiKey === 'paste_your_key_here') {
    return generateFallbackResponse(message)
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    // Use flash for fast responses
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

    // Build the system context using live dashboard data
    const systemContext = `
You are the "AquaWise Assistant", a highly intelligent, helpful, and friendly agentic AI built into a water management dashboard. 
You speak directly to the client/operator. DO NOT use technical jargon (like "autoencoder", "neural networks", "JSON", etc.). 

=== LIVE SYSTEM STATE ===
Water Reservoir: ${sensors.reservoirLevel.toFixed(1)}% (Capacity: ${sensors.totalConsumed} L used today)
Water Flow Rate: ${sensors.flowRate} L/min
Leak Risk: ${aiResults?.leak?.isLeak ? 'High (Leak detected!)' : 'Low (Normal)'}
Water Quality: ${aiResults?.ph?.contaminated ? 'Contaminated (Unsafe)' : 'Safe (pH is normal)'}

Energy (Solar): ${sensors.solarProduction.toFixed(1)}W producing currently
Battery Level: ${sensors.batteryCharge.toFixed(1)}% (${sensors.batteryVoltage}V)
Solar Panel Status: ${aiResults?.panel?.needsCleaning ? 'Dirty (needs cleaning)' : 'Clean'}

Pump Power: ${pumpOn ? 'ON' : 'OFF'}
Pump Health: ${sensors.pumpHealthScore.toFixed(1)}% (Temperature: ${sensors.pumpTemp.toFixed(1)}°C)
Pump Maintenance: ${aiResults?.maintenance?.state === 2 ? 'Critical' : aiResults?.maintenance?.state === 1 ? 'Warning' : 'Healthy'}

Active Alerts: ${alerts?.length || 0}
Total Water Saved: ${(impact?.waterSavedL || 0).toFixed(0)} L
Total Energy Optimised: ${(impact?.energySavedWh || 0).toFixed(0)} Wh
==========================

INSTRUCTIONS:
1. Answer the user's latest message naturally and concisely.
2. Use markdown (bold, lists) and emojis where appropriate to make it look premium and readable.
3. If they ask about "actions they could do if there is anything not good", look at the LIVE SYSTEM STATE above for any warnings (like leaks, low battery, dirty panels, or high pump temp) and suggest concrete, actionable steps (e.g. "turn off the pump", "clean the panels", "inspect the pipeline").
4. If everything is good, reassure them that all systems are running smoothly.
5. Do not hallucinate data; stick strictly to the numbers provided in the Live System State.
6. Keep responses under 150 words unless detailed troubleshooting is requested.
`

    // Format history for Gemini
    const chatSession = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemContext }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I am the AquaWise Assistant, ready to help.' }],
        },
        // We map our simplified history to Gemini's format
        ...history.slice(1, -1).map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.text }],
        }))
      ],
      generationConfig: {
        temperature: 0.7,
      },
    })

    const result = await chatSession.sendMessage(message)
    return result.response.text()

  } catch (error) {
    console.error('Gemini API Error:', error)
    if (error.message?.includes('API key not valid') || error.message?.includes('invalid authentication credentials')) {
      return '\u26A0\uFE0F **API Key Invalid**\n\nThe provided Gemini API key is incorrect or expired. Please check your settings.'
    }
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('Too Many Requests')) {
      return '\u26A0\uFE0F **Quota Exceeded**\n\nYour API key has reached its rate limit or daily quota. Please try again later or check your billing details.'
    }
    return '\u26A0\uFE0F **Connection Error**\n\nI couldn\'t reach the AI server right now. Please try again in a moment.'
  }
}
