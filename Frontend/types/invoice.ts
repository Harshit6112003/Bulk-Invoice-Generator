export interface InvoiceData {
  id: string;
  date: string;
  name: string;
  email: string;
  phone: string;
  description1: string;
  hours1: number;
  rate1: number;
  description2: string;
  hours2: number;
  rate2: number;
  description3: string;
  hours3: number;
  rate3: number;
  description4: string;
  hours4: number;
  rate4: number;
  description5: string;
  hours5: number;
  rate5: number;
  amount: number; // Calculated sum of (hours * rate)
  tax: number;
  total: number;
  currency?: string;
}



export interface InvoiceTemplate {
  companyName: string
  companyAddress: string
  companyEmail: string
  companyPhone: string
  logo: string
  template: "modern" | "classic" | "minimal"
}
