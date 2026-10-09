import express from 'express';
import helmet from 'helmet';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import sharp from 'sharp';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.env.DATA_DIR || '/data');
const PASSWORD = process.env.UPLOAD_PASSWORD || '';
const ORIGIN = (process.env.CORS_ORIGIN || '').replace(/\/$/,'');
const MAX_BYTES = 15 * 1024 * 1024;
if (PASSWORD.length < 16 || !ORIGIN.startsWith('https://')) {
  console.error('Set UPLOAD_PASSWORD (min 16 chars) and CORS_ORIGIN (https://...) before starting');
  process.exit(1);
}
const defaultAlbums = new Map([
  ['ahrtal-2026','Ahrtal 2026'],
  ['selectiedag-2026','Selectiedag 2026'],
  ['ardennen-2027','Ardennen 2027'],
  ['overig','Overige herinneringen'],
]);
const ALBUM_FILE=path.join(DATA_DIR,'albums.json');
let albums=new Map(defaultAlbums);
async function saveAlbums(){const temp=ALBUM_FILE+'.tmp-'+randomUUID();await fs.writeFile(temp,JSON.stringify([...albums]),{mode:0o600});await fs.rename(temp,ALBUM_FILE)}
async function loadAlbums(){try{const stored=JSON.parse(await fs.readFile(ALBUM_FILE,'utf8'));if(Array.isArray(stored))for(const pair of stored){if(Array.isArray(pair)&&/^[a-z0-9-]{2,60}$/.test(pair[0])&&typeof pair[1]==='string'&&pair[1].length<=80)albums.set(pair[0],pair[1])}}catch(e){if(e.code!=='ENOENT')console.error('Album index could not be loaded',e)}}
const app = express();
app.disable('x-powered-by');
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
app.use((req,res,next)=>{
  res.set('Vary','Origin');
  if(req.headers.origin===ORIGIN){
    res.set('Access-Control-Allow-Origin',ORIGIN);
    res.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers','Content-Type, X-Upload-Password');
  }
  if(req.method==='OPTIONS')return res.sendStatus(req.headers.origin===ORIGIN?204:403);
  next();
});
app.use('/api/',rateLimit({windowMs:15*60*1000,limit:100,standardHeaders:'draft-7',legacyHeaders:false}));
const uploadLimiter=rateLimit({windowMs:15*60*1000,limit:12,standardHeaders:'draft-7',legacyHeaders:false});
const upload = multer({storage:multer.memoryStorage(),limits:{fileSize:MAX_BYTES,files:1,fields:2,parts:3}});
function authorized(value){
  if(typeof value!=='string'||Buffer.byteLength(value)>512)return false;
  const a=Buffer.from(value),b=Buffer.from(PASSWORD);
  return a.length===b.length && timingSafeEqual(a,b);
}
function requirePassword(req,res,next){
  if(!authorized(req.get('X-Upload-Password')))return res.status(401).json({error:'Onjuist uploadwachtwoord'});
  next();
}
app.get('/health',(req,res)=>res.json({ok:true}));
app.get('/api/albums',(req,res)=>res.json([...albums].map(([id,title])=>({id,title}))));
app.post('/api/albums',uploadLimiter,requirePassword,express.json({limit:'4kb'}),async(req,res,next)=>{try{const title=String(req.body?.title||'').trim().replace(/\\s+/g,' ');if(title.length<3||title.length>80)return res.status(400).json({error:'Gebruik een albumnaam van 3 tot 80 tekens'});const slug=title.toLowerCase().normalize('NFKD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);if(slug.length<2)return res.status(400).json({error:'Ongeldige albumnaam'});if(albums.has(slug))return res.status(409).json({error:'Dit album bestaat al'});if(albums.size>=150)return res.status(400).json({error:'Maximum aantal albums bereikt'});albums.set(slug,title);try{await saveAlbums();await fs.mkdir(path.join(DATA_DIR,slug),{recursive:true})}catch(e){albums.delete(slug);throw e}res.status(201).json({id:slug,title})}catch(e){next(e)}});
app.get('/api/photos',async(req,res,next)=>{
  try{
    const photos=[];
    for(const [album,title] of albums){
      const dir=path.join(DATA_DIR,album);
      let items;try{items=await fs.readdir(dir,{withFileTypes:true})}catch(e){if(e.code==='ENOENT')continue;throw e}
      for(const item of items){
        if(!item.isFile()||!/^\d{13}-[0-9a-f-]{36}\.webp$/.test(item.name))continue;
        const stat=await fs.stat(path.join(dir,item.name));
        photos.push({album,title,url:'/images/'+album+'/'+item.name,createdAt:stat.mtime.toISOString()});
      }
    }
    photos.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    res.set('Cache-Control','no-store').json(photos);
  }catch(e){next(e)}
});
app.use('/images',express.static(DATA_DIR,{dotfiles:'deny',fallthrough:false,maxAge:'7d',immutable:true,setHeaders(res){res.set('X-Content-Type-Options','nosniff')}}));
app.post('/api/photos',uploadLimiter,requirePassword,upload.single('photo'),async(req,res,next)=>{
  try{
    if(!req.file)return res.status(400).json({error:'Kies een foto'});
    if(!albums.has(req.body.album))return res.status(400).json({error:'Ongeldig album'});
    // Decode+re-encode: ensures the content is an image and strips metadata/EXIF.
    const img=sharp(req.file.buffer,{limitInputPixels:40_000_000,failOn:'error'});
    const metadata=await img.metadata();
    if(!['jpeg','png','webp','heif','avif','gif','tiff'].includes(metadata.format))return res.status(415).json({error:'Niet ondersteund fotoformaat'});
    const output=await img.rotate().resize({width:2400,height:2400,fit:'inside',withoutEnlargement:true}).webp({quality:83,effort:4}).toBuffer();
    const album=req.body.album;
    const name=Date.now()+'-'+randomUUID()+'.webp';
    const dir=path.join(DATA_DIR,album);
    await fs.mkdir(dir,{recursive:true,mode:0o750});
    await fs.writeFile(path.join(dir,name),output,{flag:'wx',mode:0o640});
    res.status(201).json({ok:true,url:'/images/'+album+'/'+name});
  }catch(e){
    if(e instanceof multer.MulterError)return res.status(413).json({error:'Foto te groot (maximaal 15 MB)'});
    if(/unsupported|Input file contains unsupported image format|heif/.test(e.message))return res.status(415).json({error:'Fotoformaat kan niet verwerkt worden; probeer JPG of PNG'});
    next(e);
  }
});
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:'Er ging iets mis bij de fotoverwerking'})});
await fs.mkdir(DATA_DIR,{recursive:true});
await loadAlbums();
app.listen(PORT,'0.0.0.0',()=>console.log('BPC photo service listening on '+PORT));
