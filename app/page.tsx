import { getPortfolio } from "@/app/actions/portfolio"
import { Dashboard } from "@/components/dashboard"

export const dynamic = "force-dynamic"

export default async function Page() {
  const { stocks, mutualFunds, goals, transactions } = await getPortfolio()
  return (
    <main className="min-h-screen bg-background">
      <Dashboard stocks={stocks} funds={mutualFunds} goals={goals} transactions={transactions} />
    </main>
  )
}
