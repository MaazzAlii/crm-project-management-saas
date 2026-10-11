import { describe, it, expect } from 'vitest'
import { PLANS, PlanConfig } from '@/config/plans'

describe('Prompt 03: Plan Config Rules & Seat Limits', () => {
  it('defines the three required plans: free, pro, and enterprise', () => {
    expect(PLANS).toBeDefined()
    expect(PLANS.free).toBeDefined()
    expect(PLANS.pro).toBeDefined()
    expect(PLANS.enterprise).toBeDefined()
  })

  it('configures free plan with starting values and canUseAllFeatures = true', () => {
    const free = PLANS.free
    expect(free.id).toBe('free')
    expect(free.name).toBe('Free')
    expect(free.priceMonthlyUsd).toBe(0)
    expect(free.maxMembers).toBe(3)
    expect(free.maxPendingInvites).toBe(2)
    expect(free.canUseAllFeatures).toBe(true)
    expect(Array.isArray(free.features)).toBe(true)
    expect(free.features.length).toBeGreaterThan(0)
  })

  it('configures pro plan with starting values and canUseAllFeatures = true', () => {
    const pro = PLANS.pro
    expect(pro.id).toBe('pro')
    expect(pro.name).toBe('Pro')
    expect(pro.priceMonthlyUsd).toBe(35)
    expect(pro.maxMembers).toBe(15)
    expect(pro.maxPendingInvites).toBe(20)
    expect(pro.canUseAllFeatures).toBe(true)
    expect(Array.isArray(pro.features)).toBe(true)
  })

  it('configures enterprise plan with starting values and canUseAllFeatures = true', () => {
    const ent = PLANS.enterprise
    expect(ent.id).toBe('enterprise')
    expect(ent.name).toBe('Enterprise')
    expect(ent.priceMonthlyUsd).toBeNull()
    expect(ent.maxMembers).toBe(500)
    expect(ent.maxPendingInvites).toBe(500)
    expect(ent.canUseAllFeatures).toBe(true)
    expect(Array.isArray(ent.features)).toBe(true)
  })

  it('ensures the three plans have strictly increasing maxMembers seats', () => {
    expect(PLANS.free.maxMembers).toBeLessThan(PLANS.pro.maxMembers)
    expect(PLANS.pro.maxMembers).toBeLessThan(PLANS.enterprise.maxMembers)
  })

  it('ensures the three plans have strictly increasing maxPendingInvites', () => {
    expect(PLANS.free.maxPendingInvites).toBeLessThan(PLANS.pro.maxPendingInvites)
    expect(PLANS.pro.maxPendingInvites).toBeLessThan(PLANS.enterprise.maxPendingInvites)
  })
})
