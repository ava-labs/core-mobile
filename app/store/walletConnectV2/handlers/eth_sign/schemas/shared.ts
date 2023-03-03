import { z } from 'zod'

export const messageSchema = z.string().describe('message')

export const addressSchema = z.string().describe('address')
