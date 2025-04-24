# Make sure to install python-docx first:
# pip install python-docx

from docx import Document
from docx.shared import Pt

# Create a new Document
document = Document()

# Title
document.add_heading('Grocery Price Comparison App Documentation', 0)

# 1. Introduction
document.add_heading('1. Introduction', level=1)
document.add_paragraph(
    "This document details the project for automating login, OTP verification, product selection, and "
    "cart price extraction for the grocery price comparison app. It provides a comprehensive guide for "
    "interns working on the project."
)

# 2. Project Scope
document.add_heading('2. Project Scope', level=1)
document.add_paragraph(
    "The project is divided into two main parts:\n\n"
    "- Part A: User Login and Session Persistence\n"
    "- Part B: Cart Management and Price Calculation"
)

# 3. Tools and Technologies
document.add_heading('3. Tools and Technologies', level=1)
document.add_paragraph(
    "• Headless Browser Automation: Puppeteer (NodeJS) or chromedp (Go)\n"
    "• API Framework: Gin (Go) or Express (NodeJS)\n"
    "• Data Persistence: Redis (for caching) and MongoDB (for long-term storage)\n"
    "• Performance Optimizations: Block non-essential resources (ttf, CSS, images) and bypass CSP"
)

# 4. Architecture Overview
document.add_heading('4. Architecture Overview', level=1)
document.add_paragraph(
    "The system comprises three main layers:\n\n"
    "1. **API Layer:** Exposes endpoints for login, OTP submission, and product addition.\n"
    "2. **Automation Layer:** Uses headless browser automation (Puppeteer or chromedp) to interact with grocery sites.\n"
    "3. **Data Persistence:** Uses Redis for temporary session caching and MongoDB for persistent storage."
)

# 5. Detailed Workflow
document.add_heading('5. Detailed Workflow', level=1)

# Part A: Login & OTP Authentication
document.add_heading('Part A: Login & OTP Authentication', level=2)

document.add_heading('5.1 CSS Selector Identification', level=3)
document.add_paragraph(
    "Identify the CSS selectors for the login buttons, phone number input fields, OTP input fields, "
    "and submit buttons on Blinkit, Zepto, and Instamart. Document these selectors in a shared configuration file."
)

document.add_heading('5.2 Headless Browser Initialization', level=3)
document.add_paragraph(
    "Launch a headless browser instance (using Puppeteer or chromedp) and block non-essential requests "
    "for fonts, images, and CSS. Bypass the Content Security Policy (CSP) if necessary."
)

document.add_heading('5.3 Automating Login Flow', level=3)
document.add_paragraph(
    "1. Navigate to the grocery platform.\n"
    "2. Click the login button.\n"
    "3. Wait for the phone number input to become visible.\n"
    "4. Enter the user’s phone number and click the submit button to request an OTP."
)

document.add_heading('5.4 Session Persistence (Pre-OTP)', level=3)
document.add_paragraph(
    "If the OTP is sent, capture the browser's session details including cookies, DOM snapshot, and current URL. "
    "Store this information along with the phone number and API session details in Redis and MongoDB."
)

document.add_heading('5.5 OTP Submission and Finalization', level=3)
document.add_paragraph(
    "Once the user provides the OTP:\n"
    "1. Relaunch the headless browser and load the saved session (cookies, DOM, URL).\n"
    "2. Enter the OTP and click the submit button.\n"
    "3. Save the final session state (cookies, etc.) back to Redis and MongoDB."
)

document.add_heading('5.6 API Wrapping for Login', level=3)
document.add_paragraph(
    "Wrap the entire login and OTP process into the following APIs:\n\n"
    "- **POST /login/**: Takes the phone number, executes steps 5.1 to 5.4, and returns the OTP sending status.\n"
    "- **POST /submit-otp/**: Takes the OTP and session ID, executes steps 5.5 and 5.6, and returns the final session details."
)

# Part B: Cart Management and Price Calculation
document.add_heading('Part B: Cart Management and Price Calculation', level=2)

document.add_heading('5.7 Session Restoration & Product Page Loading', level=3)
document.add_paragraph(
    "Retrieve session details (from Redis or MongoDB) using the session ID and launch a headless browser "
    "to open each provided product URL."
)

document.add_heading('5.8 Product Variant Selection and Cart Addition', level=3)
document.add_paragraph(
    "For each product:\n\n"
    "1. Programmatically select the product variant that matches the provided weight.\n"
    "2. Add the selected variant to the cart."
)

