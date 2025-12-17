import { type NextRequest, NextResponse } from "next/server"

// Mock KNET payment gateway for testing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tranid = searchParams.get("tranid")
  const amt = searchParams.get("amt")
  const responseURL = searchParams.get("responseURL")
  const udf1 = searchParams.get("udf1")

  // Simulate payment processing page
  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>KNET Payment Gateway - Mock</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: system-ui, -apple-system, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 16px;
          padding: 40px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          text-align: center;
        }
        .logo {
          width: 120px;
          margin: 0 auto 30px;
        }
        h1 {
          color: #1a202c;
          font-size: 24px;
          margin-bottom: 10px;
        }
        .amount {
          font-size: 48px;
          font-weight: bold;
          color: #667eea;
          margin: 20px 0;
        }
        .info {
          background: #f7fafc;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: right;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          font-size: 14px;
        }
        .label { color: #718096; }
        .value { color: #2d3748; font-weight: 600; }
        .buttons {
          display: flex;
          gap: 12px;
          margin-top: 30px;
        }
        button {
          flex: 1;
          padding: 16px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        .btn-success {
          background: #48bb78;
          color: white;
        }
        .btn-success:hover {
          background: #38a169;
          transform: translateY(-2px);
        }
        .btn-cancel {
          background: #f56565;
          color: white;
        }
        .btn-cancel:hover {
          background: #e53e3e;
          transform: translateY(-2px);
        }
        .notice {
          margin-top: 20px;
          padding: 12px;
          background: #fef5e7;
          border-radius: 8px;
          color: #8b6914;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <svg class="logo" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="80" fill="#1a237e" rx="8"/>
          <text x="100" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white" text-anchor="middle">KNET</text>
        </svg>
        
        <h1>بوابة الدفع الإلكتروني</h1>
        <p style="color: #718096; margin-top: 8px;">K-Net Payment Gateway</p>
        
        <div class="amount">${(Number.parseInt(amt || "0") / 1000).toFixed(3)} د.ك</div>
        
        <div class="info">
          <div class="info-row">
            <span class="value">${tranid}</span>
            <span class="label">رقم المعاملة:</span>
          </div>
          <div class="info-row">
            <span class="value">Zain Kuwait</span>
            <span class="label">التاجر:</span>
          </div>
          <div class="info-row">
            <span class="value">إعادة شحن رصيد</span>
            <span class="label">نوع الخدمة:</span>
          </div>
        </div>

        <div class="notice">
          🧪 هذه بوابة دفع تجريبية للاختبار فقط
          <br>
          Mock Payment Gateway for Testing
        </div>
        
        <div class="buttons">
          <button class="btn-success" onclick="processPayment(true)">
            إتمام الدفع ✓
          </button>
          <button class="btn-cancel" onclick="processPayment(false)">
            إلغاء ✕
          </button>
        </div>
      </div>

      <script>
        function processPayment(success) {
          const responseURL = "${responseURL}";
          const tranid = "${tranid}";
          const result = success ? 'CAPTURED' : 'CANCELLED';
          const paymentId = 'PMT' + Date.now();
          
          const callbackUrl = responseURL + 
            '?tranid=' + tranid +
            '&result=' + result +
            '&paymentid=' + paymentId +
            '&trackid=' + tranid;
          
          window.location.href = callbackUrl;
        }
      </script>
    </body>
    </html>
  `

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  })
}
