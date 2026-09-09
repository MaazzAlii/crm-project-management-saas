'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import OrgDetailsStep from './steps/OrgDetailsStep'
import InviteTeamStep from './steps/InviteTeamStep'
import ChoosePlanStep from './steps/ChoosePlanStep'
import OnboardingCompleteStep from './steps/OnboardingCompleteStep'
import { completeOnboarding } from '@/app/actions/onboarding'

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [orgName, setOrgName] = useState('My Agency')
  const [industryType, setIndustryType] = useState('UGC & Creative Media Agency')
  const [teamEmails, setTeamEmails] = useState<string[]>([])
  const [selectedPlan, setSelectedPlan] = useState('pro')
  const [loading, setLoading] = useState(false)
  const [orgId, setOrgId] = useState<string>('00000000-0000-0000-0000-000000000001')

  const router = useRouter()

  const handleFinish = async () => {
    setLoading(true)
    const res = await completeOnboarding({
      organizationId: orgId,
      industryType,
      teamEmails,
      planSlug: selectedPlan,
    })

    if (res.success) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setLoading(false)
    }
  }

  const steps = [
    { num: 1, title: 'Org Info' },
    { num: 2, title: 'Invite Team' },
    { num: 3, title: 'Select Plan' },
    { num: 4, title: 'Complete' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-100 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-blue-600/15 blur-3xl rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-2xl z-10 mb-8">
        <div className="flex justify-center items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
            IX
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
            Innoventix Setup
          </span>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between px-4 max-w-md mx-auto">
          {steps.map((step, idx) => {
            const isActive = currentStep === step.num
            const isCompleted = currentStep > step.num
            return (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-blue-600 text-white'
                        : isActive
                        ? 'bg-blue-500 text-white ring-4 ring-blue-500/20'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {step.num}
                  </div>
                  <span
                    className={`text-[11px] font-medium mt-1 transition-colors ${
                      isActive || isCompleted ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`w-12 sm:w-16 h-0.5 mx-2 -mt-4 transition-colors ${
                      isCompleted ? 'bg-blue-600' : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800/80 rounded-2xl">
          {currentStep === 1 && (
            <OrgDetailsStep
              orgName={orgName}
              setOrgName={setOrgName}
              industryType={industryType}
              setIndustryType={setIndustryType}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <InviteTeamStep
              teamEmails={teamEmails}
              setTeamEmails={setTeamEmails}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <ChoosePlanStep
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              onNext={() => setCurrentStep(4)}
              onBack={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <OnboardingCompleteStep
              orgName={orgName}
              loading={loading}
              onFinish={handleFinish}
            />
          )}
        </div>
      </div>
    </div>
  )
}
