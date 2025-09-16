"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InvoiceData } from "@/types/invoice";
import { Loader2 } from "lucide-react";

interface CompanyTemplate {
  companyName?: string;
  companyAddress?: string;
  companyEmail?: string;
  companyPhone?: string;
  logo?: string;
  companyDetails?: string;
  signature?: string;
  termsAndConditions?: string;
  gstin?: string;
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
  bankDetails?: string;
  contactAddress?: string;
}

interface InvoiceFormatStepProps {
  invoiceTemplate: CompanyTemplate;
  setInvoiceTemplate: (template: CompanyTemplate) => void;
  invoiceData: InvoiceData[];
  onNext: () => void;
  onBack: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") || "http://localhost:3000";

export default function InvoiceFormatStep({
  invoiceTemplate,
  setInvoiceTemplate,
  invoiceData,
  onNext,
  onBack,
}: InvoiceFormatStepProps) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceData | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");

  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isLoadingSavedTemplate, setIsLoadingSavedTemplate] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [templateActionError, setTemplateActionError] = useState<string | null>(null);

  const firstLoadRef = useRef(true);

  useEffect(() => {
    if (!invoiceData || invoiceData.length === 0) {
      setSelectedInvoiceId(null);
      setPreviewInvoice(null);
      setPreviewHtml("");
      setPreviewError("No invoices available. Please upload data.");
      return;
    }
    if (selectedInvoiceId) {
      const stillThere = invoiceData.find((i) => i.id === selectedInvoiceId);
      if (stillThere) {
        setPreviewInvoice(stillThere);
        return;
      }
    }
    const first = invoiceData[0];
    setSelectedInvoiceId(first.id);
    setPreviewInvoice(first);
  }, [invoiceData]);

  useEffect(() => {
    if (selectedInvoiceId && invoiceData?.length) {
      const inv = invoiceData.find((i) => i.id === selectedInvoiceId);
      if (inv) setPreviewInvoice(inv);
    }
  }, [selectedInvoiceId, invoiceData]);

  const fetchAndRenderPreview = useCallback(async () => {
    if (!previewInvoice) {
      setPreviewHtml("");
      setPreviewError("No invoice selected for preview.");
      return;
    }
    if (!invoiceTemplate || Object.keys(invoiceTemplate).length === 0) {
      setPreviewHtml("");
      setPreviewError("Company template details are missing. Please fill in company info.");
      return;
    }

    setIsPreviewing(true);
    setPreviewHtml("");
    setPreviewError(null);

    const controller = new AbortController();
    const signal = controller.signal;

    try {
      const res = await fetch(`${API_BASE}/api/render-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceData: previewInvoice, invoiceTemplate }),
        signal,
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = `Server responded with status ${res.status}.`;
        try {
          const json = JSON.parse(text);
          msg = json.message || msg;
        } catch {
          msg = `${msg} Raw error: ${text.slice(0, 160)}...`;
        }
        throw new Error(msg);
      }

      const html = await res.text();
      setPreviewHtml(html);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setPreviewError(`Failed to load preview: ${err.message}`);
      setPreviewHtml("");
    } finally {
      setIsPreviewing(false);
    }

    return () => controller.abort();
  }, [previewInvoice, invoiceTemplate]);

  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      if (previewInvoice && invoiceTemplate && Object.keys(invoiceTemplate).length) {
        fetchAndRenderPreview();
      }
      return;
    }
    fetchAndRenderPreview();
  }, [fetchAndRenderPreview]);

  const updateTemplate = (field: keyof CompanyTemplate, value: string) => {
    setInvoiceTemplate({ ...invoiceTemplate, [field]: value });
  };

  const handleImageUpload = (
    field: "logo" | "signature",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setTemplateActionError("Invalid image format: Must be a valid image file.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (base64?.startsWith("data:image/")) {
        updateTemplate(field, base64);
      } else {
        setTemplateActionError("Invalid image format: Must be a valid image file.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveTemplate = async () => {
    setIsSavingTemplate(true);
    setTemplateActionError(null);
    try {
      const res = await fetch(`${API_BASE}/api/save-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceTemplate),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save template.");
      }
      alert("✅ Template saved successfully!");
    } catch (err: any) {
      setTemplateActionError(`Error saving template: ${err.message}`);
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleLoadTemplate = async () => {
    setIsLoadingSavedTemplate(true);
    setTemplateActionError(null);
    try {
      const res = await fetch(`${API_BASE}/api/load-template`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to load template.");
      }
      const data = await res.json();
      setInvoiceTemplate(data);
      alert("📥 Template loaded successfully!");
    } catch (err: any) {
      setTemplateActionError(`Error loading template: ${err.message}`);
    } finally {
      setIsLoadingSavedTemplate(false);
    }
  };

  const handleClearTemplate = () => {
    setInvoiceTemplate({
      companyName: "",
      companyAddress: "",
      companyEmail: "",
      companyPhone: "",
      logo: "",
      companyDetails: "",
      signature: "",
      termsAndConditions: "",
      gstin: "",
      accountName: "",
      accountNumber: "",
      ifsc: "",
      bankDetails: "",
    });
    alert("🧹 Form cleared!");
  };

  const safeTotal = (value?: number) =>
    typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "0.00";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Enter your company details for the invoice</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="default" onClick={handleSaveTemplate} disabled={isSavingTemplate}>
                  {isSavingTemplate ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "💾 Save"
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleLoadTemplate}
                  disabled={isLoadingSavedTemplate}
                >
                  {isLoadingSavedTemplate ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "🔁 Load Saved"
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {templateActionError && (
              <p className="text-sm text-red-600">{templateActionError}</p>
            )}
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={invoiceTemplate.companyName || ""}
                onChange={(e) => updateTemplate("companyName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="companyAddress">Company Address</Label>
              <Textarea
                id="companyAddress"
                value={invoiceTemplate.companyAddress || ""}
                onChange={(e) => updateTemplate("companyAddress", e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="companyEmail">Company Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={invoiceTemplate.companyEmail || ""}
                onChange={(e) => updateTemplate("companyEmail", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="companyPhone">Company Phone</Label>
              <Input
                id="companyPhone"
                value={invoiceTemplate.companyPhone || ""}
                onChange={(e) => updateTemplate("companyPhone", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="gstin">GSTIN</Label>
              <Input
                id="gstin"
                value={invoiceTemplate.gstin || ""}
                onChange={(e) => updateTemplate("gstin", e.target.value)}
              />
            </div>
            <div>
              <Label>Company Logo</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload("logo", e)}
              />
              {invoiceTemplate.logo && (
                <img
                  src={invoiceTemplate.logo}
                  alt="Logo Preview"
                  className="h-20 mt-2 object-contain"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="accountName">Bank Account Name</Label>
              <Input
                id="accountName"
                value={invoiceTemplate.accountName || ""}
                onChange={(e) => updateTemplate("accountName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="accountNumber">Bank Account Number</Label>
              <Input
                id="accountNumber"
                value={invoiceTemplate.accountNumber || ""}
                onChange={(e) => updateTemplate("accountNumber", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ifsc">IFSC Code</Label>
              <Input
                id="ifsc"
                value={invoiceTemplate.ifsc || ""}
                onChange={(e) => updateTemplate("ifsc", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bankDetails">Other Bank Details</Label>
              <Textarea
                id="bankDetails"
                value={invoiceTemplate.bankDetails || ""}
                onChange={(e) => updateTemplate("bankDetails", e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label>Authorized Signature</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload("signature", e)}
              />
              {invoiceTemplate.signature && (
                <img
                  src={invoiceTemplate.signature}
                  alt="Signature Preview"
                  className="h-16 mt-2 object-contain"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Terms and Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={invoiceTemplate.termsAndConditions || ""}
              onChange={(e) => updateTemplate("termsAndConditions", e.target.value)}
              placeholder="Payment is due within 30 days..."
              rows={6}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Back
          </Button>
          <Button onClick={onNext} className="flex-1">
            Next → Send Invoices
          </Button>
          <Button variant="destructive" onClick={handleClearTemplate}>
            🧹 Clear All
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Preview</CardTitle>
            <CardDescription>Select an invoice to see a live preview.</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border rounded-lg bg-white min-h-[600px] max-h-[800px] overflow-auto p-6"
              style={{ boxShadow: "inset 0 0 10px rgba(0,0,0,0.05)" }}
            >
              {isPreviewing ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center h-full p-6">
                  <Loader2 className="h-8 w-8 animate-spin mb-3" />
                  Loading preview...
                </div>
              ) : previewHtml ? (
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : previewError ? (
                <div className="text-red-600 text-center p-6">
                  Preview Error: {previewError}
                  <br />
                  Please ensure backend is running and check the console for errors.
                </div>
              ) : (
                <div className="text-muted-foreground p-6">
                  Select an invoice to preview using the dropdown below.
                </div>
              )}
            </div>

            <div className="mt-6">
              <Label>Select an invoice</Label>
              <select
  className="w-full p-2 border rounded-md mt-1"
  value={selectedInvoiceId ?? ""}
  onChange={(e) => setSelectedInvoiceId(e.target.value)}
>
  {invoiceData.length === 0 ? (
    <option disabled>No invoices uploaded</option>
  ) : (
    <>
      <option value="">-- Select Invoice --</option>
      {invoiceData.map((inv) => (
        <option key={inv.id} value={inv.id}>
          {inv.name} - {inv.date} ({inv.currency ?? "INR"} {safeTotal(inv.total)})
        </option>
      ))}
    </>
  )}
</select>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
