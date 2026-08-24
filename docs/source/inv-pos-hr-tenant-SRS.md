# Tab 1

# **11\. Detailed Software Requirements Specification (SRS)**

## **11.1 Document Purpose**

This SRS defines the functional and non-functional requirements for a multi-tenant business management platform containing:

* POS  
* Invoicing  
* Accounting  
* Expenses  
* Inventory  
* Procurement  
* HR & Payroll  
* Calendar & Booking  
* Banking  
* User & Role Management  
* AI Assistant  
* Forms and Document Generation  
* Social Media Integration  
* Notifications  
* Mobile Applications  
* Subscription & Seat Management  
* Reporting and Dashboard

The platform shall support multiple organizations/clients from a common SaaS infrastructure while keeping each organization's business data isolated.

---

# **11.2 System Objectives**

The system shall:

1. Centralize business operations into one platform.  
2. Support multiple companies/tenants.  
3. Provide Web, Android, and iOS applications.  
4. Support offline POS operation.  
5. Synchronize POS transactions when connectivity returns.  
6. Manage sales, purchasing, inventory, expenses, banking and accounting.  
7. Automate receipt processing using AI/OCR.  
8. Manage employees, attendance, leave and payroll.  
9. Manage appointments, resources and staff schedules.  
10. Generate Excel, Word and PDF documents.  
11. Provide email, SMS and push notifications.  
12. Integrate social media platforms.  
13. Provide role-based access control.  
14. Support subscription plans and additional seats.  
15. Provide centralized reporting and dashboards.

---

# **11.3 User Types**

### **Platform-Level Users**

* Super Admin  
* Platform Administrator  
* Support/Admin Staff

### **Tenant-Level Users**

* Tenant Owner  
* Tenant Admin  
* Manager  
* Accountant  
* Sales Staff  
* POS/Cashier  
* Inventory Manager  
* Procurement Officer  
* HR Manager  
* HR Staff  
* Employee  
* Approver  
* Viewer

The system shall allow configurable roles and permissions rather than hard-coding only these roles.

---

# **11.4 Multi-Tenant Architecture**

Each business shall be represented as a tenant/company.

A tenant may have:

* Multiple branches  
* Multiple warehouses  
* Multiple users  
* Multiple employees  
* Multiple POS terminals  
* Multiple bank accounts  
* Multiple currencies where applicable  
* Multiple tax configurations  
* Multiple subscription seats

Tenant data must be logically isolated.

Every business transaction shall contain a tenant/company reference.

---

# **11.5 POS Module**

## **Functional Requirements**

The POS shall support:

* Product search  
* Barcode scanning  
* Barcode lookup  
* Product variants  
* Product pricing  
* Discounts  
* Taxes  
* Customer selection  
* Walk-in customers  
* Cash sales  
* Card payments  
* Bank/mobile payments  
* Split payments  
* Refunds  
* Returns  
* Sales receipts  
* Invoice generation  
* Cashier sessions  
* Cash opening balance  
* Cash closing  
* Cash-drawer integration  
* POS terminal management  
* Branch-level POS  
* Warehouse selection  
* Inventory synchronization  
* Offline operation

## **Offline POS**

The POS application shall continue operating when internet connectivity is unavailable.

Offline transactions shall be stored locally with:

* Offline transaction ID  
* Device ID  
* Terminal ID  
* Timestamp  
* Local sequence number  
* Transaction payload  
* Synchronization status

When connectivity returns, transactions shall be synchronized with the server.

The server shall prevent duplicate transaction creation using an idempotency key.

---

# **11.6 Invoicing Module**

The system shall support:

* Customer invoices  
* Recurring invoices  
* Estimates/quotations  
* Credit notes  
* Invoice numbering  
* Invoice status  
* Payment tracking  
* Partial payments  
* Outstanding balances  
* Due dates  
* Tax calculation  
* Discounts  
* Invoice PDF generation  
* Email invoice  
* Invoice history

Invoice statuses:

* Draft  
* Sent  
* Partially Paid  
* Paid  
* Overdue  
* Cancelled

---

# **11.7 Expense Management**

The expense module shall support:

* Manual expense entry  
* AI receipt scanning  
* OCR data extraction  
* Vendor identification  
* Expense categories  
* Expense amount extraction  
* Tax extraction  
* Receipt upload  
* Attachments  
* Approval workflow  
* Expense status  
* Employee expenses  
* Vendor expenses  
* Recurring expenses  
* Expense reports

## **AI Receipt Processing**

The AI engine shall attempt to extract:

* Vendor name  
* Receipt date  
* Invoice/receipt number  
* Total amount  
* Tax amount  
* Currency  
* Expense category  
* Line items

The extracted information shall be presented to the user for review.

An expense may then enter an approval workflow before final posting.

---

# **11.8 Inventory Management**

The inventory module shall support:

* Products  
* Product categories  
* Brands  
* Units of measure  
* Product variants  
* Barcodes  
* Warehouses  
* Warehouse locations  
* Stock balances  
* Batch tracking  
* Serial numbers where required  
* Stock receipts  
* Stock issues  
* Stock transfers  
* Adjustments  
* Reorder levels  
* Purchase orders  
* Goods receipts  
* Stock valuation  
* Inventory history  
* Inventory reports

## **Stock Movement Types**

* Purchase Receipt  
* Sales  
* Sales Return  
* Purchase Return  
* Warehouse Transfer  
* Stock Adjustment  
* Opening Stock  
* Damage  
* Expiry  
* Manual Issue

Every stock movement shall create an auditable inventory transaction.

---

# **11.9 Procurement Module**

The procurement module shall support:

* Suppliers/vendors  
* Purchase requisitions  
* Purchase orders  
* Purchase order approval  
* Goods receipts  
* Purchase invoices  
* Purchase returns  
* Supplier payments  
* Supplier balances  
* Purchase history

Purchase workflow:

Requisition → Approval → Purchase Order → Goods Receipt → Purchase Invoice → Payment

---

# **11.10 Accounting Module**

The accounting module shall provide unified accounting integration for:

* Sales  
* Purchases  
* Expenses  
* Inventory  
* Payments  
* Banking  
* POS transactions

The system should use a double-entry accounting structure.

Core accounting entities:

* Chart of Accounts  
* Journal  
* Journal Entries  
* Accounts Receivable  
* Accounts Payable  
* General Ledger  
* Tax Accounts  
* Payment Accounts

Automatic accounting entries should be generated from approved business transactions.

---

# **11.11 HR Management & Payroll**

The HR module shall support:

### **Employee Management**

* Employee profiles  
* Employee ID  
* Department  
* Designation  
* Joining date  
* Employment status  
* Salary information  
* Documents  
* Emergency/contact information

