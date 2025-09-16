"use client";

import React, { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle, Loader2, Upload, Search } from "lucide-react";

interface Notification {
  id: string;
  name: string;
  phone: string;
  email: string;
  paymentStatus: "Partially Paid" | "Unpaid" | string;
}

interface NotificationResult {
  success: boolean;
  message: string;
  summary?: {
    total: number;
    emailSuccess: number;
    whatsappSuccess: number;
    errors: number;
  };
  results?: any[];
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [channels, setChannels] = useState({
    email: true,
    whatsapp: false
  });
  const [loading, setLoading] = useState({
    upload: false,
    sending: false
  });
  const [notification, setNotification] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
    details?: any;
  }>({ type: null, message: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear notification after 5 seconds
  const showNotification = (type: 'success' | 'error' | 'info', message: string, details?: any) => {
    setNotification({ type, message, details });
    setTimeout(() => {
      setNotification({ type: null, message: '' });
    }, 8000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(prev => ({ ...prev, upload: true }));

    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = ev.target?.result;
        if (!data) return;

        try {
          const workbook = XLSX.read(data, { type: "binary" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

          const parsed: Notification[] = [];
          let skippedPaid = 0;
          let skippedIncomplete = 0;

          json.forEach((row, index) => {
            const name = row["Name"] ?? row["name"] ?? "";
            const email = row["Email"] ?? row["email"] ?? "";
            const phone = row["Phone"] ?? row["phone"] ?? "";
            let paymentStatus = row["Payment"] ?? row["payment"] ?? "";
            paymentStatus = paymentStatus.toString().trim();

            if (paymentStatus.toLowerCase() === "paid") {
              skippedPaid++;
              return;
            }

            if (!name || !email || !phone) {
              skippedIncomplete++;
              return;
            }

            parsed.push({
              id: index.toString(),
              name: name.toString(),
              email: email.toString(),
              phone: phone.toString(),
              paymentStatus: paymentStatus,
            });
          });

          setNotifications(parsed);
          setSelectedIds([]);
          setSearchTerm("");

          // Show upload success notification
          const totalProcessed = parsed.length + skippedPaid + skippedIncomplete;
          let message = `Successfully uploaded ${parsed.length} notifications`;
          if (skippedPaid > 0 || skippedIncomplete > 0) {
            message += ` (Skipped: ${skippedPaid} paid, ${skippedIncomplete} incomplete)`;
          }
          showNotification('success', message);

        } catch (parseError) {
          console.error('Error parsing Excel file:', parseError);
          showNotification('error', 'Error parsing Excel file. Please check the file format.');
        }
      };

      reader.onerror = () => {
        showNotification('error', 'Error reading file. Please try again.');
      };

      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('error', 'Error uploading file. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, upload: false }));
      e.target.value = "";
    }
  };

  const filteredNotifications = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return notifications.filter(
      (n) => n.name.toLowerCase().includes(lower) || n.email.toLowerCase().includes(lower)
    );
  }, [notifications, searchTerm]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectAll = () => setSelectedIds(filteredNotifications.map((n) => n.id));
  const deselectAll = () => setSelectedIds([]);

  const toggleChannel = (channel: keyof typeof channels) => {
    setChannels(prev => ({ ...prev, [channel]: !prev[channel] }));
  };

  const sendNotifications = async () => {
    if (selectedIds.length === 0) {
      showNotification('error', 'Please select users for sending notifications!');
      return;
    }

    if (!channels.email && !channels.whatsapp) {
      showNotification('error', 'Please select at least one notification channel!');
      return;
    }

    const recipients = notifications.filter((n) => selectedIds.includes(n.id));
    
    // Build notification message
    const channelText = [];
    if (channels.email) channelText.push("Email");
    if (channels.whatsapp) channelText.push("WhatsApp");

    setLoading(prev => ({ ...prev, sending: true }));

    try {
      const response = await fetch('http://localhost:3000/api/send-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          users: recipients,
          channels: channels
        }),
      });

      const result: NotificationResult = await response.json();

      if (result.success && response.ok) {
        const { summary } = result;
        let successMessage = `✅ Notifications sent successfully!`;
        
        if (summary) {
          const details = [];
          if (summary.emailSuccess > 0) details.push(`${summary.emailSuccess} emails`);
          if (summary.whatsappSuccess > 0) details.push(`${summary.whatsappSuccess} WhatsApp messages`);
          if (details.length > 0) {
            successMessage = `✅ Successfully sent ${details.join(' and ')} to ${recipients.length} users`;
          }
          if (summary.errors > 0) {
            successMessage += ` (${summary.errors} failed)`;
          }
        }

        showNotification('success', successMessage, result);
        setSelectedIds([]); // Clear selection after successful send
      } else {
        showNotification('error', result.message || 'Failed to send notifications. Please try again.');
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      showNotification('error', 'Network error: Unable to send notifications. Please check your connection and try again.');
    } finally {
      setLoading(prev => ({ ...prev, sending: false }));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'info': return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default: return null;
    }
  };

  return (
    <main className="min-h-screen bg-[#fafbfd] py-8">
      <div className="max-w-[90rem] mx-auto bg-white rounded-xl shadow-lg border border-gray-300">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-10">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">Notifications</h1>
            <p className="mt-1 text-sm text-gray-600">Upload Excel and send payment reminders</p>
          </div>
          <div>
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fileInputRef}
              onChange={handleUpload}
              className="hidden"
              disabled={loading.upload}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading.upload}
              className="bg-blue-600 text-white rounded-md px-6 py-2 shadow-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading.upload ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Excel
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="px-10 pb-10">
          {/* Notification Alert */}
          {notification.type && (
            <Alert className={`mb-6 ${
              notification.type === 'success' ? 'border-green-200 bg-green-50' :
              notification.type === 'error' ? 'border-red-200 bg-red-50' :
              'border-blue-200 bg-blue-50'
            }`}>
              <div className="flex items-center">
                {getNotificationIcon(notification.type)}
                <AlertDescription className="ml-2 text-sm">
                  {notification.message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Platform Selection */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Select Notification Channels:</h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.email}
                  onChange={() => toggleChannel('email')}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">📧 Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.whatsapp}
                  onChange={() => toggleChannel('whatsapp')}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">📱 WhatsApp</span>
              </label>
            </div>
            {!channels.email && !channels.whatsapp && (
              <p className="text-xs text-red-600 mt-2 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Please select at least one channel
              </p>
            )}
          </div>

          {/* Statistics */}
          {notifications.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex flex-wrap gap-4 text-sm text-blue-800">
                <span>📊 Total Users: <strong>{notifications.length}</strong></span>
                <span>🔍 Filtered: <strong>{filteredNotifications.length}</strong></span>
                <span>✅ Selected: <strong>{selectedIds.length}</strong></span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between mb-6">
            <div className="space-x-2">
              <Button onClick={selectAll} size="sm" variant="outline" disabled={filteredNotifications.length === 0}>
                Select All ({filteredNotifications.length})
              </Button>
              <Button onClick={deselectAll} size="sm" variant="outline" disabled={selectedIds.length === 0}>
                Deselect All
              </Button>
            </div>
            <Button 
              onClick={sendNotifications} 
              size="sm" 
              disabled={
                loading.sending || 
                selectedIds.length === 0 || 
                (!channels.email && !channels.whatsapp)
              }
              className={`${
                selectedIds.length === 0 || (!channels.email && !channels.whatsapp)
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading.sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                `Send Notifications (${selectedIds.length})`
              )}
            </Button>
          </div>

          {/* Notifications List */}
          <section className="border border-gray-300 rounded-md divide-y divide-gray-200 overflow-hidden">
            {filteredNotifications.length === 0 ? (
              <div className="p-12 text-center">
                {notifications.length === 0 ? (
                  <div>
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">No data uploaded</p>
                    <p className="text-sm text-gray-600">Upload an Excel file to get started</p>
                  </div>
                ) : (
                  <div>
                    <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">No results found</p>
                    <p className="text-sm text-gray-600">Try adjusting your search terms</p>
                  </div>
                )}
              </div>
            ) : (
              filteredNotifications.map(({ id, name, phone, email, paymentStatus }) => {
                const selected = selectedIds.includes(id);
                return (
                  <div
                    key={id}
                    className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
                      selected ? "bg-indigo-100 border-l-4 border-indigo-500" : "bg-white"
                    } hover:bg-indigo-50`}
                    onClick={() => toggleSelect(id)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelect(id)}
                        className="w-4 h-4 cursor-pointer text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p className="flex items-center">
                            📞 {phone}
                          </p>
                          <p className="flex items-center">
                            📧 <a href={`mailto:${email}`} className="text-indigo-600 hover:text-indigo-800 ml-1 truncate">
                              {email}
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        paymentStatus === "Partially Paid"
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-300"
                          : "bg-red-100 text-red-800 border border-red-300"
                      }`}
                    >
                      {paymentStatus === "Partially Paid" ? "⚠️" : "🚨"} {paymentStatus}
                    </span>
                  </div>
                );
              })
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
