/* eslint-disable @typescript-eslint/no-explicit-any */


export type EventType =
  | 'ratelimit'
  | 'generate'
  | 'generate-complete'
  | 'generate-error'
  | 'generate-retry'
  | 'credits'
  | 'cache'
  | 'pricing'
  | 'cache-error'
  | 'image'
  | 'user'
  | 'image-proxy'
  | 'image-metadata'
  | 'users'
  | 'stripe'
  | 'purchases'
  | 'upload'
  | 'receipt'
  | 'receipt-process'
  | 'receipt-process-start'
  | 'receipt-process-complete'
  | 'receipt-upload'
  | 'receipt-upload-start'
  | 'receipt-upload-token'
  | 'receipt-upload-blob-complete'
  | 'receipt-upload-complete'
  | 'receipt-db-created'
  | 'receipt-status-processing'
  | 'receipt-analysis-result'
  | 'receipt-error'
  | 'database'
  | 'auth'
  | 'household'
  | 'invitation'
  | 'checkout'
  | 'subscription'
  | 'admin';
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
    data?: Record<string, unknown>,
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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Failed to log event', errorMessage);

        return false;
      }
    };

    void logEvent();
};

const submitAlert = async (
  event: EventType,
  logLine: string,
  correlationId: CorrelationId | null,
  data?: Record<string, unknown>,
) => {
  try {
    const _message = `🚨 <b>${event.toUpperCase()}</b>\n` +
      `Message: ${logLine}\n` +
      (data?.userId ? `User ID: <pre>${data.userId}</pre>` : '');

    // await sendTelegramAlert(message);
  } catch (error) {
    console.error('Failed to send alert:', error);
  }
};
