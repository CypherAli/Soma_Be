/* Exercises the real Prisma JSON audit + update path using rows that are ALWAYS rolled back. */
require('dotenv/config');
const {randomUUID}=require('node:crypto');
const {PrismaClient}=require('@prisma/client');
const {PrismaPg}=require('@prisma/adapter-pg');
const {AuditService}=require('../dist/src/admin/audit.service');
const {revisionOf}=require('../dist/src/admin/revisions');
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});
async function main(){
  const id='qa-rollback-'+randomUUID();
  try{
    await prisma.$transaction(async tx=>{
      const source=await tx.medicalSource.create({data:{id,title:'Disposable rollback probe',publisher:'QA',url:'https://example.invalid',status:'official-link'}});
      const audit=new AuditService({$transaction:run=>run(tx)});
      const actor={id:'qa-rollback',email:'rollback@example.invalid',name:'QA',role:'admin'};
      await audit.update(actor,'medical_source',id,{title:'Changed inside transaction',expectedRevision:revisionOf('medical_source',source)});
      const log=await tx.auditLog.findFirst({where:{entityId:id}});
      if(!log || log.before.title!==source.title || log.after.title!=='Changed inside transaction')throw new Error('Audit snapshot mismatch');
      throw new Error('EXPECTED_QA_ROLLBACK');
    },{isolationLevel:'Serializable',timeout:15000});
  }catch(error){if(error.message!=='EXPECTED_QA_ROLLBACK')throw error;}
  const [sources,logs]=await Promise.all([prisma.medicalSource.count({where:{id}}),prisma.auditLog.count({where:{entityId:id}})]);
  if(sources||logs)throw new Error('Probe rows persisted unexpectedly');
  console.log('PASS: real DB update and audit serialize correctly; rollback leaves zero source/audit rows.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
