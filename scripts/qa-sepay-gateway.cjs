require('reflect-metadata');
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const { randomUUID, createHmac } = require('node:crypto');
const { ConfigService } = require('@nestjs/config');
const { PrismaService } = require('../dist/src/prisma/prisma.service');
const { MembershipService } = require('../dist/src/membership/membership.service');
const { activePlan } = require('../dist/src/membership/policy');
if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(process.env.DATABASE_URL).hostname)) throw Error('Local database only');
const prisma = new PrismaService(), originalFetch = global.fetch;
const secret = randomUUID(), config = new ConfigService({ SEPAY_PG_ENABLED:'true', SEPAY_PG_ENV:'sandbox', SEPAY_PG_MERCHANT_ID:'SP-TEST-QA', SEPAY_PG_SECRET_KEY:secret, SEPAY_PG_PUBLIC_BASE_URL:'https://qa.example.invalid' });
const service = new MembershipService(prisma, config);
let userId;
(async () => {
  await prisma.$connect();
  const user = await prisma.user.create({data:{name:'Gateway QA',email:`qa-${randomUUID()}@example.invalid`}}); userId = user.id;
  try {
    let initializations=0;
    global.fetch=async (url,options) => {
      const u=new URL(url);
      if(u.pathname.startsWith('/v1/order/detail/'))return new Response(JSON.stringify({data:{id:'qa-provider-order',order_invoice_number:order?.code,order_status:'AUTHENTICATION_NOT_NEEDED',order_amount:'25000.00',order_currency:'VND',transactions:[]}}),{status:200});
      if(u.pathname==='/v1/checkout/init'){
        initializations++;
        const target=new URL('/v1/checkout',u);for(const [k,v]of options.body)target.searchParams.set(k,v);
        return new Response(null,{status:302,headers:{location:target.href}});
      }
      return new Response('<img class="qrcode" src="https://pay-sandbox.sepay.vn/test-qr.png"><ul><li>Sandbox Bank</li><li><span class="account-number">QA000</span></li><li><span class="remark">PAYQA000</span></li></ul>',{status:200});
    };
    const orders = await Promise.all(Array.from({length:8},()=>service.checkout(userId)));
    assert.equal(new Set(orders.map(o=>o.id)).size,1);
    assert.equal(initializations,1,'Concurrent tabs initialize only one persisted provider session');
    const order = orders[0], fields = order.checkout.fields;
    assert.equal(order.transferContent,'PAYQA000');assert.equal(order.qrUrl,'https://pay-sandbox.sepay.vn/test-qr.png');
    assert.equal((await service.order(userId,order.id)).checkoutUrl,order.checkoutUrl);
    await assert.rejects(()=>service.simulate('another-user',order.id),e=>e.getStatus()===404);
    assert.equal(order.amount,25000);assert.equal(fields.order_amount,25000);assert.equal(fields.order_description,'PREMIUM');assert.equal(fields.customer_id,userId);
    assert.equal(order.sandbox,true);assert.equal(order.checkout.url,'https://pay-sandbox.sepay.vn/v1/checkout/init');
    assert.ok(!JSON.stringify(order).includes(secret));
    const signed = Object.entries(fields).filter(([key])=>key!=='signature').map(([key,value])=>`${key}=${value}`).join(',');
    assert.equal(fields.signature,createHmac('sha256',secret).update(signed).digest('base64'));
    const event = {notification_type:'ORDER_PAID',order:{order_invoice_number:order.code,order_status:'CAPTURED'}};
    await assert.rejects(()=>service.ipn('bad-secret',event),e=>e.getStatus()===401);
    let providerOrder = {id:'qa-provider-order',order_invoice_number:order.code,order_status:'CAPTURED',order_amount:'25000.00',order_currency:'VND',transactions:[{id:'qa-transaction',payment_method:'BANK_TRANSFER',transaction_type:'PAYMENT',transaction_status:'APPROVED',transaction_amount:'25000',transaction_currency:'VND'}]};
    global.fetch = async (url,options) => {
      assert.equal(new URL(url).host,'pgapi-sandbox.sepay.vn');
      assert.equal(options.headers.Authorization,'Basic '+Buffer.from('SP-TEST-QA:'+secret).toString('base64'));
      return new Response(JSON.stringify({data:providerOrder}),{status:200});
    };
    const valid = structuredClone(providerOrder);
    for (const patch of [{order_amount:'10000'},{order_currency:'USD'},{order_status:'CANCELLED'},{order_invoice_number:'other'},{transactions:[{...valid.transactions[0],transaction_amount:'10000'}]}]) {
      providerOrder = {...valid,...patch};
      assert.equal((await service.ipn(undefined,event)).processed,false);
      assert.equal((await service.order(userId,order.id)).status,'pending');
    }
    global.fetch = async () => { throw Error('network failure'); };
    await assert.rejects(()=>service.ipn(undefined,event),e=>e.getStatus()===503);
    global.fetch = async () => new Response(JSON.stringify({data:{...valid,transactions:[]}}),{status:200});
    await Promise.all(Array.from({length:10},()=>service.ipn(undefined,event)));
    const paid = await prisma.user.findUniqueOrThrow({where:{id:userId}});
    assert.equal(paid.plan,'free');assert.equal(paid.premiumUntil,null);assert.ok(paid.sandboxPremiumUntil > new Date());
    assert.equal((await service.status(userId)).limit,30);
    assert.equal(activePlan(paid), 'free');assert.equal(activePlan(paid,new Date(),true),'pro');
    const expiry = paid.sandboxPremiumUntil.toISOString();await service.ipn(secret,event);
    assert.equal((await prisma.user.findUniqueOrThrow({where:{id:userId}})).sandboxPremiumUntil.toISOString(),expiry);
    config.set('SEPAY_PG_ENV','production');config.set('SEPAY_PG_MERCHANT_ID','SP-PROD-QA');
    assert.equal((await service.status(userId)).plan,'free');
    assert.equal((await service.ipn(undefined,event)).processed,false);
    const fallback=await service.checkout(userId);
    assert.equal(fallback.qrUrl,null,'Unavailable embedded QR must not show a static or test QR in Production');
    assert.equal(fallback.checkout.url,'https://pay.sepay.vn/v1/checkout/init','The signed official checkout remains available');
    await assert.rejects(()=>service.simulate(userId,fallback.id),e=>e.getStatus()===400,'Live orders cannot be simulated');
    console.log('PASS Gateway: server signature, fixed 25k price, account ownership, concurrent pending orders, secret redaction, spoofed IPN denial, authenticated provider verification, wrong amount/currency/invoice/state denial, fail-closed network errors, concurrent idempotency, Sandbox/Production isolation.');
  } finally { global.fetch=originalFetch; if(userId) await prisma.user.delete({where:{id:userId}});await prisma.$disconnect(); }
})().catch(error=>{console.error(error.message);process.exitCode=1});