### **Attendance**

* Check-in  
* Check-out  
* Working hours  
* Late attendance  
* Overtime  
* Attendance correction  
* Attendance reports

### **Leave**

* Leave types  
* Leave policies  
* Leave balances  
* Leave requests  
* Leave approval  
* Leave history

### **Payroll**

* Salary structures  
* Basic salary  
* Allowances  
* Deductions  
* Overtime  
* Bonuses  
* Taxes where applicable  
* Payroll processing  
* Salary slips  
* Payroll approval  
* Payroll history

---

# **11.12 Calendar & Booking**

The module shall support:

* Staff schedules  
* Client appointments  
* Resource booking  
* Calendar views  
* Daily/weekly/monthly views  
* Appointment status  
* Rescheduling  
* Cancellation  
* Notifications  
* Conflict detection

Booking states:

* Pending  
* Confirmed  
* Rescheduled  
* Completed  
* Cancelled  
* No Show

---

# **11.13 Banking**

The banking module shall support:

* Bank accounts  
* Cash accounts  
* Bank transactions  
* Transfers  
* Deposits  
* Withdrawals  
* Reconciliation  
* Opening balances  
* Cash flow  
* Transaction categorization

Bank reconciliation workflow:

Bank Statement → Import/Entry → Match Transactions → Identify Unmatched Items → Reconcile → Close

---

# **11.14 User Roles & Permissions**

The system shall implement RBAC.

Permissions shall be defined at module/action level.

Example:

* POS.View  
* POS.CreateSale  
* POS.Refund  
* Invoice.View  
* Invoice.Create  
* Invoice.Approve  
* Expense.Create  
* Expense.Approve  
* Inventory.View  
* Inventory.Adjust  
* Payroll.Process  
* Banking.Reconcile  
* User.Manage

The system should also support:

* Role assignment  
* Permission inheritance  
* Branch-level restrictions  
* Warehouse-level restrictions  
* Approval permissions

---

# **11.15 AI Assistant**

The AI assistant shall provide usage-based features.

Supported functionality:

* OCR receipt reading  
* Receipt data extraction  
* Automatic expense creation  
* Expense categorization  
* Intelligent suggestions  
* Data extraction  
* AI reporting  
* Business summaries

The AI assistant should not automatically finalize sensitive accounting transactions without configured authorization.

AI-generated records should have:

* AI processing status  
* Confidence score  
* Source document  
* Extracted values  
* User verification status  
* Approval status

---

# **11.16 Forms & Document Generation**

The system shall support:

### **Export**

* Excel  
* Word  
* PDF  
* CSV

### **Import**

* Excel  
* CSV

Documents may include:

* Invoices  
* Estimates  
* Purchase orders  
* Salary slips  
* Expense reports  
* Inventory reports  
* Financial reports  
* Employee reports

Templates should be configurable.

---

# **11.17 Social Media Integration**

Supported platforms:

* Facebook  
* Instagram  
* LinkedIn  
* X/Twitter

Features:

* Connect social account  
* Create posts  
* Schedule posts  
* Publish posts  
* Campaign tracking  
* Post history  
* Publishing status  
* Error logging

Social credentials/tokens shall be encrypted.

---

# **11.18 Notification System**

Channels:

* Email  
* SMS  
* Push Notification  
* In-app notification

Notification events include:

* Task reminders  
* Approval requests  
* Approval results  
* Invoice reminders  
* Payment reminders  
* Appointment reminders  
* Payroll notifications  
* Inventory alerts  
* Reorder alerts  
* Subscription alerts

The system should provide notification templates and user notification preferences.

---

# **11.19 Mobile Application**

Flutter-based Android and iOS applications shall provide:

* Login  
* Dashboard  
* Reports  
* Inventory lookup  
* Barcode scanning  
* AI receipt scanner  
* Expense submission  
* Approval status  
* Push notifications  
* Profile management

Mobile authentication should use secure token-based authentication.

---

# **11.20 Subscription & Seat Management**

The platform shall support:

* Subscription plans  
* Monthly/yearly billing  
* Base seat allocation  
* Additional seats  
* Subscription status  
* Trial periods  
* Upgrade  
* Downgrade  
* Renewal  
* Cancellation  
* Usage limits

Seat calculation:

`Available Seats = Base Plan Seats + Purchased Additional Seats`

The system shall prevent creation of users beyond the permitted seat count unless additional seats are purchased.

---

# **11.21 Reporting & Dashboard**

Dashboard widgets may include:

* Sales today  
* Sales this month  
* Expenses  
* Net income  
* Outstanding invoices  
* Receivables  
* Payables  
* Inventory value  
* Low-stock products  
* Purchase value  
* Payroll  
* Cash balance  
* Bank balance  
* Upcoming appointments

Reports shall support:

* Date filters  
* Branch filters  
* Warehouse filters  
* Employee filters  
* Customer filters  
* Supplier filters  
* Export to Excel/PDF/CSV

---

# **11.22 Security Requirements**

The platform shall implement:

* HTTPS  
* Password hashing  
* Secure authentication  
* Access tokens  
* Refresh tokens  
* Role-based authorization  
* Tenant isolation  
* Audit logs  
* API rate limiting  
* Input validation  
* File upload validation  
* Encrypted sensitive credentials  
* Session management  
* Login activity tracking

Sensitive operations should optionally require additional verification.

---

# **11.23 Audit Trail**

The system shall record:

* User  
* Tenant  
* Action  
* Module  
* Entity  
* Entity ID  
* Old value  
* New value  
* IP address  
* Device information  
* Timestamp

Audit logs shall be immutable to normal users.

---

# **11.24 Non-Functional Requirements**

### **Performance**

Normal API operations should target a response time of approximately 1–3 seconds under normal load.

### **Availability**

The SaaS platform should target high availability with monitoring and automated recovery.

### **Scalability**

The architecture should support:

* Multiple tenants  
* Multiple branches  
* Thousands of users  
* Large transaction volumes  
* Large inventory catalogs

### **Reliability**

Transactions must be atomic where financial/inventory consistency is required.

### **Maintainability**

The backend should use modular services/modules with clear domain boundaries.

### **Backup**

Database backups should be automated and tested periodically.

### **Disaster Recovery**

The platform should have documented backup restoration and disaster recovery procedures.

---

# **11.25 Recommended Technology Architecture**

### **Web**

* React / Next.js  
* Responsive UI  
* REST/GraphQL API

### **Mobile**

* Flutter  
* Android  
* iOS

### **Backend**

* Node.js/NestJS, Laravel, Django, or equivalent enterprise framework  
* REST API  
* Background job processing

### **Database**

* PostgreSQL recommended

### **Cache**

* Redis

### **File Storage**

