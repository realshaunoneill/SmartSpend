/* eslint-disable @typescript-eslint/no-explicit-any */

export type EventType = 'ratelimit' | 'generate' | 'generate-complete' | 'generate-error' | 'generate-retry' | 'credits' | 'image' | 'image-proxy' | 'image-metadata' | 'users' | 'stripe' | 'purchases' | 'upload';
export type CorrelationId = `${string}-${string}-${string}-${string}-${string}`;

const LOG_TOKEN = process.env.LOG_TOKEN;
const LOG_REGION = process.env.LOG_REGION;

const simpleLog = (
  event: EventType,
  logLine: string,
  correlationId: CorrelationId | null,
  data?: { [key: string]: any },
) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`DEBUG: Log ${event}:`, logLine, correlationId, data);
  } else {
    console.log(`Log ${event}:`, logLine);
  }
};

export const submitLogEvent =(
    event: EventType,
    logLine: string,
    correlationId: CorrelationId | null,
    data?: { [key: string]: any },
    alert = false,
  ) => {
    const logEvent = async () => {
      try {
        simpleLog(event, logLine, correlationId, data);
    
        if ((!LOG_TOKEN || !LOG_REGION) || process.env.NODE_ENV === 'development') {
          return true;
        }
    
        const response = await fetch(`https://${LOG_REGION.toLowerCase()}.webhook.logs.insight.rapid7.com/v1/noformat/${LOG_TOKEN}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event,
            message: logLine,
            correlationId,
            data,
          }),
        });
    
        if (!response.ok) {
          console.error('Failed to log event', response.statusText);
        }
  
        if (alert) {
          await submitAlert(event, logLine, correlationId, data);
        }
    
        return true;
      } catch (error: any) {
        console.error('Failed to log event', error.message);
    
        return false;
      }
    }

    void logEvent();
};

const submitAlert = async (
  event: EventType,
  logLine: string,
  correlationId: CorrelationId | null,
  data?: any,
) => {
  try {
    const message = `🚨 <b>${event.toUpperCase()}</b>\n` +
      `Message: ${logLine}\n` +
      (data.userId ? `User ID: <pre>${data.userId}</pre>` : '')

    // await sendTelegramAlert(message);
  } catch (error) {
    console.error('Failed to send alert:', error);
  }
};
