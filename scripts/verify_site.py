"""Static checks; this does not render a browser."""
import argparse, datetime, hashlib, json, re, struct, urllib.request
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
SITE=Path(__file__).resolve().parents[1];ROOT=SITE.parent;DIST=SITE/'dist'
class Page(HTMLParser):
 def __init__(self,text):
  super().__init__();self.refs=[];self.ids=[];self.images=[];self.videos=[];self.h1=0;self.meta=set();self.feed(text)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id'in a:self.ids.append(a['id'])
  if tag=='h1':self.h1+=1
  if tag=='meta':self.meta.add(a.get('name',a.get('property','')))
  if tag=='img':self.images.append(a)
  if tag=='video':self.videos.append(a)
  for key in ['src','href','poster','data-src','data-video-src']:
   if a.get(key):self.refs.append(a[key])
  if a.get('srcset'):self.refs.extend(s.strip().split()[0] for s in a['srcset'].split(','))
parser=argparse.ArgumentParser();parser.add_argument('--base',default='/');parser.add_argument('--originals',action='store_true');parser.add_argument('--http');args=parser.parse_args()
base='/'+args.base.strip('/')+'/' if args.base.strip('/') else '/'
errors=[];refs=0;pages={p:Page(p.read_text(encoding='utf-8')) for p in DIST.rglob('*.html')}
# Only the main portfolio and the technical 404 page are generated.
if {p.relative_to(DIST).as_posix() for p in pages}!={'index.html','404.html'}:errors.append('Expected only the main page and 404')
for path,page in pages.items():
 if page.h1!=1:errors.append(str(path)+': expected one h1')
 if len(set(page.ids))!=len(page.ids):errors.append(str(path)+': duplicate IDs')
 if not {'description','og:title','og:description'}.issubset(page.meta):errors.append(str(path)+': missing metadata')
 for im in page.images:
  if not all(k in im for k in ['alt','width','height','srcset']):errors.append(str(path)+': incomplete responsive image')
 for v in page.videos:
  if v.get('preload')!='none' or v.get('src'):errors.append(str(path)+': video must load under intent or visibility')
 for ref in page.refs:
  split=urlsplit(ref)
  if split.scheme or split.netloc:continue
  raw=unquote(split.path)
  if raw.startswith('/'):
   if not raw.startswith(base):errors.append('Wrong base: '+ref);continue
   target=DIST/raw[len(base):]
  else:target=path.parent/raw if raw else path
  if target.is_dir():target=target/'index.html'
  if not target.exists():errors.append('Missing reference: '+ref)
  elif split.fragment and target.suffix=='.html':
   target_page=pages.get(target)
   if target_page and split.fragment not in target_page.ids:errors.append('Missing anchor: '+ref)
  refs+=1
for css in DIST.rglob('*.css'):
 for ref in re.findall(r'url\(([^)]+)\)',css.read_text(encoding='utf-8')):
  ref=ref.strip('\'"')
  if ref.startswith('data:') or '://'in ref:continue
  target=DIST/ref[len(base):] if ref.startswith(base) else css.parent/ref
  if not target.exists():errors.append('Missing CSS asset: '+ref)
manifest=json.loads((SITE/'src/data/media-manifest.json').read_text(encoding='utf-8'))
for media in manifest['images'].values():
 for v in media['variants']:
  if not (SITE/'public'/v['src']).exists():errors.append('Missing image: '+v['src'])
for media in manifest['videos'].values():
 for kind in ['full','preview']:
  if not media.get(kind):continue
  path=SITE/'public'/media[kind]
  if not path.exists():errors.append('Missing video: '+str(path));continue
  atoms=[]
  with path.open('rb') as f:
   pos=0
   while pos<path.stat().st_size:
    header=f.read(8)
    if len(header)<8:break
    size,name=struct.unpack('>I4s',header)
    if size==1:size=struct.unpack('>Q',f.read(8))[0]
    if not size:break
    atoms.append(name.decode('ascii',errors='replace'));pos+=size;f.seek(pos)
  if 'moov'not in atoms or 'mdat'not in atoms or atoms.index('moov')>atoms.index('mdat'):errors.append('Missing fast start: '+str(path))
original_count=0
if args.originals:
 baseline=[]
 for part in (SITE/'.qa').glob('baseline-*.json'):baseline.extend(json.loads(part.read_text(encoding='utf-8')))
 if not baseline:errors.append('Original baseline missing')
 for entry in baseline:
  path=ROOT/entry['Path'];original_count+=1
  if not path.exists():errors.append('Original missing: '+str(path));continue
  digest=hashlib.sha256()
  with path.open('rb') as f:
   for chunk in iter(lambda:f.read(1024*1024),b''):digest.update(chunk)
  if digest.hexdigest().upper()!=entry['SHA256'] or path.stat().st_size!=entry['Bytes']:errors.append('Original changed: '+str(path))
  expected=datetime.datetime.fromisoformat(entry['Modified'].replace('Z','+00:00')).timestamp()
  if abs(path.stat().st_mtime-expected)>.00001:errors.append('Original modification date changed: '+str(path))
http_count=0
if args.http:
 for path in pages:
  route=path.relative_to(DIST).as_posix()
  if route=='404.html':continue
  route=route.removesuffix('index.html')
  try:
   with urllib.request.urlopen(args.http.rstrip('/')+'/'+route,timeout=10) as response:
    if response.status!=200:errors.append('HTTP failed: '+route)
    http_count+=1
  except Exception as exc:errors.append('HTTP failed: '+route+' '+str(exc))
report={'pages':len(pages),'localReferences':refs,'originalsVerified':original_count,'httpRoutes':http_count,'base':base,'errors':errors,'browserVisualReview':'pending: browser saved permission blocked access'}
(SITE/'.qa').mkdir(exist_ok=True)
(SITE/'.qa'/('verification-'+('base' if base!='/' else 'root')+'.json')).write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
if errors:raise SystemExit(1)