* S3-compatible object storage

### **Queue**

* Redis Queue / RabbitMQ / equivalent

### **AI**

* OCR \+ LLM-based extraction service

### **Notifications**

* Email provider  
* SMS provider  
* Firebase Cloud Messaging

### **Infrastructure**

* Docker  
* Cloud load balancer  
* Application servers  
* Database server  
* Object storage  
* Monitoring/logging

---

# **11.26 Major Modules**

The final application should contain:

1. Authentication  
2. Tenant Management  
3. Subscription Management  
4. User & Role Management  
5. Dashboard  
6. POS  
7. Customers  
8. Invoicing  
9. Expenses  
10. Inventory  
11. Procurement  
12. Suppliers  
13. Accounting  
14. Banking  
15. HR  
16. Payroll  
17. Calendar  
18. Booking  
19. Notifications  
20. AI Assistant  
21. Documents/Forms  
22. Social Media  
23. Reports  
24. Audit Logs  
25. Mobile Application

# Tab 2

# **22\. End-to-End System Workflow**

## **22.1 High-Level Architecture Flow**

                        ┌──────────────────────┐  
                         │   Web Application    │  
                         └──────────┬───────────┘  
                                    │  
                         ┌──────────▼───────────┐  
                         │   API / Application  │  
                         │       Backend        │  
                         └──────────┬───────────┘  
                                    │  
          ┌─────────────────────────┼─────────────────────────┐  
          │                         │                         │  
 ┌────────▼────────┐      ┌─────────▼─────────┐      ┌───────▼────────┐  
 │ Business Modules│      │ Workflow/Approval │      │ AI/Background  │  
 │ POS/ERP/HR/etc. │      │      Engine       │      │     Workers     │  
 └────────┬────────┘      └─────────┬─────────┘      └───────┬────────┘  
          │                         │                         │  
          └─────────────────────────┼─────────────────────────┘  
                                    │  
                         ┌──────────▼───────────┐  
                         │     PostgreSQL       │  
                         └──────────┬───────────┘  
                                    │  
              ┌─────────────────────┼─────────────────────┐  
              │                     │                     │  
       ┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐  
       │ Redis/Queue │      │ File Storage │      │ Integrations│  
       └─────────────┘      └──────────────┘      └─────────────┘

---

# **22.2 Tenant Onboarding Workflow**

Platform Admin  
     ↓  
Create Subscription Plan  
     ↓  
Customer Registers  
     ↓  
Create Tenant/Company  
     ↓  
Select Subscription  
     ↓  
Create Tenant Owner  
     ↓  
Configure Branches  
     ↓  
Configure Warehouses  
     ↓  
Configure Tax & Accounting  
     ↓  
Create Roles  
     ↓  
Invite Users  
     ↓  
Import Products/Customers/Suppliers  
     ↓  
System Ready

---

# **22.3 POS Sales Workflow**

Cashier Login  
     ↓  
Open POS Session  
     ↓  
Enter Opening Cash  
     ↓  
Scan/Search Product  
     ↓  
Add Product to Cart  
     ↓  
Apply Discount/Tax  
     ↓  
Select Customer  
     ↓  
Select Payment Method  
     ↓  
Payment Successful?  
    / \\  
  No   Yes  
  ↓     ↓  
Retry   Create Sale  
        ↓  
   Update Inventory  
        ↓  
   Create Accounting Entry  
        ↓  
   Generate Receipt/Invoice  
        ↓  
   Open Cash Drawer  
        ↓  
   Send Notification/Receipt

---

# **22.4 Offline POS Workflow**

Internet Available?  
      │  
   ┌──┴───┐  
  YES     NO  
   │       │  
Server    Local Database  
   │       │  
   └──┬────┘  
      ↓  
Create Transaction  
      ↓  
Generate Local Transaction ID  
      ↓  
Mark Sync Status  
      ↓  
Connection Restored  
      ↓  
Send Pending Transactions  
      ↓  
Server Validates Idempotency Key  
      ↓  
Create Server Transaction  
      ↓  
Update Inventory/Accounting  
      ↓  
Return Server ID  
      ↓  
Mark Local Transaction \= Synced

---

# **22.5 Sales-to-Accounting Workflow**

POS / Invoice  
     ↓  
Sale Confirmed  
     ↓  
Create Invoice/Sales Record  
     ↓  
Create Payment Record  
     ↓  
Create Inventory Movement  
     ↓  
Calculate Tax  
     ↓  
Generate Journal Entry  
     ↓  
Update General Ledger  
     ↓  
Update Customer Balance  
     ↓  
Update Cash/Bank Balance

---

# **22.6 Purchase Workflow**

Purchase Requisition  
        ↓  
Manager Approval  
        ↓  
Purchase Order  
        ↓  
Supplier Confirmation  
        ↓  
Goods Receipt  
        ↓  
Inventory Increased  
        ↓  
Purchase Invoice  
        ↓  
Accounts Payable Created  
        ↓  
Payment  
        ↓  
Bank/Cash Reduced  
        ↓  
Supplier Balance Updated  
        ↓  
Accounting Updated

---

# **22.7 Expense \+ AI Receipt Workflow**

User Uploads Receipt  
        ↓  
File Validation  
        ↓  
OCR Processing  
        ↓  
AI Data Extraction  
        ↓  
Extract:  
Vendor  
Date  
Amount  
Tax  
Category  
Line Items  
        ↓  
Confidence Check  
        ↓  
User Review  
        ↓  
Correct?  
   /         \\  
 No           Yes  
 ↓             ↓  
Edit Data    Submit  
       \\       /  
        ↓     ↓  
     Expense Created  
          ↓  
    Approval Workflow  
          ↓  
     Manager Approval  
        /       \\  
    Reject      Approve  
      ↓            ↓  
   Returned    Accounting  
               Entry  
                  ↓  
             Expense Posted

---

# **22.8 Inventory Workflow**

Purchase / Opening Stock / Adjustment  
                ↓  
          Stock Movement  
                ↓  
       Warehouse Selected  
                ↓  
       Batch/Serial Recorded  
                ↓  
       Inventory Quantity Updated  
                ↓  
       Stock Valuation Updated  
                ↓  
       Reorder Level Checked  
                ↓  
       Low Stock?  
          /          \\  
        Yes           No  
         ↓             ↓  
     Alert/Task      Continue

Sales reduce stock, while purchases and approved goods receipts increase stock.

---

# **22.9 Stock Transfer Workflow**

Warehouse A  
    ↓  
Transfer Request  
    ↓  
Approval (if required)  
    ↓  
Stock Reserved  
    ↓  
Dispatch  
    ↓  
Stock Removed from Warehouse A  
    ↓  
