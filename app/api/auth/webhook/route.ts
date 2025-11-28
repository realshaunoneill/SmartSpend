import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { UserService } from '@/lib/services/user-service'

export async function POST(req: Request) {
  // Get the Svix headers for verification
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error: Missing svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Get the webhook secret from environment
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  if (!webhookSecret) {
    return new Response('Error: CLERK_WEBHOOK_SECRET not configured', {
      status: 500,
    })
  }

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(webhookSecret)

  let evt: WebhookEvent

  // Verify the webhook signature
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error: Could not verify webhook:', err)
    return new Response('Error: Verification failed', {
      status: 400,
    })
  }

  // Handle the webhook event
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses } = evt.data

    // Get the primary email address
    const primaryEmail = email_addresses.find((email) => email.id === evt.data.primary_email_address_id)

    if (!primaryEmail) {
      console.error('Error: No primary email found for user')
      return new Response('Error: No primary email', {
        status: 400,
      })
    }

    try {
      // Create user in database
      const user = await UserService.createUser(id, primaryEmail.email_address)
      console.log('User created in database:', user.id)

      return new Response(JSON.stringify({ success: true, userId: user.id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (error) {
      console.error('Error creating user in database:', error)
      return new Response('Error: Failed to create user', {
        status: 500,
      })
    }
  }

  // For other event types, just acknowledge receipt
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
