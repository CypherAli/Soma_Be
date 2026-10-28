// Read-only readiness check. Never print credentials or provider response bodies.
require('dotenv').config({path:'.env.sepay.local',quiet:true});
require('dotenv').config({quiet:true});
async function main(){
 const env=process.env;
 if(env.SEPAY_PG_ENV!=='production'||env.SEPAY_PG_ENABLED!=='true')throw Error('Chưa bật Production. Đặt SEPAY_PG_ENV=production và SEPAY_PG_ENABLED=true sau khi có khóa thật.');
 const merchant=env.SEPAY_PG_MERCHANT_ID?.trim(),secret=env.SEPAY_PG_SECRET_KEY?.trim();
 if(!merchant||merchant.startsWith('SP-TEST-')||!secret)throw Error('Cần Merchant ID và Secret Key Production; không dùng khóa Sandbox.');
 const base=new URL(env.SEPAY_PG_PUBLIC_BASE_URL||'');
 if(base.protocol!=='https:'||base.username||base.password||base.pathname!=='/')throw Error('SEPAY_PG_PUBLIC_BASE_URL phải là gốc HTTPS công khai.');
 const response=await fetch('https://pgapi.sepay.vn/v1/order?per_page=1',{headers:{Authorization:'Basic '+Buffer.from(merchant+':'+secret).toString('base64')},redirect:'error',signal:AbortSignal.timeout(10000)});
 if(response.status!==200)throw Error('SePay Production chưa chấp nhận khóa (HTTP '+response.status+'). Kiểm tra lại bộ khóa, không gửi khóa vào chat.');
 console.log('PASS: khóa Production được SePay xác thực. Không tạo đơn hoặc chuyển tiền.');
 console.log('IPN Production cần lưu: '+new URL('/api/membership/sepay/ipn',base).href);
 if(base.hostname.endsWith('.trycloudflare.com'))console.log('URL hiện là tunnel tạm: giữ máy/tunnel chạy khi thử; dùng domain HTTPS cố định khi phục vụ người dùng.');
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Kiểm tra không thành công');process.exitCode=1});