document.add_heading('5.9 Price Extraction from Cart', level=3)
document.add_paragraph(
    "Navigate to the cart page in the headless browser, extract the price breakdown using DOM selectors, "
    "and prepare the data for the API response."
)

document.add_heading('5.10 API Wrapping for Adding Products', level=3)
document.add_paragraph(
    "Wrap the product addition and price extraction process into the following API:\n\n"
    "- **POST /add-products/**: Takes a session ID, an array of product URLs, and variant details, then returns "
    "the final cart details and price breakdown."
)

# 6. API Endpoints – Request/Response Specifications
document.add_heading('6. API Endpoints – Request/Response Specifications', level=1)

document.add_heading('6.1 POST /login/', level=2)
document.add_paragraph(
    "Request Body:\n"
    "```json\n"
    "{\n"
    '  "phone_number": "string"\n'
    "}\n"
    "```\n\n"
    "Response Body:\n"
    "```json\n"
    "{\n"
    '  "status": "OTP_SENT",\n'
    '  "message": "OTP has been sent to the provided phone number."\n'
    "}\n"
    "```"
)

document.add_heading('6.2 POST /submit-otp/', level=2)
document.add_paragraph(
    "Request Body:\n"
    "```json\n"
    "{\n"
    '  "otp": "string",\n'
    '  "session_id": "string"\n'
    "}\n"
    "```\n\n"
    "Response Body:\n"
    "```json\n"
    "{\n"
    '  "status": "SUCCESS",\n'
    '  "message": "User authenticated and session saved.",\n'
    '  "session_data": { /* cookies, DOM snapshot, URL */ }\n'
    "}\n"
    "```"
)

document.add_heading('6.3 POST /add-products/', level=2)
document.add_paragraph(
    "Request Body:\n"
    "```json\n"
    "{\n"
    '  "session_id": "string",\n'
    '  "product_urls": ["string", "string", "..."],\n'
    '  "variants": { "product_id": "desired_weight_or_variant_identifier" }\n'
    "}\n"
    "```\n\n"
    "Response Body:\n"
    "```json\n"
    "{\n"
    '  "cart_details": { /* cart item details, price breakdown, etc. */ },\n'
    '  "final_price": "number"\n'
    "}\n"
    "```"
)

# 7. Implementation Considerations
document.add_heading('7. Implementation Considerations', level=1)
document.add_paragraph(
    "• **Headless Browser Optimizations:** Block non-essential resources (ttf, CSS, images) and bypass CSP.\n"
    "• **Concurrency:** Use Go’s goroutines (with chromedp) or NodeJS’s asynchronous capabilities to handle multiple tabs concurrently.\n"
    "• **Error Handling:** Implement retry mechanisms for network issues and maintain session consistency between Redis and MongoDB."
)

# 8. Code Snippets (Pseudocode)
document.add_heading('8. Code Snippets (Pseudocode)', level=1)
document.add_paragraph(
    "Below are sample code snippets demonstrating the login flow and product addition using chromedp (Go):"
)
document.add_paragraph(
    "Login Flow (Go with chromedp and Gin):", style='List Bullet'
)
document.add_paragraph(
    "```go\n"
    "// Initialize headless chrome with chromedp\n"
    "ctx, cancel := chromedp.NewContext(context.Background())\n"
    "defer cancel()\n\n"
    "// Navigate to the grocery site and click login\n"
    "err := chromedp.Run(ctx,\n"
    "    chromedp.Navigate(\"https://www.blinkit.com\"),\n"
    "    chromedp.Click(\"css-selector-for-login-button\", chromedp.NodeVisible),\n"
    "    chromedp.WaitVisible(\"css-selector-for-phone-input\"),\n"
    "    chromedp.SendKeys(\"css-selector-for-phone-input\", userPhoneNumber),\n"
    "    chromedp.Click(\"css-selector-for-submit-button\"),\n"
    ")\n"
    "if err != nil {\n"
    "    // handle error\n"
    "}\n"
    "```\n"
)
document.add_paragraph(
    "Adding Products to Cart (Go with chromedp):", style='List Bullet'
)
document.add_paragraph(
    "```go\n"
    "// Restore session using cookies\n"
    "for _, cookie := range savedCookies {\n"
    "    network.SetCookie(cookie.Name, cookie.Value).\n"
    "        WithDomain(\"www.blinkit.com\").\n"
    "        Do(ctx)\n"
    "}\n\n"
    "// Navigate to product URL and select variant\n"
    "err = chromedp.Run(ctx,\n"
    "    chromedp.Navigate(productURL),\n"
    "    chromedp.WaitVisible(\"css-selector-for-variant\"),\n"
    "    chromedp.Click(\"css-selector-for-variant\"),\n"
    "    chromedp.Click(\"css-selector-for-add-to-cart-button\"),\n"
    ")\n"
    "if err != nil {\n"
    "    // handle error\n"
    "}\n\n"
    "// Extract pricing details from cart page\n"
    "var cartHTML string\n"
    "chromedp.Run(ctx,\n"
    "    chromedp.Navigate(\"https://www.blinkit.com/cart\"),\n"
    "    chromedp.OuterHTML(\"body\", &cartHTML),\n"
    ")\n"
    "```\n"
)

