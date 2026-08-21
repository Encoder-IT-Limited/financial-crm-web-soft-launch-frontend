import type { Customer } from "../types";

export const seedCustomers: Customer[] = [
  {
    id: "cust-gulf",
    customerCode: "CUST-0001",
    name: "Gulf Tech Solutions",
    email: "accounts@gulftech.ae",
    phone: "+971 50 412 7788",
    address: "Business Bay, Dubai, UAE",
    trn: "100123456700001",
    currency: "AED",
    creditLimit: 50000,
    openingBalance: 0,
    status: "active",
  },
  {
    id: "cust-reem",
    customerCode: "CUST-0002",
    name: "Reem Properties",
    email: "finance@reemprop.ae",
    phone: "+971 2 622 4400",
    address: "Corniche Road, Abu Dhabi, UAE",
    trn: "100987654300002",
    currency: "AED",
    creditLimit: 100000,
    openingBalance: 12500,
    status: "active",
  },
  {
    id: "cust-alnoor",
    customerCode: "CUST-0003",
    name: "Al Noor Logistics",
    email: "ap@alnoor.ae",
    phone: "+971 4 880 1212",
    address: "Jebel Ali Free Zone, Dubai, UAE",
    trn: "100876543200004",
    currency: "AED",
    creditLimit: 25000,
    openingBalance: 0,
    status: "active",
  },
  {
    id: "cust-khalifa",
    customerCode: "CUST-0004",
    name: "Khalifa Media",
    email: "billing@khalifamedia.ae",
    phone: "+971 6 574 9090",
    address: "Al Wahda Street, Sharjah, UAE",
    trn: "100456789000003",
    currency: "AED",
    creditLimit: 15000,
    openingBalance: 0,
    status: "inactive",
  },
];

/** Next `CUST-####` sequence number — one past the highest seeded code. */
export const seedCustomerSeq = 5;
