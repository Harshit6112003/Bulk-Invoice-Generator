"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import type { InvoiceData } from "@/types/invoice";

type Channel = "email" | "whatsapp";

interface SendingStepProps {
  invoiceData: InvoiceData[];
  invoiceTemplate: {
    companyName: string;
    companyAddress: string;
    companyEmail: string;
    phone: string;
    logo: string;
    signature: string;
    bankDetails?: string;
    companyDetails?: string;
    accountName?: string;
    accountNumber?: string;
    ifsc?: string;
    gstin?: string;
    termsAndConditions: string;
    template: string;
  };
  setCredits: (credits: number) => void;
  setSendingHistory: (history: any[]) => void;
  onBack: () => void;
  onComplete: () => void;
  isSending: boolean;
  setIsSending: (sending: boolean) => void;
}

export default function SendingStep({
  invoiceData,
  invoiceTemplate,
  setCredits,
  setSendingHistory,
  onBack,
  onComplete,
  isSending,
  setIsSending,
}: SendingStepProps) {
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [emailConfigOpen, setEmailConfigOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const [selectedChannels, setSelectedChannels] = React.useState<Record<
    Channel,
    boolean
  >>({
    email: true,
    whatsapp: false,
  });
function animateProgress(toPercent: number, durationMs: number) {
  return new Promise<void>((resolve) => {
    const start = performance.now()
    const startValue = progress
    function animate(time: number) {
      const elapsed = time - start
      if (elapsed < durationMs) {
        const value = startValue + ((toPercent - startValue) * elapsed) / durationMs
        setProgress(Math.floor(value))
        requestAnimationFrame(animate)
      } else {
        setProgress(toPercent)
        resolve()
      }
    }
    requestAnimationFrame(animate)
  })
}

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<Record<
    string,
    Partial<Record<Channel, "sent" | "failed" | "pending">>
  >>({});

  const selectedInvoices = invoiceData.filter((inv) =>
    selectedIds.includes(inv.id)
  );

  useEffect(() => {
    async function checkEmailConfig() {
      try {
        const res = await fetch("http://localhost:3000/api/email-config-status");
        if (!res.ok) throw new Error("Failed to check email config");
        const data = await res.json();
        if (data.configured) {
          setEmailConfigured(true);
          setEmailConfigOpen(false);
        } else {
          setEmailConfigured(false);
          setEmailConfigOpen(true);
        }
      } catch {
        setEmailConfigured(false);
        setEmailConfigOpen(true);
      }
    }
    checkEmailConfig();
  }, []);

  function validateEmail(email: string) {
    return /^\S+@\S+\.\S+$/.test(email);
  }

  async function saveEmailConfig() {
    if (!email || !password) {
      setEmailError("Both Email and Password are required");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Invalid email format");
      return;
    }
    setEmailError(null);
    setEmailLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/save-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save configuration");
      }
      setEmailConfigured(true);
      setEmailConfigOpen(false);
      alert("Email configuration saved!");
    } catch (err: any) {
      setEmailError(err.message || "Unexpected error occurred");
    } finally {
      setEmailLoading(false);
    }
  }

  function toggleInvoice(id: string) {
    if (isSending) return; // Disable toggling while sending
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    if (isSending) return; // Disable while sending
    setSelectedIds(invoiceData.map((inv) => inv.id));
  }

  function deselectAll() {
    if (isSending) return; // Disable while sending
    setSelectedIds([]);
  }

  async function sendInvoices() {
    if (!emailConfigured) {
      alert("Please complete email configuration before sending invoices.");
      return;
    }
    if (selectedInvoices.length === 0) {
      alert("Please select at least one invoice.");
      return;
    }

    setIsSending(true);
    setProgress(0);

    const total = selectedInvoices.length;
    let processedCount = 0;

    try {
      const invoicesWithCompany = selectedInvoices.map((inv) => ({
        ...inv,
        company: { ...invoiceTemplate },
      }));

      const res = await fetch("http://localhost:3000/api/send-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoices: invoicesWithCompany,
          channels: selectedChannels,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const updatedStatus: Record<
          string,
          Partial<Record<Channel, "sent" | "failed" | "pending">>
        > = {};
        let hasFailures = false;

        for (const r of data.results) {
          if (!updatedStatus[r.id]) updatedStatus[r.id] = {};
          const channel = r.channel as Channel;
          const statusValue = r.status as "sent" | "failed" | "pending";
          updatedStatus[r.id][channel] = statusValue;
          if (statusValue !== "sent") hasFailures = true;

          processedCount++;
          // Update progress bar percentage
          setProgress(Math.round((processedCount / total) * 100));
        }

        setStatus(updatedStatus);

        if (hasFailures) {
          alert("Some emails are pending or failed. Please check and retry.");
          setIsSending(false);
          setProgress(100);
        } else {
          setIsSending(false);
          setProgress(100);
          setTimeout(() => {
            setProgress(0);
            setSendingHistory?.(data.results);
            onComplete();
          }, 1500);
        }
      } else {
        alert("Failed to send some invoices.");
        setIsSending(false);
      }
    } catch (err) {
      alert("Error sending invoices.");
      setIsSending(false);
      console.error(err);
    }
  }

  return (
    <>
      <Dialog open={emailConfigOpen} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Configuration Required</DialogTitle>
            <DialogDescription>
              Please configure your email to send invoices. You need to enable
              two-factor authentication on your email account and generate an app password to use here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {emailError && <p className="text-red-600">{emailError}</p>}
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              autoFocus
            />
            <Input
              type="password"
              placeholder="App Password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            />
            <div className="flex justify-end gap-4">
              <Button disabled>Cancel</Button>
              <Button onClick={saveEmailConfig} disabled={emailLoading}>
                {emailLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isSending && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-50"
          style={{ cursor: "not-allowed" }}
        />
      )}

      <div className="max-w-10xl">
        <Card>
          <CardHeader className="flex">
            <div>
              <CardTitle>Send Invoices</CardTitle>
              <CardDescription>Select recipients and channels</CardDescription>
            </div>
          </CardHeader>
          <Button
            onClick={() => setEmailConfigOpen(true)}
            variant="outline"
            className="px-4 py-2 text-sm hover:bg-gray-100 relative bottom-[10px] left-6 my-2"
            disabled={isSending}
          >
            Configure Email
          </Button>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {(["email", "whatsapp"] as Channel[]).map((channel) => (
                <Label key={channel} className="flex items-center cursor-pointer">
                  <Checkbox
                    checked={selectedChannels[channel]}
                    onCheckedChange={(val: boolean) =>
                      setSelectedChannels((prev) => ({ ...prev, [channel]: val }))
                    }
                    className="mr-2"
                    disabled={isSending}
                  />
                  <span className="capitalize font-semibold">{channel}</span>
                </Label>
              ))}
            </div>
            <div className="mb-4">
              <Button size="sm" variant="outline" onClick={selectAll} className="mr-2" disabled={isSending}>
                Select All
              </Button>
              <Button size="sm" variant="outline" onClick={deselectAll} disabled={isSending}>
                Deselect All
              </Button>
            </div>
            <div
              className={`border rounded-md max-h-64 overflow-auto bg-gray-50 p-3 ${
                isSending ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {invoiceData.length === 0 ? (
                <p className="text-center text-muted-foreground py-10 italic">No invoices</p>
              ) : (
                invoiceData.map((inv) => (
                  <Label
                    key={inv.id}
                    className="flex justify-between items-center cursor-pointer bg-white hover:bg-gray-100 rounded p-3 mb-2"
                    onClick={() => toggleInvoice(inv.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={selectedIds.includes(inv.id)}
                        onChange={(e) => e.stopPropagation()}
                        onClick={() => toggleInvoice(inv.id)}
                        className="mr-2"
                        disabled={isSending}
                      />
                      <div>
                        <p className="font-semibold">{inv.name}</p>
                        <p className="text-muted-foreground text-sm">{inv.email}</p>
                      </div>
                    </div>
                    <span className="font-mono text-lg">
                      {inv.currency} {inv?.total?.toFixed(2)}
                    </span>
                  </Label>
                ))
              )}
            </div>
            <div className="flex justify-between mt-6">
              <Button onClick={onBack} disabled={isSending}>
                Back
              </Button>
              <Button disabled={isSending || selectedInvoices.length === 0} onClick={sendInvoices}>
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send"
                )}
              </Button>
            </div>
            {isSending && <Progress value={progress} className="rounded-full h-3 mt-6" />}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
