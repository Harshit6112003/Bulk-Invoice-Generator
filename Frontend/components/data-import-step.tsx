"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  type HTMLInputTypeAttribute,
} from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  Download,
  Trash2,
  Plus,
  Loader2,
  ChevronDown,
  FileWarning,
} from "lucide-react";
import type { InvoiceData } from "@/types/invoice";
import { cn } from "@/lib/utils";

const API_URL = "http://localhost:3000/api/upload-excel";

const CSV_HEADERS =
  "Date,Name,Email,Phone,Description1,Hours1,Rate1,Description2,Hours2,Rate2,Description3,Hours3,Rate3,Description4,Hours4,Rate4,Description5,Hours5,Rate5,Tax,Currency,Payment";
const CSV_EXAMPLE_ROWS = [
  "2025-08-01,John Doe,john.doe@example.com,9876543210,Web Development,40,1000,Web Development,40,1000,Web Development,40,1000,Web Development,40,1000,Web Development,40,1000,0,INR,Paid",
  "2025-08-10,Jane Smith,jane.smith@email.com,8765432109,Marketing,15,95,Ad Creative,10,110,Web Development,40,1000,Web Development,40,1000,Web Development,40,1000,0,AUD,PartiallyPaid",
  "2025-08-15,Sam Wilson,sam.wilson@web.io,7654321098,Design,50,80,Web Development,40,1000,Web Development,40,1000,Web Development,40,1000,Web Development,40,1000,0,AOA,Unpaid",
  "2025-08-20,Alex Brown,alex.brown@example.com,1234567890,Consulting,20,150,Web Development,40,1000,Web Development,40,1000,Web Development,40,1000,Web Development,40,1000,0,USD,Unpaid",
  "2025-08-25,Linda Green,linda.green@company.com,2345678901,Maintenance,30,120,Support,10,100,Web Development,40,1000,Web Development,40,1000,Web Development,40,1000,0,EUR,Paid",
].join("\n");

const allCurrencies = [
  "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN",
  "BAM", "BBD", "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BOV",
  "BRL", "BSD", "BTN", "BWP", "BYN", "BZD", "CAD", "CDF", "CHE", "CHF",
  "CHW", "CLF", "CLP", "CNY", "COP", "COU", "CRC", "CUC", "CUP", "CVE",
  "CZK", "DJF", "DKK", "DOP", "DZD", "EGP", "ERN", "ETB", "EUR", "FJD",
  "FKP", "GBP", "GEL", "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD", "HKD",
  "HNL", "HRK", "HTG", "HUF", "IDR", "ILS", "INR", "IQD", "IRR", "ISK",
  "JMD", "JOD", "JPY", "KES", "KGS", "KHR", "KMF", "KPW", "KRW", "KWD",
  "KYD", "KZT", "LAK", "LBP", "LKR", "LRD", "LSL", "LYD", "MAD", "MDL",
  "MGA", "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR", "MWK", "MXN",
  "MXV", "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR",
  "PAB", "PEN", "PGK", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD",
  "RUB", "RWF", "SAR", "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLL",
  "SOS", "SRD", "SSP", "STN", "SVC", "SYP", "SZL", "THB", "TJS", "TMT",
  "TND", "TOP", "TRY", "TTD", "TWD", "TZS", "UAH", "UGX", "USD", "USN",
  "UYI", "UYU", "UYW", "UZS", "VED", "VES", "VND", "VUV", "WST", "XAF",
  "XAG", "XAU", "XBA", "XBB", "XBC", "XBD", "XCD", "XDR", "XOF", "XPD",
  "XPF", "XPT", "XSU", "XTS", "XUA", "XXX", "YER", "ZAR", "ZMW", "ZWL"
].sort();

type FormInputKey = keyof Omit<InvoiceData, "id" | "total" | "amount">;

const manualInputFields: Array<{
  id: FormInputKey;
  label: string;
  required: boolean;
  type: HTMLInputTypeAttribute;
}> = [
  { id: "name", label: "Name", required: true, type: "text" },
  { id: "email", label: "Email", required: true, type: "email" },
  { id: "date", label: "Date", required: false, type: "date" },
  { id: "phone", label: "Phone", required: false, type: "tel" },
  { id: "tax", label: "Tax", required: false, type: "number" },
];

interface AddInvoiceDialogProps {
  onAddInvoice: (invoice: Omit<InvoiceData, "id" | "total">) => void;
}

