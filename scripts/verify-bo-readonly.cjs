require('dotenv/config');
const {PrismaClient}=require('@prisma/client');
const {PrismaPg}=require('@prisma/adapter-pg');
const {AdminService}=require('../dist/src/admin/admin.service');
const {AnatomyAdminService}=require('../dist/src/admin/anatomy.service');
const {AuditService}=require('../dist/src/admin/audit.service');
const {ContentService}=require('../dist/src/content/content.service');
const {MedicalKnowledgeService}=require('../dist/src/medical-knowledge/medical-knowledge.service');
const prisma=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})}),config={get:()=>undefined};
async function main(){
 const audit=new AuditService(prisma),admin=new AdminService(prisma,audit),anatomy=new AnatomyAdminService(prisma,audit);
 const sample=await prisma.pathology.findFirst({select:{id:true}});
 const [detail,sources,species,structures,quizzes,models,knowledge]=await Promise.all([
   sample?admin.pathology(sample.id):null,admin.sources(),anatomy.species(),anatomy.structures({}),anatomy.quizzes({}),
   new ContentService(prisma,config).list('models','giai phau tim',1,'scenes','title'),
   new MedicalKnowledgeService(prisma,config).search('giải phẫu tim',3),
 ]);
 for(const row of [...sources,...species,...structures.items,...quizzes.items,...quizzes.items.flatMap(q=>q.options),...(detail?.content??[])])if(!/^[a-f0-9]{64}$/.test(row.revision))throw new Error('Missing form revision');
 if(detail&&!/^[a-f0-9]{64}$/.test(detail.reviewRevision))throw new Error('Missing review revision');
 console.log(JSON.stringify({readonly:true,formRevisions:'ok',reviewRevision:'ok',sourceCount:sources.length,heartModelMatches:models.total,knowledgeResults:knowledge.count}));
 const checks=await Promise.all(['http://localhost:3001','http://localhost:4000/api/health','http://localhost:4000/api/content/published','http://localhost:4000/api/admin/sources'].map(async url=>({url,status:(await fetch(url)).status})));
 console.log(JSON.stringify(checks));
 if(checks.some((check,index)=>check.status!==(index===3?401:200)))throw new Error('HTTP smoke check failed');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;}).finally(()=>prisma.$disconnect());
