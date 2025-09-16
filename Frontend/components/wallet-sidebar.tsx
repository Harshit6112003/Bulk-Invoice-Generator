// "use client"

// import { useState } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Badge } from "@/components/ui/badge"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
// import { CreditCard, Wallet, Plus, Mail, MessageSquare, Phone, TrendingUp, Download } from "lucide-react"

// interface WalletSidebarProps {
//   isOpen: boolean
//   onClose: () => void
//   credits: number
//   setCredits: (credits: number) => void
// }

// interface CreditPackage {
//   id: string
//   name: string
//   credits: number
//   price: number
//   popular?: boolean
// }

// interface Transaction {
//   id: string
//   type: "purchase" | "usage"
//   description: string
//   amount: number
//   credits: number
//   date: string
//   status: "completed" | "pending" | "failed"
// }

// export default function WalletSidebar({ isOpen, onClose, credits, setCredits }: WalletSidebarProps) {
//   const [customAmount, setCustomAmount] = useState("")
//   const [isProcessing, setIsProcessing] = useState(false)

//   const creditPackages: CreditPackage[] = [
//     { id: "starter", name: "Starter Pack", credits: 100, price: 10 },
//     { id: "business", name: "Business Pack", credits: 500, price: 40, popular: true },
//     { id: "enterprise", name: "Enterprise Pack", credits: 1000, price: 70 },
//     { id: "premium", name: "Premium Pack", credits: 2500, price: 150 },
//   ]

//   const creditRates = {
//     email: 1,
//     sms: 2,
//     whatsapp: 1.5,
//   }

//   const recentTransactions: Transaction[] = [
//     {
//       id: "1",
//       type: "purchase",
//       description: "Business Pack Purchase",
//       amount: 40,
//       credits: 500,
//       date: "2024-01-15",
//       status: "completed",
//     },
//     {
//       id: "2",
//       type: "usage",
//       description: "Email Campaign - 25 invoices",
//       amount: 0,
//       credits: -25,
//       date: "2024-01-14",
//       status: "completed",
//     },
//     {
//       id: "3",
//       type: "usage",
//       description: "SMS Campaign - 15 invoices",
//       amount: 0,
//       credits: -30,
//       date: "2024-01-13",
//       status: "completed",
//     },
//   ]

//   const purchaseCredits = async (packageInfo: CreditPackage) => {
//     setIsProcessing(true)
//     await new Promise((resolve) => setTimeout(resolve, 2000))
//     setCredits(credits + packageInfo.credits)
//     setIsProcessing(false)
//   }

//   const purchaseCustomCredits = async () => {
//     const amount = Number.parseInt(customAmount)
//     if (amount > 0) {
//       setIsProcessing(true)
//       await new Promise((resolve) => setTimeout(resolve, 2000))
//       setCredits(credits + amount)
//       setCustomAmount("")
//       setIsProcessing(false)
//     }
//   }

//   return (
//     <Sheet open={isOpen} onOpenChange={onClose}>
//       <SheetContent className="w-[600px] sm:w-[800px] overflow-y-auto">
//         <SheetHeader>
//           <SheetTitle className="flex items-center space-x-2">
//             <Wallet className="h-6 w-6" />
//             <span>Wallet & Credits</span>
//           </SheetTitle>
//           <SheetDescription>Manage your credits and view transaction history</SheetDescription>
//         </SheetHeader>

//         <div className="mt-6 space-y-6">
//           {/* Current Balance */}
//           <Card>
//             <CardContent className="p-4">
//               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                 <div className="text-center p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
//                   <div className="text-2xl font-bold">{credits}</div>
//                   <div className="text-xs opacity-90">Available Credits</div>
//                 </div>
//                 <div className="text-center p-4 bg-gray-50 rounded-lg">
//                   <div className="text-lg font-bold text-green-600">{Math.floor(credits / creditRates.email)}</div>
//                   <div className="text-xs text-gray-600">Email Sends</div>
//                 </div>
//                 <div className="text-center p-4 bg-gray-50 rounded-lg">
//                   <div className="text-lg font-bold text-blue-600">{Math.floor(credits / creditRates.sms)}</div>
//                   <div className="text-xs text-gray-600">SMS Sends</div>
//                 </div>
//                 <div className="text-center p-4 bg-gray-50 rounded-lg">
//                   <div className="text-lg font-bold text-purple-600">{Math.floor(credits / creditRates.whatsapp)}</div>
//                   <div className="text-xs text-gray-600">WhatsApp Sends</div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Tabs defaultValue="purchase" className="w-full">
//             <TabsList className="grid w-full grid-cols-3">
//               <TabsTrigger value="purchase">Purchase Credits</TabsTrigger>
//               <TabsTrigger value="rates">Credit Rates</TabsTrigger>
//               <TabsTrigger value="transactions">Transactions</TabsTrigger>
//             </TabsList>