Goods In Transit  
    ↓  
Receive at Warehouse B  
    ↓  
Stock Added to Warehouse B  
    ↓  
Transfer Completed

---

# **22.10 Invoice Workflow**

Create Invoice  
      ↓  
Draft  
      ↓  
Review  
      ↓  
Send to Customer  
      ↓  
Customer Payment  
      ↓  
Partial or Full?  
    /       \\  
Partial     Full  
  ↓           ↓  
Balance    Mark Paid  
Remaining     ↓  
  ↓        Accounting  
Reminder

---

# **22.11 Recurring Invoice Workflow**

Recurring Invoice Template  
          ↓  
Frequency Configured  
          ↓  
Scheduler Runs  
          ↓  
Generate Invoice  
          ↓  
Send Invoice  
          ↓  
Track Payment  
          ↓  
Payment Reminder  
          ↓  
Next Billing Date  
          ↓  
Repeat

---

# **22.12 Employee & Payroll Workflow**

Create Employee  
      ↓  
Assign Department  
      ↓  
Assign Designation  
      ↓  
Define Salary Structure  
      ↓  
Attendance Collection  
      ↓  
Leave Calculation  
      ↓  
Overtime Calculation  
      ↓  
Payroll Processing  
      ↓  
Apply Allowances/Deductions  
      ↓  
Generate Salary Slip  
      ↓  
Payroll Approval  
      ↓  
Payment  
      ↓  
Accounting Entry

---

# **22.13 Leave Workflow**

Employee  
   ↓  
Submit Leave Request  
   ↓  
Check Leave Balance  
   ↓  
Manager Approval  
   ↓  
Approved?  
 /      \\  
No       Yes  
↓         ↓  
Reject   Deduct Leave Balance  
           ↓  
        Attendance Update  
           ↓  
        Notification

---

# **22.14 Appointment Workflow**

Customer  
   ↓  
Select Service  
   ↓  
Select Staff/Resource  
   ↓  
Select Date/Time  
   ↓  
Availability Check  
   ↓  
Available?  
 /       \\  
No        Yes  
↓          ↓  
Suggest   Create Booking  
Alternative    ↓  
          Confirmation  
              ↓  
        Reminder Notification  
              ↓  
          Appointment  
              ↓  
       Completed/Cancelled

---

# **22.15 Banking Workflow**

Bank Account  
     ↓  
Transaction Import/Entry  
     ↓  
Categorize Transaction  
     ↓  
Match Existing Transaction?  
    /              \\  
  Yes               No  
   ↓                 ↓  
Match             Review  
   \\                 /  
    └──────┬────────┘  
           ↓  
      Reconciliation  
           ↓  
       Reconciled  
           ↓  
      Bank Balance  
           ↓  
      Cash Flow Report

---

# **22.16 Approval Engine Workflow**

The same approval engine should be reusable by multiple modules.

Record Created  
      ↓  
Determine Approval Policy  
      ↓  
Determine Approver  
      ↓  
Create Approval Request  
      ↓  
Send Notification  
      ↓  
Approver Reviews  
      ↓  
Approve / Reject / Request Changes  
      ↓  
Update Record Status  
      ↓  
Notify Requester  
      ↓  
Audit Log

Applicable modules:

* Expenses  
* Purchase Orders  
* Leave  
* Payroll  
* Stock Adjustments  
* Refunds  
* Credit Notes  
* Other configurable workflows

---

# **22.17 Notification Workflow**

Business Event  
     ↓  
Notification Rule  
     ↓  
Find Recipients  
     ↓  
Check User Preferences  
     ↓  
Generate Message  
     ↓  
Email / SMS / Push / In-App  
     ↓  
Delivery Status  
     ↓  
Store Notification Log

---

# **22.18 Mobile Workflow**

Mobile Login  
    ↓  
Authenticate  
    ↓  
Load User/Tenant Permissions  
    ↓  
Load Dashboard  
    ↓  
User Performs Action  
    ↓  
API Request  
    ↓  
Authorization  
    ↓  
Business Logic  
    ↓  
Database Update  
    ↓  
API Response  
    ↓  
Mobile UI Update

For receipt scanning:

Camera  
  ↓  
Capture Receipt  
  ↓  
Image Compression  
  ↓  
OCR/AI  
  ↓  
Extract Data  
  ↓  
Review  
  ↓  
Submit Expense

---

# **22.19 Social Media Workflow**

Connect Social Account  
       ↓  
OAuth Authorization  
       ↓  
Store Encrypted Token  
       ↓  
Create Post  
       ↓  
Select Platform(s)  
       ↓  
Publish Now / Schedule  
       ↓  
Background Scheduler  
       ↓  
Social API  
       ↓  
Success/Failure  
       ↓  
Store Publishing Log

---

# **22.20 Subscription & Seat Workflow**

Customer Selects Plan  
       ↓  
Subscription Created  
       ↓  
Base Seats Assigned  
       ↓  
Tenant Creates Users  
       ↓  
Check Seat Availability  
       ↓  
Available?  
 /       \\  
Yes       No  
 ↓         ↓  
Create    Purchase Additional Seat  
User          ↓  
              Payment  
                ↓  
          Increase Seat Limit  
                ↓  
             Create User

---

# **22.21 Unified Business Flow**

The core integration should follow this model:

                   ┌─────────────┐  
                    │    POS      │  
                    └──────┬──────┘  
                           │  
                    Sales / Payment  
                           │  
                           ▼  
                    ┌─────────────┐  
                    │ Accounting  │  
                    └──────┬──────┘  
                           │  
          ┌────────────────┼────────────────┐  
          ▼                ▼                ▼  
      Inventory         Banking        Customer AR  
          │                │                │  
          ▼                ▼                ▼  
       Stock            Cash/Bank       Receivables

Procurement ──→ Inventory ──→ Accounting ──→ Payables  
Expenses ─────→ Accounting ─→ Banking  
Payroll ──────→ Accounting ─→ Banking

This unified transaction model is important so that sales, purchases, inventory, cash, banking and accounting do not become disconnected modules.

# Tab 3

# **33\. Database Design**

## **33.1 Database Recommendation**

**PostgreSQL** is recommended because the system contains:

* Financial transactions  
* Inventory transactions  
* Relational business data  
* Multi-tenant requirements  
* Complex reporting  
* Approval workflows  
* Audit requirements  
* Strong transaction consistency

The database should use UUID primary keys for major entities.

---

# **33.2 Core Entity Relationship**

TENANT  
  │  
  ├── Branch  
  │     ├── Users  
  │     ├── POS Terminals  
  │     └── Employees  
  │  
  ├── Warehouses  
  │     └── Stock  
  │  
  ├── Customers  
  ├── Suppliers  
  ├── Products  
  ├── Invoices  
  ├── Expenses  
  ├── Purchases  
  ├── Bank Accounts  
  ├── Employees  
  ├── Appointments  
  ├── Accounting  
  └── Reports

