"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Mail, MessageSquare, Phone, Calendar, Users, DollarSign, TrendingUp } from "lucide-react"

interface HistoryStepProps {
  sendingHistory: any[]
}

interface Campaign {
  id: string
  name: string
  date: string
  totalInvoices: number
  totalAmount: number
  channels: string[]
  status: "completed" | "in-progress" | "failed"
  successRate: number
  creditsUsed: number
}

export default function HistoryStep({ sendingHistory }: HistoryStepProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterChannel, setFilterChannel] = useState("all")

  
  const campaigns: Campaign[] = [
    {
      id: "1",
      name: "January Invoice Batch",
      date: "2024-01-15",
      totalInvoices: 45,
      totalAmount: 52000,
      channels: ["email", "sms"],
      status: "completed",
      successRate: 95.6,
      creditsUsed: 135,
    },
    {
      id: "2",
      name: "Client Reminders",
      date: "2024-01-10",
      totalInvoices: 23,
      totalAmount: 28500,
      channels: ["email", "whatsapp"],
      status: "completed",
      successRate: 91.3,
      creditsUsed: 58,
    },
    {
      id: "3",
      name: "Monthly Billing",
      date: "2024-01-05",
      totalInvoices: 67,
      totalAmount: 89200,
      channels: ["email", "sms", "whatsapp"],
      status: "completed",
      successRate: 88.1,
      creditsUsed: 201,
    },
    {
      id: "4",
      name: "Quarterly Reports",
      date: "2024-01-01",
      totalInvoices: 12,
      totalAmount: 15600,
      channels: ["email"],
      status: "failed",
      successRate: 0,
      creditsUsed: 0,
    },
  ]

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="h-4 w-4" />
      case "sms":
        return <Phone className="h-4 w-4" />
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      "in-progress": "secondary",
      failed: "destructive",
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || campaign.status === filterStatus
    const matchesChannel = filterChannel === "all" || campaign.channels.includes(filterChannel)
    return matchesSearch && matchesStatus && matchesChannel
  })

  const exportHistory = () => {
    const csvContent = [
      ["Campaign Name", "Date", "Total Invoices", "Total Amount", "Channels", "Status", "Success Rate", "Credits Used"],
      ...filteredCampaigns.map((campaign) => [
        campaign.name,
        campaign.date,
        campaign.totalInvoices,
        campaign.totalAmount,
        campaign.channels.join(", "),
        campaign.status,
        `${campaign.successRate}%`,
        campaign.creditsUsed,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sending-history.csv"
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const totalStats = {
    campaigns: campaigns.length,
    totalInvoices: campaigns.reduce((sum, c) => sum + c.totalInvoices, 0),
    totalAmount: campaigns.reduce((sum, c) => sum + c.totalAmount, 0),
    totalCredits: campaigns.reduce((sum, c) => sum + c.creditsUsed, 0),
    avgSuccessRate: campaigns.reduce((sum, c) => sum + c.successRate, 0) / campaigns.length,
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Campaigns</p>
                <p className="text-xl font-bold">{totalStats.campaigns}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Invoices</p>
                <p className="text-xl font-bold">{totalStats.totalInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-xl font-bold">${totalStats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Credits Used</p>
                <p className="text-xl font-bold">{totalStats.totalCredits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Avg Success Rate</p>
                <p className="text-xl font-bold">{totalStats.avgSuccessRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Sending History</span>
            <Button onClick={exportHistory} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export History
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Campaign List */}
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{campaign.name}</h3>
                    <p className="text-sm text-gray-600">{campaign.date}</p>
                  </div>
                  <div className="flex items-center space-x-2">{getStatusBadge(campaign.status)}</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Invoices</p>
                    <p className="font-semibold">{campaign.totalInvoices}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-semibold">${campaign.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="font-semibold">{campaign.successRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Credits Used</p>
                    <p className="font-semibold">{campaign.creditsUsed}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Channels:</span>
                    <div className="flex space-x-1">
                      {campaign.channels.map((channel) => (
                        <div
                          key={channel}
                          className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded text-xs"
                        >
                          {getChannelIcon(channel)}
                          <span className="capitalize">{channel}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No campaigns found matching your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