# 9. Future Improvements
document.add_heading('9. Future Improvements', level=1)
document.add_paragraph(
    "• **Scalability:** Optimize session handling with a pool of headless browser instances.\n"
    "• **Dynamic Selector Management:** Use configuration files for easy updates of CSS selectors.\n"
    "• **Error Monitoring:** Integrate logging and monitoring tools to track and resolve automation issues."
)

# 10. Diagrams
document.add_heading('10. Diagrams', level=1)
document.add_paragraph("Flow Diagram for the Login Process:")
document.add_paragraph(
    "```mermaid\n"
    "flowchart TD\n"
    "    A[User enters phone number in App] --> B[POST /login/ API Call]\n"
    "    B --> C[Launch Headless Browser]\n"
    "    C --> D[Navigate to Grocery Site]\n"
    "    D --> E[Click on Login Button]\n"
    "    E --> F[Wait for Phone Number Input]\n"
    "    F --> G[Enter Phone Number]\n"
    "    G --> H[Click Submit for OTP]\n"
    "    H --> I{OTP Sent?}\n"
    "    I -- Yes --> J[Capture Session Cookies, DOM, URL]\n"
    "    J --> K[Save Data to Redis & MongoDB]\n"
    "    I -- No --> L[Return Error Status to User]\n"
    "```\n"
)
document.add_paragraph("Sequence Diagram for Login & OTP Submission:")
document.add_paragraph(
    "```mermaid\n"
    "sequenceDiagram\n"
    "    participant U as User\n"
    "    participant API as Login API (/login/)\n"
    "    participant HB as Headless Browser Automation\n"
    "    participant DS as Data Storage (Redis/MongoDB)\n\n"
    "    U->>API: POST /login/ (phone number)\n"
    "    API->>HB: Launch browser and navigate to site\n"
    "    HB->>HB: Click login button & wait for phone input\n"
    "    HB->>HB: Enter phone number and submit OTP request\n"
    "    HB->>HB: Capture session cookies, DOM, and URL\n"
    "    HB->>DS: Save session data\n"
    "    API->>U: Return OTP_SENT status\n"
    "```\n"
)
document.add_paragraph("Sequence Diagram for Adding Products & Price Calculation:")
document.add_paragraph(
    "```mermaid\n"
    "sequenceDiagram\n"
    "    participant U as User\n"
    "    participant API as Add Products API (/add-products/)\n"
    "    participant DS as Data Storage (Redis/MongoDB)\n"
    "    participant HB as Headless Browser Automation\n\n"
    "    U->>API: POST /add-products/ (session_id, product_urls, variant info)\n"
    "    API->>DS: Retrieve session data using session_id\n"
    "    API->>HB: Launch browser with session cookies\n"
    "    HB->>HB: For each product URL:\n"
    "    HB->>HB: -- Navigate to product page\n"
    "    HB->>HB: -- Select product variant (based on weight)\n"
    "    HB->>HB: -- Add product to cart\n"
    "    HB->>HB: Navigate to Cart page\n"
    "    HB->>HB: Extract price details and cart summary\n"
    "    API->>U: Return cart details and final price breakdown\n"
    "```\n"
)

# Save the document
doc_filename = "Grocery_Price_Comparison_App_Documentation.docx"
document.save(doc_filename)
print(f"Document '{doc_filename}' has been generated successfully!")