---

# **33.3 Common Columns**

Most tenant-owned tables should contain:

id UUID PK  
tenant\_id UUID FK  
created\_at TIMESTAMP  
updated\_at TIMESTAMP  
created\_by UUID  
updated\_by UUID  
deleted\_at TIMESTAMP NULL

Soft deletion should be used where historical/audit preservation is required.

---

# **33.4 Tenant & Organization Tables**

## **tenants**

id UUID PK  
name VARCHAR  
legal\_name VARCHAR  
email VARCHAR  
phone VARCHAR  
address TEXT  
country VARCHAR  
currency VARCHAR  
timezone VARCHAR  
tax\_number VARCHAR  
status VARCHAR  
created\_at TIMESTAMP  
updated\_at TIMESTAMP

## **branches**

id UUID PK  
tenant\_id UUID FK  
name VARCHAR  
code VARCHAR  
address TEXT  
phone VARCHAR  
email VARCHAR  
status VARCHAR  
created\_at TIMESTAMP  
updated\_at TIMESTAMP

Relationship:

Tenant 1 ─── N Branches

---

# **33.5 Users & Roles**

## **users**

id UUID PK  
tenant\_id UUID FK  
name VARCHAR  
email VARCHAR  
phone VARCHAR  
password\_hash VARCHAR  
status VARCHAR  
last\_login\_at TIMESTAMP  
created\_at TIMESTAMP  
updated\_at TIMESTAMP

## **roles**

id UUID PK  
tenant\_id UUID FK NULL  
name VARCHAR  
description TEXT  
is\_system\_role BOOLEAN  
created\_at TIMESTAMP  
updated\_at TIMESTAMP

## **permissions**

id UUID PK  
module VARCHAR  
action VARCHAR  
description TEXT

## **user\_roles**

user\_id UUID FK  
role\_id UUID FK  
PRIMARY KEY(user\_id, role\_id)

## **role\_permissions**

role\_id UUID FK  
permission\_id UUID FK  
PRIMARY KEY(role\_id, permission\_id)

---

# **33.6 Subscription Tables**

## **subscription\_plans**

id UUID PK  
name VARCHAR  
price DECIMAL  
billing\_cycle VARCHAR  
base\_seats INT  
status VARCHAR  
created\_at TIMESTAMP

## **subscriptions**

id UUID PK  
tenant\_id UUID FK  
plan\_id UUID FK  
start\_date DATE  
end\_date DATE  
status VARCHAR  
auto\_renew BOOLEAN

## **subscription\_seats**

id UUID PK  
subscription\_id UUID FK  
included\_seats INT  
additional\_seats INT  
used\_seats INT

---

# **33.7 Customer Tables**

## **customers**

id UUID PK  
tenant\_id UUID FK  
customer\_code VARCHAR  
name VARCHAR  
email VARCHAR  
phone VARCHAR  
address TEXT  
tax\_number VARCHAR  
credit\_limit DECIMAL  
opening\_balance DECIMAL  
status VARCHAR  
created\_at TIMESTAMP  
updated\_at TIMESTAMP

---

# **33.8 Supplier Tables**

## **suppliers**

id UUID PK  
tenant\_id UUID FK  
supplier\_code VARCHAR  
name VARCHAR  
email VARCHAR  
phone VARCHAR  
address TEXT  
tax\_number VARCHAR  
opening\_balance DECIMAL  
status VARCHAR  
created\_at TIMESTAMP  
updated\_at TIMESTAMP

---

# **33.9 Product & Inventory Tables**

## **product\_categories**

id UUID PK  
tenant\_id UUID FK  
name VARCHAR  
parent\_id UUID FK NULL

## **products**

id UUID PK  
tenant\_id UUID FK  
category\_id UUID FK  
sku VARCHAR  
barcode VARCHAR  
name VARCHAR  
description TEXT  
unit\_id UUID FK  
cost\_price DECIMAL  
selling\_price DECIMAL  
tax\_rate DECIMAL  
reorder\_level DECIMAL  
track\_batch BOOLEAN  
track\_serial BOOLEAN  
status VARCHAR

## **product\_variants**

id UUID PK  
product\_id UUID FK  
sku VARCHAR  
barcode VARCHAR  
attributes JSONB  
cost\_price DECIMAL  
selling\_price DECIMAL

## **units**

id UUID PK  
tenant\_id UUID FK  
name VARCHAR  
symbol VARCHAR

---

# **33.10 Warehouse Tables**

## **warehouses**

id UUID PK  
tenant\_id UUID FK  
branch\_id UUID FK  
name VARCHAR  
code VARCHAR  
address TEXT  
status VARCHAR

## **warehouse\_locations**

id UUID PK  
warehouse\_id UUID FK  
name VARCHAR  
code VARCHAR

## **stock\_balances**

id UUID PK  
tenant\_id UUID FK  
warehouse\_id UUID FK  
product\_id UUID FK  
variant\_id UUID FK NULL  
quantity DECIMAL  
reserved\_quantity DECIMAL  
average\_cost DECIMAL

---

# **33.11 Inventory Transaction Tables**

## **stock\_movements**

id UUID PK  
tenant\_id UUID FK  
warehouse\_id UUID FK  
product\_id UUID FK  
variant\_id UUID FK NULL  
batch\_id UUID FK NULL  
movement\_type VARCHAR  
quantity DECIMAL  
unit\_cost DECIMAL  
reference\_type VARCHAR  
reference\_id UUID  
movement\_date TIMESTAMP  
created\_by UUID

Examples of `movement_type`:

PURCHASE\_RECEIPT  
SALE  
SALES\_RETURN  
PURCHASE\_RETURN  
TRANSFER\_OUT  
TRANSFER\_IN  
ADJUSTMENT  
OPENING  
DAMAGE  
EXPIRY

## **batches**

id UUID PK  
product\_id UUID FK  
warehouse\_id UUID FK  
batch\_number VARCHAR  
manufacture\_date DATE  
expiry\_date DATE  
quantity DECIMAL

---

# **33.12 POS Tables**

## **pos\_terminals**

id UUID PK  
tenant\_id UUID FK  
branch\_id UUID FK  
name VARCHAR  
code VARCHAR  
device\_identifier VARCHAR  
status VARCHAR

## **pos\_sessions**

id UUID PK  
terminal\_id UUID FK  
cashier\_id UUID FK  
opening\_cash DECIMAL  
closing\_cash DECIMAL  
opened\_at TIMESTAMP  
closed\_at TIMESTAMP  
status VARCHAR