const AddInvoiceDialog: React.FC<AddInvoiceDialogProps> = ({
  onAddInvoice,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState<
    Partial<Omit<InvoiceData, "id" | "total"> & { currency?: string }>
  >({});
  const [formError, setFormError] = useState<string | null>(null);

  const lineItems = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((i) => ({
        [`hours${i}`]: newInvoice[`hours${i}` as keyof typeof newInvoice],
        [`rate${i}`]: newInvoice[`rate${i}` as keyof typeof newInvoice],
      })),
    [newInvoice]
  );

  const calculatedAmount = useMemo(() => {
    return lineItems.reduce((acc, item, i) => {
      const hours = Number(item[`hours${i + 1}`]) || 0;
      const rate = Number(item[`rate${i + 1}`]) || 0;
      return acc + hours * rate;
    }, 0);
  }, [lineItems]);

  const handleInputChange = (key: FormInputKey | "currency", value: string) => {
    setNewInvoice((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!newInvoice.name || !newInvoice.email) {
      setFormError("Please fill in Name and Email.");
      return;
    }

    onAddInvoice({
      date: newInvoice.date || new Date().toISOString().split("T")[0],
      name: newInvoice.name,
      email: newInvoice.email,
      phone: newInvoice.phone || "",
      description1: newInvoice.description1 || "",
      hours1: Number(newInvoice.hours1) || 0,
      rate1: Number(newInvoice.rate1) || 0,
      description2: newInvoice.description2 || "",
      hours2: Number(newInvoice.hours2) || 0,
      rate2: Number(newInvoice.rate2) || 0,
      description3: newInvoice.description3 || "",
      hours3: Number(newInvoice.hours3) || 0,
      rate3: Number(newInvoice.rate3) || 0,
      description4: newInvoice.description4 || "",
      hours4: Number(newInvoice.hours4) || 0,
      rate4: Number(newInvoice.rate4) || 0,
      description5: newInvoice.description5 || "",
      hours5: Number(newInvoice.hours5) || 0,
      rate5: Number(newInvoice.rate5) || 0,
      tax: Number(newInvoice.tax) || 0,
      amount: calculatedAmount,
      currency: newInvoice.currency || "INR",
    });
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setNewInvoice({});
      setFormError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-muted transition-colors"
        >
          <Plus className="h-6 w-6" />
          <span>Add Manually</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Invoice Manually</DialogTitle>
          <DialogDescription>
            Amount is calculated from (Hours × Rate).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-3">
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b pb-4">
            {manualInputFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                  {field.label}
                  {field.required && " *"}
                </Label>
                <Input
                  id={field.id}
                  type={field.type}
                  value={(newInvoice as any)[field.id] || ""}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <select
                id="currency"
                className="w-full rounded-md border border-input p-2"
                value={newInvoice.currency || "INR"}
                onChange={(e) => handleInputChange("currency", e.target.value)}
              >
                {allCurrencies.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <Label className="font-semibold text-base">Line Items</Label>
            {[1, 2, 3, 4, 5].map((i) => {
              const descKey = `description${i}` as FormInputKey;
              const hoursKey = `hours${i}` as FormInputKey;
              const rateKey = `rate${i}` as FormInputKey;
              return (
                <div key={i} className="grid grid-cols-5 gap-2 items-center">
                  <Input
                    placeholder={`Description ${i}`}
                    className="col-span-3"
                    value={(newInvoice as any)[descKey] || ""}
                    onChange={(e) => handleInputChange(descKey, e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Hours"
                    value={(newInvoice as any)[hoursKey] || ""}
                    onChange={(e) => handleInputChange(hoursKey, e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Rate"
                    value={(newInvoice as any)[rateKey] || ""}
                    onChange={(e) => handleInputChange(rateKey, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
          <div className="pt-4 flex justify-between items-center bg-muted -mx-7 px-6 py-4 rounded-b-lg">
            <div className="text-lg font-semibold">
              Total Amount:{" "}
              <span className="ml-2 font-mono text-xl">
                {newInvoice.currency ?? "INR"}{" "}
                {(calculatedAmount + (Number(newInvoice.tax) || 0)).toFixed(2)}
              </span>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSubmit} className="flex-1">
                Add Invoice
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface InvoiceDataTableProps {
  invoiceData: InvoiceData[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onNext: () => void;
}

const InvoiceDataTable: React.FC<InvoiceDataTableProps> = ({
  invoiceData,
  onRemove,
  onClearAll,
  onNext,
}) => {
  const [expandedRows, setExpandedRows] = useState(new Set(invoiceData.map((inv) => inv.id)));

  const toggleRowExpansion = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  if (!invoiceData.length) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <FileWarning className="h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No Invoice Data</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Upload a file or add an entry manually.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Invoice Data ({invoiceData.length} entries)</span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {invoiceData.length} imported invoices.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onClearAll}>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]" />
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceData.map((invoice) => {
                const isExpanded = expandedRows.has(invoice.id);
                const lineItems = [1, 2, 3, 4, 5]
                  .map((i) => ({
                    desc: invoice[`description${i}` as keyof InvoiceData] as string,
                    hours: invoice[`hours${i}` as keyof InvoiceData] as number,
                    rate: invoice[`rate${i}` as keyof InvoiceData] as number,
                  }))
                  .filter((item) => item.desc && item.hours > 0 && item.rate > 0);
                const totalHours = lineItems.reduce((acc, item) => acc + item.hours, 0);

                return (
                  <React.Fragment key={invoice.id}>
                    <TableRow className="hover:bg-muted/50 data-[state=open]:bg-muted">
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => toggleRowExpansion(invoice.id)}>
                          <ChevronDown
                            className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")}
                          />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{invoice.name}</div>
                        <div className="text-sm text-muted-foreground">{invoice.email}</div>
                      </TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell className="text-right font-mono text-base">
                        {invoice.currency}{" "}
                        {invoice.total?.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => onRemove(invoice.id)}>
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-background hover:bg-background">
                        <TableCell colSpan={5} className="p-0">
                          <div className="p-6 flex flex-col md:flex-row gap-6 bg-muted/50">
                            <div className="flex-grow space-y-2 rounded-lg bg-background p-4 border">
                              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                                <div className="col-span-6">Item Description</div>
                                <div className="col-span-2 text-center">Hours</div>
                                <div className="col-span-2 text-right">Rate</div>
                                <div className="col-span-2 text-right">Amount</div>
                              </div>
                              <div className="border-b -mx-4"></div>
                              {lineItems.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 text-sm items-center pt-2">
                                  <div className="col-span-6 font-medium">{item.desc}</div>
                                  <div className="col-span-2 text-center text-muted-foreground">{item.hours}</div>
                                  <div className="col-span-2 text-right font-mono text-muted-foreground">
                                    {invoice.currency} {item.rate.toFixed(2)}
                                  </div>
                                  <div className="col-span-2 text-right font-mono">
                                    {invoice.currency} {(item.hours * item.rate).toFixed(2)}
                                  </div>
                                </div>
                              ))}
                              {lineItems.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center col-span-12 py-4">
                                  No line items for this invoice.
                                </p>
                              )}
                            </div>
                            <div className="w-full md:w-64 flex-shrink-0 space-y-2 bg-background p-4 rounded-lg border">
                              <h4 className="font-semibold text-center pb-2 border-b">Summary</h4>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span className="font-mono">{invoice.currency} {invoice.amount?.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Hours:</span>
                                <span className="font-mono">{totalHours.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax:</span>
                                <span className="font-mono">{invoice.currency} {invoice.tax?.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-base font-semibold border-t pt-2 mt-2">
                                <span className="text-muted-foreground">Total:</span>
                                <span className="font-mono">{invoice.currency} {invoice.total?.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={onNext} disabled={invoiceData.length === 0}>
          Next: Setup Invoice Format
        </Button>
      </CardFooter>
    </Card>
  );
};

interface DataImportStepProps {
  onNext: () => void;
  setInvoiceData: React.Dispatch<React.SetStateAction<InvoiceData[]>>;
  invoiceData: InvoiceData[];
}

export default function DataImportStep({
  onNext,
  setInvoiceData,
  invoiceData,
}: DataImportStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append("file", file);
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        if (result.success && Array.isArray(result.invoices)) {
          setInvoiceData(result.invoices);
        } else {
          setError(result.message || "Failed to parse the uploaded file.");
        }
      } catch (err) {
        setError("An unexpected error occurred. Check the console for details.");
        console.error(err);
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [setInvoiceData]
  );

  const downloadTemplate = useCallback(() => {
    const link = document.createElement("a");
    link.href = encodeURI(
      `data:text/csv;charset=utf-8,${CSV_HEADERS}\n${CSV_EXAMPLE_ROWS}\n`
    );
    link.download = "invoice_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const addInvoice = useCallback(
    (invoice: Omit<InvoiceData, "id" | "total">) => {
      setInvoiceData((prev) => [
        ...prev,
        {
          ...invoice,
          id: `inv-manual-${Date.now()}`,
          total: invoice.amount + invoice.tax,
        },
      ]);
    },
    [setInvoiceData]
  );

  const removeInvoice = useCallback(
    (id: string) => {
      setInvoiceData((prev) => prev.filter((item) => item.id !== id));
    },
    [setInvoiceData]
  );

  const clearAllInvoices = useCallback(() => setInvoiceData([]), [setInvoiceData]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Invoice Data</CardTitle>
          <CardDescription>
            Upload a file, download a template, or add an entry manually.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-muted transition-colors"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
              <span>{isLoading ? "Uploading..." : "Upload File"}</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center space-y-2 hover:bg-muted transition-colors"
              onClick={downloadTemplate}
              disabled={isLoading}
            >
              <Download className="h-6 w-6" />
              <span>Download Template</span>
            </Button>
            <AddInvoiceDialog onAddInvoice={addInvoice} />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
        </CardContent>
      </Card>
      <InvoiceDataTable
        invoiceData={invoiceData}
        onRemove={removeInvoice}
        onClearAll={clearAllInvoices}
        onNext={onNext}
      />
    </div>
  );
}
