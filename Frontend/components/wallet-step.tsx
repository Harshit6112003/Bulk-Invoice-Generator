"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Wallet, Plus, Mail, MessageSquare, Phone, TrendingUp, Download } from "lucide-react"

interface WalletStepProps {
  credits: number
  setCredits: (credits: number) => void
}

interface CreditPackage {
  id: string
  name: string
  credits: number
  price: number
  popular?: boolean
}

interface Transaction {
  id: string
  type: "purchase" | "usage"
  description: string
  amount: number
  credits: number
  date: string
  status: "completed" | "pending" | "failed"
}

export default function WalletStep({ credits, setCredits }: WalletStepProps) {
  const [customAmount, setCustomAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const creditPackages: CreditPackage[] = [
    { id: "starter", name: "Starter Pack", credits: 100, price: 10 },
    { id: "business", name: "Business Pack", credits: 500, price: 40, popular: true },
    { id: "enterprise", name: "Enterprise Pack", credits: 1000, price: 70 },
    { id: "premium", name: "Premium Pack", credits: 2500, price: 150 },
  ]

  const creditRates = {
    email: 1,
    sms: 2,
    whatsapp: 1.5,
  }

  const recentTransactions: Transaction[] = [
    {
      id: "1",
      type: "purchase",
      description: "Business Pack Purchase",
      amount: 40,
      credits: 500,
      date: "2024-01-15",
      status: "completed",
    },
    {
      id: "2",
      type: "usage",
      description: "Email Campaign - 25 invoices",
      amount: 0,
      credits: -25,
      date: "2024-01-14",
      status: "completed",
    },
    {
      id: "3",
      type: "usage",
      description: "SMS Campaign - 15 invoices",
      amount: 0,
      credits: -30,
      date: "2024-01-13",
      status: "completed",
    },
  ]

  const purchaseCredits = async (packageInfo: CreditPackage) => {
    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setCredits(credits + packageInfo.credits)
    setIsProcessing(false)
  }

  const purchaseCustomCredits = async () => {
    const amount = Number.parseInt(customAmount)
    if (amount > 0) {
      setIsProcessing(true)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setCredits(credits + amount)
      setCustomAmount("")
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Balance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="h-6 w-6" />
            <span>Wallet Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
              <div className="text-3xl font-bold">{credits}</div>
              <div className="text-sm opacity-90">Available Credits</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{Math.floor(credits / creditRates.email)}</div>
              <div className="text-sm text-gray-600">Email Sends</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{Math.floor(credits / creditRates.sms)}</div>
              <div className="text-sm text-gray-600">SMS Sends</div>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{Math.floor(credits / creditRates.whatsapp)}</div>
              <div className="text-sm text-gray-600">WhatsApp Sends</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="purchase" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="purchase">Purchase Credits</TabsTrigger>
          <TabsTrigger value="rates">Credit Rates</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>

        <TabsContent value="purchase" className="space-y-6">
          {/* Credit Packages */}
          <Card>
            <CardHeader>
              <CardTitle>Credit Packages</CardTitle>
              <CardDescription>Choose a credit package that fits your needs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {creditPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative border rounded-lg p-6 ${
                      pkg.popular ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    {pkg.popular && (
                      <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                        Most Popular
                      </Badge>
                    )}
                    <div className="text-center">
                      <h3 className="font-semibold text-lg">{pkg.name}</h3>
                      <div className="text-3xl font-bold text-blue-600 my-2">{pkg.credits}</div>
                      <div className="text-sm text-gray-600 mb-4">Credits</div>
                      <div className="text-2xl font-bold mb-4">${pkg.price}</div>
                      <div className="text-sm text-gray-500 mb-4">
                        ${(pkg.price / pkg.credits).toFixed(3)} per credit
                      </div>
                      <Button
                        onClick={() => purchaseCredits(pkg)}
                        disabled={isProcessing}
                        className="w-full"
                        variant={pkg.popular ? "default" : "outline"}
                      >
                        {isProcessing ? "Processing..." : "Purchase"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Amount */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Amount</CardTitle>
              <CardDescription>Purchase a custom number of credits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 max-w-md">
                <div className="flex-1">
                  <Label htmlFor="customAmount">Number of Credits</Label>
                  <Input
                    id="customAmount"
                    type="number"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={purchaseCustomCredits} disabled={!customAmount || isProcessing}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Credits
                  </Button>
                </div>
              </div>
              {customAmount && (
                <p className="text-sm text-gray-600 mt-2">
                  Estimated cost: ${(Number.parseInt(customAmount) * 0.08).toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Credit Rates</CardTitle>
              <CardDescription>Cost per send for each channel</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-6 w-6 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Email</h4>
                      <p className="text-sm text-gray-600">Most cost-effective option</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{creditRates.email}</div>
                    <div className="text-sm text-gray-600">credit per send</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-6 w-6 text-green-600" />
                    <div>
                      <h4 className="font-medium">SMS</h4>
                      <p className="text-sm text-gray-600">Direct mobile messaging</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{creditRates.sms}</div>
                    <div className="text-sm text-gray-600">credits per send</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                    <div>
                      <h4 className="font-medium">WhatsApp</h4>
                      <p className="text-sm text-gray-600">Popular messaging platform</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{creditRates.whatsapp}</div>
                    <div className="text-sm text-gray-600">credits per send</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Transaction History</span>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardTitle>
              <CardDescription>Your recent credit purchases and usage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.type === "purchase" ? "bg-green-100" : "bg-blue-100"
                        }`}
                      >
                        {transaction.type === "purchase" ? (
                          <CreditCard className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{transaction.description}</h4>
                        <p className="text-sm text-gray-600">{transaction.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${transaction.credits > 0 ? "text-green-600" : "text-red-600"}`}>
                        {transaction.credits > 0 ? "+" : ""}
                        {transaction.credits} credits
                      </div>
                      {transaction.amount > 0 && <div className="text-sm text-gray-600">${transaction.amount}</div>}
                      <Badge
                        variant={
                          transaction.status === "completed"
                            ? "default"
                            : transaction.status === "pending"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