//             <TabsContent value="purchase" className="space-y-4">
//               {/* Credit Packages */}
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                 {creditPackages.map((pkg) => (
//                   <div
//                     key={pkg.id}
//                     className={`relative border rounded-lg p-4 ${
//                       pkg.popular ? "border-blue-500 bg-blue-50" : "border-gray-200"
//                     }`}
//                   >
//                     {pkg.popular && (
//                       <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-xs">
//                         Popular
//                       </Badge>
//                     )}
//                     <div className="text-center">
//                       <h3 className="font-semibold">{pkg.name}</h3>
//                       <div className="text-2xl font-bold text-blue-600 my-1">{pkg.credits}</div>
//                       <div className="text-xs text-gray-600 mb-2">Credits</div>
//                       <div className="text-lg font-bold mb-2">${pkg.price}</div>
//                       <Button
//                         onClick={() => purchaseCredits(pkg)}
//                         disabled={isProcessing}
//                         className="w-full"
//                         size="sm"
//                         variant={pkg.popular ? "default" : "outline"}
//                       >
//                         {isProcessing ? "Processing..." : "Purchase"}
//                       </Button>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               {/* Custom Amount */}
//               <Card>
//                 <CardHeader className="pb-3">
//                   <CardTitle className="text-lg">Custom Amount</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                   <div className="flex space-x-2">
//                     <div className="flex-1">
//                       <Input
//                         type="number"
//                         placeholder="Enter credits"
//                         value={customAmount}
//                         onChange={(e) => setCustomAmount(e.target.value)}
//                       />
//                     </div>
//                     <Button onClick={purchaseCustomCredits} disabled={!customAmount || isProcessing} size="sm">
//                       <Plus className="h-4 w-4 mr-1" />
//                       Add
//                     </Button>
//                   </div>
//                   {customAmount && (
//                     <p className="text-xs text-gray-600 mt-1">
//                       Estimated cost: ${(Number.parseInt(customAmount) * 0.08).toFixed(2)}
//                     </p>
//                   )}
//                 </CardContent>
//               </Card>
//             </TabsContent>

//             <TabsContent value="rates" className="space-y-3">
//               <div className="space-y-3">
//                 <div className="flex items-center justify-between p-3 border rounded-lg">
//                   <div className="flex items-center space-x-2">
//                     <Mail className="h-5 w-5 text-blue-600" />
//                     <div>
//                       <h4 className="font-medium text-sm">Email</h4>
//                       <p className="text-xs text-gray-600">Most cost-effective</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-lg font-bold">{creditRates.email}</div>
//                     <div className="text-xs text-gray-600">credit/send</div>
//                   </div>
//                 </div>

//                 <div className="flex items-center justify-between p-3 border rounded-lg">
//                   <div className="flex items-center space-x-2">
//                     <Phone className="h-5 w-5 text-green-600" />
//                     <div>
//                       <h4 className="font-medium text-sm">SMS</h4>
//                       <p className="text-xs text-gray-600">Direct mobile</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-lg font-bold">{creditRates.sms}</div>
//                     <div className="text-xs text-gray-600">credits/send</div>
//                   </div>
//                 </div>

//                 <div className="flex items-center justify-between p-3 border rounded-lg">
//                   <div className="flex items-center space-x-2">
//                     <MessageSquare className="h-5 w-5 text-purple-600" />
//                     <div>
//                       <h4 className="font-medium text-sm">WhatsApp</h4>
//                       <p className="text-xs text-gray-600">Popular platform</p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-lg font-bold">{creditRates.whatsapp}</div>
//                     <div className="text-xs text-gray-600">credits/send</div>
//                   </div>
//                 </div>
//               </div>
//             </TabsContent>

//             <TabsContent value="transactions" className="space-y-4">
//               <div className="flex justify-between items-center">
//                 <h3 className="font-medium">Recent Transactions</h3>
//                 <Button variant="outline" size="sm">
//                   <Download className="h-4 w-4 mr-1" />
//                   Export
//                 </Button>
//               </div>

//               <div className="space-y-2">
//                 {recentTransactions.map((transaction) => (
//                   <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
//                     <div className="flex items-center space-x-2">
//                       <div
//                         className={`p-1.5 rounded-full ${
//                           transaction.type === "purchase" ? "bg-green-100" : "bg-blue-100"
//                         }`}
//                       >
//                         {transaction.type === "purchase" ? (
//                           <CreditCard className="h-3 w-3 text-green-600" />
//                         ) : (
//                           <TrendingUp className="h-3 w-3 text-blue-600" />
//                         )}
//                       </div>
//                       <div>
//                         <h4 className="font-medium text-sm">{transaction.description}</h4>
//                         <p className="text-xs text-gray-600">{transaction.date}</p>
//                       </div>
//                     </div>
//                     <div className="text-right">
//                       <div
//                         className={`font-medium text-sm ${transaction.credits > 0 ? "text-green-600" : "text-red-600"}`}
//                       >
//                         {transaction.credits > 0 ? "+" : ""}
//                         {transaction.credits}
//                       </div>
//                       {transaction.amount > 0 && <div className="text-xs text-gray-600">${transaction.amount}</div>}
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </TabsContent>
//           </Tabs>
//         </div>
//       </SheetContent>
//     </Sheet>
//   )
// }