## **sales**

id UUID PK  
tenant\_id UUID FK  
branch\_id UUID FK  
customer\_id UUID FK NULL  
pos\_session\_id UUID FK NULL  
invoice\_id UUID FK NULL  
transaction\_number VARCHAR  
transaction\_date TIMESTAMP  
subtotal DECIMAL  
discount DECIMAL  
tax DECIMAL  
total DECIMAL  
status VARCHAR  
offline\_transaction\_key VARCHAR UNIQUE

## **sale\_items**

id UUID PK  
sale\_id UUID FK  
product\_id UUID FK  
variant\_id UUID FK NULL  
quantity DECIMAL  
unit\_price DECIMAL  
discount DECIMAL  
tax DECIMAL  
total DECIMAL

---

# **33.13 Payment Tables**

## **payments**

id UUID PK  
tenant\_id UUID FK  
reference\_type VARCHAR  
reference\_id UUID  
payment\_method VARCHAR  
amount DECIMAL  
currency VARCHAR  
transaction\_reference VARCHAR  
payment\_date TIMESTAMP  
status VARCHAR

Payment methods:

CASH  
CARD  
BANK  
MOBILE\_PAYMENT  
CHEQUE  
OTHER

---

# **33.14 Invoice Tables**

## **invoices**

id UUID PK  
tenant\_id UUID FK  
customer\_id UUID FK  
invoice\_number VARCHAR  
invoice\_date DATE  
due\_date DATE  
subtotal DECIMAL  
discount DECIMAL  
tax DECIMAL  
total DECIMAL  
paid\_amount DECIMAL  
balance\_due DECIMAL  
status VARCHAR

## **invoice\_items**

id UUID PK  
invoice\_id UUID FK  
product\_id UUID FK NULL  
description TEXT  
quantity DECIMAL  
unit\_price DECIMAL  
discount DECIMAL  
tax DECIMAL  
total DECIMAL

---

# **33.15 Recurring Invoice Tables**

## **recurring\_invoices**

id UUID PK  
tenant\_id UUID FK  
customer\_id UUID FK  
frequency VARCHAR  
start\_date DATE  
next\_invoice\_date DATE  
end\_date DATE NULL  
amount DECIMAL  
status VARCHAR

---

# **33.16 Credit Note Tables**

## **credit\_notes**

id UUID PK  
tenant\_id UUID FK  
customer\_id UUID FK  
invoice\_id UUID FK NULL  
credit\_note\_number VARCHAR  
amount DECIMAL  
reason TEXT  
status VARCHAR  
created\_at TIMESTAMP

---

# **33.17 Expense Tables**

## **expense\_categories**

id UUID PK  
tenant\_id UUID FK  
name VARCHAR  
parent\_id UUID FK NULL

## **expenses**

id UUID PK  
tenant\_id UUID FK  
employee\_id UUID FK NULL  
vendor\_id UUID FK NULL  
category\_id UUID FK  
expense\_date DATE  
description TEXT  
amount DECIMAL  
tax\_amount DECIMAL  
currency VARCHAR  
status VARCHAR  
source VARCHAR  
ai\_processed BOOLEAN  
ai\_confidence DECIMAL  
approval\_status VARCHAR

## **expense\_attachments**

id UUID PK  
expense\_id UUID FK  
file\_name VARCHAR  
file\_url TEXT  
mime\_type VARCHAR  
file\_size BIGINT

---

# **33.18 AI/OCR Tables**

## **ai\_processing\_jobs**

id UUID PK  
tenant\_id UUID FK  
entity\_type VARCHAR  
entity\_id UUID  
job\_type VARCHAR  
status VARCHAR  
confidence DECIMAL  
raw\_response JSONB  
processed\_at TIMESTAMP

## **ai\_extracted\_fields**

id UUID PK  
job\_id UUID FK  
field\_name VARCHAR  
field\_value TEXT  
confidence DECIMAL  
verified BOOLEAN  
verified\_by UUID FK NULL

This design allows the AI system to evolve without adding a new database column for every extracted field.

---

# **33.19 Procurement Tables**

## **purchase\_orders**

id UUID PK  
tenant\_id UUID FK  
supplier\_id UUID FK  
warehouse\_id UUID FK  
po\_number VARCHAR  
order\_date DATE  
expected\_date DATE  
subtotal DECIMAL  
tax DECIMAL  
discount DECIMAL  
total DECIMAL  
status VARCHAR  
approval\_status VARCHAR

## **purchase\_order\_items**

id UUID PK  
purchase\_order\_id UUID FK  
product\_id UUID FK  
quantity DECIMAL  
unit\_cost DECIMAL  
tax DECIMAL  
discount DECIMAL  
total DECIMAL

## **goods\_receipts**

id UUID PK  
tenant\_id UUID FK  
purchase\_order\_id UUID FK  
warehouse\_id UUID FK  
receipt\_number VARCHAR  
receipt\_date DATE  
status VARCHAR

## **goods\_receipt\_items**

id UUID PK  
goods\_receipt\_id UUID FK  
product\_id UUID FK  
quantity DECIMAL  
batch\_id UUID FK NULL  
unit\_cost DECIMAL

---

# **33.20 Accounting Tables**

## **chart\_of\_accounts**

id UUID PK  
tenant\_id UUID FK  
account\_code VARCHAR  
account\_name VARCHAR  
account\_type VARCHAR  
parent\_id UUID FK NULL  
is\_system\_account BOOLEAN  
status VARCHAR

Account types:

ASSET  
LIABILITY  
EQUITY  
REVENUE  
EXPENSE

## **journals**

id UUID PK  
tenant\_id UUID FK  
journal\_number VARCHAR  
journal\_date DATE  
reference\_type VARCHAR  
reference\_id UUID  
description TEXT  
status VARCHAR

## **journal\_entries**

id UUID PK  
journal\_id UUID FK  
account\_id UUID FK  
debit DECIMAL  
credit DECIMAL  
description TEXT

Accounting rule:

SUM(debit) \= SUM(credit)

for every posted journal.

---

# **33.21 Banking Tables**

## **bank\_accounts**

id UUID PK  
tenant\_id UUID FK  
bank\_name VARCHAR  
account\_name VARCHAR  
account\_number VARCHAR  
currency VARCHAR  
opening\_balance DECIMAL  
current\_balance DECIMAL  
status VARCHAR

## **bank\_transactions**

id UUID PK  
bank\_account\_id UUID FK  
transaction\_date DATE  
reference VARCHAR  
description TEXT  
debit DECIMAL  
credit DECIMAL  
balance DECIMAL  
reconciliation\_status VARCHAR

## **bank\_reconciliations**

