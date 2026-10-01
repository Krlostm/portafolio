"""Selected responsive derivatives; never write to original media folders."""
import argparse, hashlib, json, shutil, subprocess
from pathlib import Path
import cv2
from PIL import Image, ImageOps
SITE=Path(__file__).resolve().parents[1]
ROOT=SITE.parent
OUT=SITE/'public/media'
DATA=SITE/'src/data'
DATA.mkdir(parents=True,exist_ok=True)
(OUT/'images').mkdir(parents=True,exist_ok=True)
(OUT/'video').mkdir(parents=True,exist_ok=True)
parser=argparse.ArgumentParser()
mode=parser.add_mutually_exclusive_group()
mode.add_argument('--images-only',action='store_true')
mode.add_argument('--video-only',action='store_true')
args=parser.parse_args()
images=json.loads((DATA/'media-manifest.json').read_text(encoding='utf-8'))['images'] if (DATA/'media-manifest.json').exists() else {}
videos={}; selected={}
def remember(path):
    if str(path) not in selected:
        selected[str(path)]={'path':path.relative_to(ROOT).as_posix(),'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}
def save_image(id,im,source,alt,logo=False):
    im=ImageOps.exif_transpose(im).convert('RGBA' if logo else 'RGB')
    if logo:
        box=im.getchannel('A').getbbox()
        if box: im=im.crop(box)
    w,h=im.size; variants=[]
    for width in sorted(set(min(w,n) for n in ([480] if logo else [480,960,1600]))):
        resized=im.resize((width,round(h*width/w)),Image.Resampling.LANCZOS)
        filename=id+'-'+str(width)+'.webp'; target=OUT/'images'/filename
        resized.save(target,'WEBP',quality=93,method=6,lossless=logo)
        variants.append({'src':'media/images/'+filename,'width':width,'height':resized.height,'bytes':target.stat().st_size})
    chosen=min(variants,key=lambda a:abs(a['width']-960))
    images[id]={'source':source,'alt':alt,'width':w,'height':h,'src':chosen['src'],'variants':variants}
def photo(id,source,alt,logo=False):
    path=ROOT/source; remember(path)
    if args.video_only: return
    if id in images and all((SITE/'public'/v['src']).exists() for v in images[id]['variants']): return
    with Image.open(path) as im: save_image(id,im,source,alt,logo)
def frame(id,source,seconds,alt):
    path=ROOT/source; remember(path)
    if args.video_only: return
    if id in images and all((SITE/'public'/v['src']).exists() for v in images[id]['variants']): return
    cap=cv2.VideoCapture(str(path)); cap.set(cv2.CAP_PROP_POS_MSEC,seconds*1000)
    ok,arr=cap.read(); cap.release()
    if not ok: raise RuntimeError('Could not read frame: '+source)
    save_image(id,Image.fromarray(cv2.cvtColor(arr,cv2.COLOR_BGR2RGB)),source,alt)
photo('kike-static','flyers influencers/Cuarto-de-milla-Kike.jpg','Flyer de Kike: cuarto de milla, retrato y composición tipográfica')
photo('kike-quito','flyers influencers/FIESTAS-DE-QUITO.jpg','Flyer de Kike para las fiestas de Quito')
photo('kike-playa','flyers influencers/Stream_Playero_kike.png','Flyer de Kike para un stream playero')
for n in range(1,5): photo('top-0'+str(n),'top_media/Carruseles/1/CARRUSEL-SEMANA-4-DIA-1_0'+str(n)+'.jpg','Top Media: lámina '+str(n)+' de un carrusel de cuatro piezas')
photo('top-store','top_media/Estatico 1.jpg','Top Media: composición comercial en amarillo y negro')
photo('top-burger','top_media/ESTATICO-SEP 08.jpg','Top Media: publicación comercial con fotografía de producto')
photo('top-sign','top_media/Mesa de trabajo 1.jpg','Top Media: pieza gráfica de marca')
photo('oper-brochure','proyectos_varios/1/Galápagos Student Travel Brochure Mockup.png','Mockup del folleto de Galápagos para Opermundo')
photo('oper-folder','proyectos_varios/2/Mock up carpeta general.png','Carpeta corporativa de Opermundo aplicada en un mockup')
photo('oper-trifold','proyectos_varios/3/Vibrant Ecuador Travel Brochure Mockup.png','Mockup de tríptico turístico de Ecuador para Opermundo')
photo('oper-galapagos','opermundo/posts de venta/SUPER LOBITO (1).jpg','Publicación turística de Galápagos para Opermundo')
photo('oper-eje','opermundo/posts de venta/EJE CAFETERO.jpg','Campaña turística del Eje Cafetero para Opermundo')
photo('oper-anniversary','opermundo/posts de venta/16-años.jpg','Pieza de aniversario de Opermundo')
photo('oper-turquia','opermundo/posts de venta/TURQUÍA CON TROYA 2x1 10d - 9n 2027 (3).jpg','Pieza comercial de Turquía para Opermundo')
photo('thera-gateo','theraudio/gateo-110526_01.jpg','Theraudio: portada sobre desarrollo infantil')
photo('thera-r','theraudio/carrusel-R_01.jpg','Theraudio: portada editorial de contenido de marca')
photo('thera-juguete','theraudio/ChatGPT Image Sep 29, 2026, 12_22_47 AM.png','Theraudio: composición de contenido para redes sociales')
photo('thera-brand','theraudio/POST 1 - JULIO.png','Theraudio: publicación de marca')
for n in range(1,6): photo('ferre-0'+str(n),'ferretería/carruseles/errores al pintar/images/errores-al-pintar_0'+str(n)+'.jpg','Ferretería Reina del Cisne: lámina '+str(n)+' de cinco sobre errores al pintar')
photo('product-creatina','productos/CREATINA MUTANT - EDU NUTRITION.jpg','Composición publicitaria de Creatina Mutant para Edu Nutrition')
for id,filename,alt in [('photo-01','_MG_3284_1.jpg','Retrato femenino con iluminación lateral y mirada hacia arriba'),('photo-02','_MG_3378.jpg','Retrato masculino con chaqueta e iluminación azul'),('photo-03','_MG_3392.jpg','Retrato de cuerpo completo con vestuario claro y fondo oscuro'),('photo-04','_MG_3368_1.jpg','Retrato de dos personas con contraste de vestuario'),('photo-05','_MG_3406.jpg','Retrato experimental con trazos de luz')]: photo(id,'fotografía/'+filename,alt)
for id,filename,label in [('logo-artex','Artex BRecurso 1.png','Artex'),('logo-astral','ASTRAL BRecurso 4.png','Astral'),('logo-incognito','INCOGNITO b y naRecurso 4.png','Incógnito'),('logo-ferreteria','LOGO FERRETERIA REINA DEL CISNE  OFICIAL HD.png','Ferretería Reina del Cisne'),('logo-top','logo top media color.png','Top Media'),('logo-operecuador','operecuador blanco.png','Operecuador'),('logo-opermundo','opermundo blanco.png','Opermundo'),('logo-thera','Thera logo Sin Fondo.png','Theraudio')]: photo(id,'marcas_clientes/'+filename,'Logo de '+label,True)
mma='producción/VIDEO CORTO PRODUCCION MMA.mp4'; inmo='programacion/Web inmobiliaria.mp4'; app='programacion/Aplicacion enfocada en niños con tdh.mp4'
event='reels_edicion_videos/14 SEPTIEMBRE REEL.mp4'; tebis='reels_edicion_videos/03 SEPTIEMBRE.mp4'
language='reels_edicion_videos/VIERNES-28-AGOSTO-2026-TERAPIA DE LENGUAJE (1).mp4'; psych='reels_edicion_videos/VIERNES-PSICOLOGIA-SEPTIEMBRE (2).mp4'
for id,source,sec,alt in [('mma-poster',mma,9,'Fotograma de la producción audiovisual de MMA'),('mma-detail',mma,3,'Detalle cinematográfico del entrenamiento de MMA'),('mma-interview',mma,.5,'Entrevista en la producción de MMA'),('mma-action',mma,12,'Acción en el entrenamiento de MMA'),('top-event-poster',event,1,'Fotograma de un reel de Top Media'),('top-tebis-poster',tebis,8,'Fotograma de un reel de Top Media para Tebis'),('thera-language-poster',language,1,'Fotograma de un reel de Theraudio'),('thera-psych-poster',psych,1,'Fotograma de un reel de Theraudio'),('inmo-cover',inmo,.5,'Interfaz principal del proyecto web inmobiliario'),('inmo-filters',inmo,10,'Filtros de búsqueda del proyecto inmobiliario'),('inmo-property',inmo,32,'Ficha de propiedad en la interfaz inmobiliaria'),('inmo-location',inmo,45,'Ubicación y plano del proyecto inmobiliario'),('inmo-calculator',inmo,60,'Calculadora del proyecto inmobiliario'),('app-cover',app,36,'Interfaz del proyecto de aplicación infantil'),('app-routines',app,48,'Rutinas y tareas de la aplicación infantil'),('app-timer',app,82,'Temporizador de la aplicación infantil'),('app-games',app,120,'Juegos de la aplicación infantil'),('app-panel',app,171,'Panel de la aplicación infantil')]: frame(id,source,sec,alt)
specs=[('kike','flyers_motion/Motion 1-4 de milla_ kike.mp4','kike-static',720,0,20,480,0,20),('mma',mma,'mma-poster',1280,0,20.333,1280,3,12),('inmobiliaria',inmo,'inmo-cover',1280,0,65.85,960,5,18),('aplicacion',app,'app-cover',1600,0,176.65,960,32,18),('top-event',event,'top-event-poster',720,0,33.467,480,8,7),('top-tebis',tebis,'top-tebis-poster',720,0,33.8,480,3,7),('thera-language',language,'thera-language-poster',720,0,36.333,480,0,7),('thera-psych',psych,'thera-psych-poster',720,0,39.3,480,0,7)]
if (DATA/'additional-videos.json').exists():
    for item in json.loads((DATA/'additional-videos.json').read_text(encoding='utf-8')):
        frame(item['id']+'-poster',item['source'],item.get('posterSecond',3),item['alt'])
        specs.append((item['id'],item['source'],item['id']+'-poster',720,0,item['duration'],480,0,7))
for id,source,poster,fw,fs,fd,pw,ps,pd in specs:
    remember(ROOT/source); videos[id]={'source':source,'poster':poster,'full':'media/video/'+id+'-full.mp4','preview':'media/video/'+id+'-preview.mp4','duration':fd}
if (DATA/'additional-media.json').exists():
    for item in json.loads((DATA/'additional-media.json').read_text(encoding='utf-8')):
        photo(item['id'],item['source'],item['alt'])
def write_data():
    (DATA/'media-manifest.json').write_text(json.dumps({'images':images,'videos':videos},ensure_ascii=False,indent=2),encoding='utf-8')
    (DATA/'original-sources.json').write_text(json.dumps(list(selected.values()),ensure_ascii=False,indent=2),encoding='utf-8')
    files=[{'path':p.relative_to(SITE).as_posix(),'bytes':p.stat().st_size} for p in OUT.rglob('*') if p.is_file()]
    (DATA/'media-report.json').write_text(json.dumps({'originalFiles':len(selected),'imageAssets':len(images),'derivativeFiles':len(files),'totalBytes':sum(f['bytes'] for f in files),'files':files},indent=2),encoding='utf-8')
write_data(); print('Responsive images and posters ready',flush=True)
if not args.images_only:
    ffmpeg=SITE/'.tools/ffmpeg/package/ffmpeg.exe'; staged=SITE/'.tools/source-input.mp4'
    if not ffmpeg.exists(): raise RuntimeError('FFmpeg missing; see README')
    try:
        for id,source,poster,fw,fs,fd,pw,ps,pd in specs:
            shutil.copyfile(ROOT/source,staged)
            for kind,width,start,duration in [('preview',pw,ps,pd),('full',fw,fs,fd)]:
                target=OUT/'video'/(id+'-'+kind+'.mp4')
                if target.exists() and target.stat().st_size>0: continue
                command=[str(ffmpeg),'-hide_banner','-loglevel','error','-nostdin','-y','-ss',str(start),'-i',str(staged),'-t',str(duration),'-vf','scale='+str(width)+':-2,fps=30','-c:v','libx264','-preset','veryfast','-crf','26' if kind=='preview' else '23','-pix_fmt','yuv420p','-threads','4','-movflags','+faststart']
                command+=['-an'] if kind=='preview' else ['-c:a','aac','-b:a','128k']; command.append(str(target))
                subprocess.run(command,check=True); print(id+' '+kind+' ready: '+str(round(target.stat().st_size/1048576,2))+' MB',flush=True)
    finally:
        if staged.exists(): staged.unlink()
    write_data(); print('All selected derivatives ready',flush=True)
