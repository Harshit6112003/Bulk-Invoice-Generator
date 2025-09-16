"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DataImportStep from "@/components/data-import-step";
import InvoiceFormatStep from "@/components/invoice-format-step";
import SendingStep from "@/components/sending-step";
import AnalyticsStep from "@/components/analytics-step";
import type { InvoiceData } from "@/types/invoice";

// Define your CompanyTemplate interface here
interface CompanyTemplate {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  phone: string;
  logo: string;
  signature: string;
  termsAndConditions: string;
  template: string;
  bankDetails?: string;
  companyDetails?: string;
  accountName?: string;
  accountNumber?: string;
  ifsc?: string;
  gstin?: string;
}

export default function BulkInvoiceApp() {
  const [currentStep, setCurrentStep] = useState(1);

  // Lifted states to persist across tabs
  const [invoiceData, setInvoiceData] = useState<InvoiceData[]>([]);
  const [invoiceTemplate, setInvoiceTemplate] = useState<CompanyTemplate>({
    companyName: "",
    companyAddress: "",
    companyEmail: "",
    phone: "",
    logo: "",
    signature: "",
    termsAndConditions: "",
    template: "modern",
  });

  const [credits, setCredits] = useState(100);
  const [sendingHistory, setSendingHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <div className="h-screen flex justify-center items-center text-lg">Loading...</div>;
  }

  const steps = [
    { id: 1, title: "Import", description: "Upload invoice data" },
    { id: 2, title: "Format", description: "Set up invoice template" },
    { id: 3, title: "Send", description: "Send invoices" },
    { id: 4, title: "Notifications", description: "View notifications" },
  ];

  function handleStepChange(step: number) {
    if (!isSending) {
      setCurrentStep(step);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Bulk Invoice Generator</h1>
            <p className="text-gray-600">Generate and send invoices in bulk</p>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      currentStep >= step.id
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-gray-300 text-gray-500"
                    }`}
                  >
                    {step.id}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${currentStep >= step.id ? "text-blue-600" : "text-gray-500"}`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${currentStep > step.id ? "bg-blue-600" : "bg-gray-300"}`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs value={currentStep.toString()} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {steps.map((step) => (
              <TabsTrigger
                key={step.id}
                value={step.id.toString()}
                onClick={() => handleStepChange(step.id)}
                disabled={step.id > 1 && invoiceData.length === 0 || isSending}
              >
                {step.title}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="1" className="mt-6">
            <DataImportStep
              invoiceData={invoiceData}
              setInvoiceData={setInvoiceData}
              onNext={() => handleStepChange(2)}
            />
          </TabsContent>

          <TabsContent value="2" className="mt-6">
            <InvoiceFormatStep
              invoiceTemplate={invoiceTemplate}
              setInvoiceTemplate={setInvoiceTemplate}
              invoiceData={invoiceData}
              onNext={() => handleStepChange(3)}
              onBack={() => handleStepChange(1)}
              disabled={isSending}
            />
          </TabsContent>

          <TabsContent value="3" className="mt-6">
            <SendingStep
              invoiceData={invoiceData}
              invoiceTemplate={invoiceTemplate}
              credits={credits}
              setCredits={setCredits}
              setSendingHistory={setSendingHistory}
              onBack={() => handleStepChange(2)}
              onComplete={() => handleStepChange(4)}
              isSending={isSending}
              setIsSending={setIsSending}
            />
          </TabsContent>

          <TabsContent value="4" className="mt-6">
            <AnalyticsStep
              invoiceData={invoiceData}
              sendingHistory={sendingHistory}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