id UUID PK  
bank\_account\_id UUID FK  
statement\_date DATE  
statement\_balance DECIMAL  
book\_balance DECIMAL  
difference DECIMAL  
status VARCHAR  
reconciled\_by UUID FK  
reconciled\_at TIMESTAMP

---

# **33.22 HR Tables**

## **employees**

id UUID PK  
tenant\_id UUID FK  
user\_id UUID FK NULL  
employee\_code VARCHAR  
first\_name VARCHAR  
last\_name VARCHAR  
department\_id UUID FK  
designation\_id UUID FK  
joining\_date DATE  
employment\_status VARCHAR  
salary DECIMAL  
phone VARCHAR  
email VARCHAR

## **departments**

id UUID PK  
tenant\_id UUID FK  
name VARCHAR

## **designations**

id UUID PK  
tenant\_id UUID FK  
name VARCHAR

---

# **33.23 Attendance Tables**

## **attendance**

id UUID PK  
tenant\_id UUID FK  
employee\_id UUID FK  
attendance\_date DATE  
check\_in TIMESTAMP  
check\_out TIMESTAMP  
working\_hours DECIMAL  
overtime\_hours DECIMAL  
status VARCHAR

---

# **33.24 Leave Tables**

## **leave\_types**

id UUID PK  
tenant\_id UUID FK  
name VARCHAR  
annual\_days DECIMAL

## **leave\_requests**

id UUID PK  
tenant\_id UUID FK  
employee\_id UUID FK  
leave\_type\_id UUID FK  
start\_date DATE  
end\_date DATE  
days DECIMAL  
reason TEXT  
status VARCHAR  
approved\_by UUID FK NULL

---

# **33.25 Payroll Tables**

## **salary\_structures**

id UUID PK  
tenant\_id UUID FK  
employee\_id UUID FK  
basic\_salary DECIMAL  
allowances JSONB  
deductions JSONB  
effective\_from DATE

## **payroll\_runs**

id UUID PK  
tenant\_id UUID FK  
period\_start DATE  
period\_end DATE  
total\_gross DECIMAL  
total\_deductions DECIMAL  
total\_net DECIMAL  
status VARCHAR

## **payroll\_items**

id UUID PK  
payroll\_run\_id UUID FK  
employee\_id UUID FK  
basic\_salary DECIMAL  
allowances DECIMAL  
deductions DECIMAL  
overtime DECIMAL  
net\_salary DECIMAL

## **salary\_slips**

id UUID PK  
payroll\_item\_id UUID FK  
slip\_number VARCHAR  
file\_url TEXT  
generated\_at TIMESTAMP

---

# **33.26 Calendar & Booking Tables**

## **resources**

id UUID PK  
tenant\_id UUID FK  
name VARCHAR  
resource\_type VARCHAR  
status VARCHAR

## **appointments**

id UUID PK  
tenant\_id UUID FK  
customer\_id UUID FK  
employee\_id UUID FK NULL  
resource\_id UUID FK NULL  
start\_time TIMESTAMP  
end\_time TIMESTAMP  
status VARCHAR  
notes TEXT

---

# **33.27 Notification Tables**

## **notification\_templates**

id UUID PK  
tenant\_id UUID FK NULL  
event\_type VARCHAR  
channel VARCHAR  
subject TEXT  
body TEXT

## **notifications**

id UUID PK  
tenant\_id UUID FK  
user\_id UUID FK  
event\_type VARCHAR  
channel VARCHAR  
title VARCHAR  
message TEXT  
status VARCHAR  
sent\_at TIMESTAMP NULL  
read\_at TIMESTAMP NULL

---

# **33.28 Social Media Tables**

## **social\_accounts**

id UUID PK  
tenant\_id UUID FK  
platform VARCHAR  
account\_name VARCHAR  
access\_token\_encrypted TEXT  
refresh\_token\_encrypted TEXT  
token\_expiry TIMESTAMP  
status VARCHAR

## **social\_posts**

id UUID PK  
tenant\_id UUID FK  
created\_by UUID FK  
content TEXT  
media JSONB  
scheduled\_at TIMESTAMP NULL  
status VARCHAR

## **social\_post\_platforms**

id UUID PK  
social\_post\_id UUID FK  
social\_account\_id UUID FK  
external\_post\_id VARCHAR NULL  
status VARCHAR  
published\_at TIMESTAMP NULL  
error\_message TEXT NULL

---

# **33.29 Approval Workflow Tables**

## **approval\_workflows**

id UUID PK  
tenant\_id UUID FK  
module VARCHAR  
name VARCHAR  
status VARCHAR

## **approval\_steps**

id UUID PK  
workflow\_id UUID FK  
step\_order INT  
approver\_role\_id UUID FK NULL  
approver\_user\_id UUID FK NULL

## **approval\_requests**

id UUID PK  
tenant\_id UUID FK  
workflow\_id UUID FK  
entity\_type VARCHAR  
entity\_id UUID  
current\_step INT  
status VARCHAR  
requested\_by UUID FK

## **approval\_actions**

id UUID PK  
approval\_request\_id UUID FK  
step\_id UUID FK  
action VARCHAR  
comment TEXT  
acted\_by UUID FK  
acted\_at TIMESTAMP

---

# **33.30 Audit Log**

## **audit\_logs**

id UUID PK  
tenant\_id UUID FK  
user\_id UUID FK  
module VARCHAR  
entity\_type VARCHAR  
entity\_id UUID  
action VARCHAR  
old\_values JSONB  
new\_values JSONB  
ip\_address VARCHAR  
user\_agent TEXT  
created\_at TIMESTAMP

---

# **33.31 Document/File Management**

## **files**

id UUID PK  
tenant\_id UUID FK  
entity\_type VARCHAR  
entity\_id UUID  
file\_name VARCHAR  
storage\_path TEXT  
mime\_type VARCHAR  
file\_size BIGINT  
uploaded\_by UUID FK  
created\_at TIMESTAMP

Files should be stored in object storage rather than directly inside PostgreSQL.

---

# **33.32 Important Relationships**

Tenant  
 ├── Users  
 │    └── Roles  
 │         └── Permissions  
 │  
 ├── Branches  
 │    └── POS Terminals  
 │         └── POS Sessions  
 │              └── Sales  
 │  
 ├── Products  
 │    ├── Variants  
 │    └── Stock Movements  
 │  
 ├── Warehouses  
 │    └── Stock Balances  
 │  
 ├── Customers  
 │    └── Invoices  
 │         └── Invoice Items  
 │  
 ├── Suppliers  
 │    └── Purchase Orders  
 │         └── Goods Receipts  
 │  
 ├── Expenses  
 │    └── AI Processing  
 │  
 ├── Employees  
 │    ├── Attendance  
 │    ├── Leave  
 │    └── Payroll  
 │  
 ├── Bank Accounts  
 │    └── Bank Transactions  
 │  
 └── Accounting  
      ├── Chart of Accounts  
      ├── Journals  
      └── Journal Entries

