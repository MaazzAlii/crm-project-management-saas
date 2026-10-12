import Stripe from 'stripe'
import { validateStripeConfig } from './config'

const config = validateStripeConfig()

export const stripe = new Stripe(config.secretKey || 'sk_test_dummy_key_for_build', {
  apiVersion: '2025-01-27.acacia' as Stripe.LatestApiVersion,
  appInfo: {
    name: 'Innoventix Platform',
    version: '2.0.0',
  },
})