---

# **33.33 Critical Database Rules**

## **Rule 1 — Tenant Isolation**

Every tenant-owned record must be associated with `tenant_id`.

## **Rule 2 — Financial Integrity**

Posted financial transactions should not be physically deleted.

Use reversal/correction transactions instead.

## **Rule 3 — Inventory Integrity**

Stock should be derived from controlled stock movements and/or maintained through transactional stock balance updates.

## **Rule 4 — Accounting Integrity**

Every posted journal must satisfy:

Total Debit \= Total Credit

## **Rule 5 — Offline POS Integrity**

Every offline transaction must have a globally unique idempotency key:

tenant\_id \+ device\_id \+ offline\_transaction\_key

## **Rule 6 — Auditability**

Changes to important business records should generate audit records.

## **Rule 7 — Approval Integrity**

An approved record should not be silently modified. Significant changes should either restart approval or create a new revision.

---

# **33.34 Recommended Database Indexes**

Important indexes include:

users(tenant\_id, email)

customers(tenant\_id, customer\_code)

products(tenant\_id, sku)

products(tenant\_id, barcode)

stock\_balances(tenant\_id, warehouse\_id, product\_id)

stock\_movements(tenant\_id, product\_id, movement\_date)

invoices(tenant\_id, invoice\_number)

invoices(tenant\_id, customer\_id, status)

sales(tenant\_id, transaction\_number)

sales(tenant\_id, transaction\_date)

expenses(tenant\_id, expense\_date)

employees(tenant\_id, employee\_code)

bank\_transactions(bank\_account\_id, transaction\_date)

audit\_logs(tenant\_id, created\_at)

Unique constraints should be tenant-aware where business identifiers are not globally unique.

Example:

UNIQUE(tenant\_id, invoice\_number)  
UNIQUE(tenant\_id, sku)  
UNIQUE(tenant\_id, customer\_code)  
UNIQUE(tenant\_id, supplier\_code)

---

# **33.35 Recommended Transaction Boundaries**

A POS sale should execute as one database transaction:

BEGIN

Create Sale  
Create Sale Items  
Create Payment  
Create Stock Movements  
Update Stock Balance  
Create Invoice  
Create Accounting Journal  
Create Journal Entries  
Create Audit Log

COMMIT

If any critical operation fails:

ROLLBACK

This prevents situations such as:

* Payment recorded but inventory not reduced  
* Inventory reduced but sale not created  
* Sale created but accounting missing

---

# **33.36 Database Architecture Summary**

The database should therefore be organized into these logical domains:

1\. Identity & Tenant  
2\. Subscription  
3\. User & RBAC  
4\. Customer  
5\. Supplier  
6\. Product  
7\. Inventory  
8\. POS  
9\. Sales  
10\. Invoicing  
11\. Procurement  
12\. Expenses  
13\. Accounting  
14\. Banking  
15\. HR  
16\. Attendance  
17\. Leave  
18\. Payroll  
19\. Calendar  
20\. Booking  
21\. Notifications  
22\. AI/OCR  
23\. Documents  
24\. Social Media  
25\. Approval Workflow  
26\. Audit

This structure provides a scalable foundation for the complete ERP/POS platform while keeping POS, accounting, inventory, procurement, HR, payroll, banking, AI and mobile functionality connected through a common tenant-aware architecture.

# Tab 4

1. Exactly which users will be counted as **subscription seats**, and what will the system do when the seat limit is exceeded?  
2. When a subscription expires, will the tenant be **immediately suspended**, or will there be a **grace period**?  
3. Can tenants create **custom roles and permissions**, or will only predefined roles be available?  
4. Will **Purchase Orders** require approval? If yes, who will be responsible for approval?  
5. Will **Inventory Adjustments** and **Stock Transfers** require approval?  
6. Will **negative stock** be allowed, or will the transaction be blocked when there is insufficient stock?  
7. What will be the **batch stock issuing rule** — FIFO, FEFO, or manual batch selection?  
8. What will be the **stock valuation method** — FIFO, Weighted Average, or another method?  
9. At which stage will a **Goods Receipt** increase stock — when the receipt is confirmed/posted, or at another stage?  
10. Should **Partial Goods Receipt** be supported?  
11. Will **Stock Transfer** be direct, or will it follow a **Request → Approve → Dispatch → Receive** workflow?  
12. At which stage will an **Invoice** deduct inventory — when the invoice is issued/posted, when payment is received, or when the goods are delivered?  
13. Will a **Vendor Bill** affect inventory, or will only the **Goods Receipt** increase inventory while the Vendor Bill is used for accounting purposes?  
14. Will a **Draft Invoice** reserve stock?  
15. Will each **POS Register** be linked to a specific warehouse/location, with stock deducted from that warehouse?  
16. If the POS is offline, which operations will be allowed — only sales, or also customer creation, discounts, refunds, etc.?  
17. If multiple offline POS registers sell the same stock, how will **stock conflicts** be handled during synchronization?  
18. If available stock cannot be verified while offline, will the system still allow the sale?  
19. If an offline POS transaction fails to sync, will there be an **automatic retry**, or will manual resolution be required?  
20. Which exact **barcode scanner, receipt printer, and cash drawer hardware/models** need to be supported?  
21. Will **POS register opening/closing** and **end-of-day cash reconciliation** be required?  
22. Will the POS support **split payments**?  
23. Which POS operations should be supported: **refund, partial refund, return, and exchange**?  
24. Will returned products automatically be added back to inventory? How should **damaged returns** be handled?  
25. Will **manager approval/PIN** be required for POS discounts, voids, and refunds?  
26. Should invoices support **partial and multiple payments**?  
27. What should the final **invoice status workflow** be? For example: **Draft → Sent → Partially Paid → Paid → Overdue → Cancelled/Void**.  
28. What is the exact purpose/content of the **Invoice QR Code** — invoice verification, payment link, tax information, or something else?  
29. Should **Recurring Invoices** be automatically generated and sent, or should they be generated as drafts and sent only after approval?  
30. When a **Credit Note** is issued, should it only adjust the invoice balance, or should it also be able to trigger a **refund and inventory return**?  
31. Should each tenant have a **single base currency**, or is **multi-currency** support required at the transaction/invoice level?  
32. From **Phase 1**, should POS, Invoice, and Inventory transactions create **actual accounting journal entries**, or should they only create integration events/store records for the Accounting module?  
33. Should **POS Sales** and **normal Invoices** have separate numbering sequences?