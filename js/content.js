/* The Mile barbershop — every fact on the site lives here.
   Sources: Google Business Profile (scraped 2026-09-08), the shop's printed business card (photo on the GBP),
   and the 19 Google reviews (5.0 average). Edit here, never in the HTML. */
window.MILE = {
  assetVersion: '6f8f965c', // bump (or rerun tools/bump-assets.sh) whenever files in assets/img change — they are served with an immutable 1-year cache
  name: 'The Mile barbershop',
  short: 'The Mile',
  city: 'Huntington Park',
  address: { street: '6350 Miles Ave', city: 'Huntington Park', state: 'CA', zip: '90255' },
  geo: { lat: 33.9820787, lng: -118.2189514 },
  phone: { display: '(213) 590-8113', tel: '+12135908113' },
  instagram: { handle: 'dennis.lopez.5245961', url: 'https://www.instagram.com/dennis.lopez.5245961/' },
  maps: {
    google: 'https://www.google.com/maps/place/The+Mile+barbershop/@33.9820787,-118.2189514,17z/data=!4m6!3m5!1s0x80c2c98ea5a5dfd3:0x45ac81c04575e46f!8m2!3d33.9820787!4d-118.2189514!16s%2Fg%2F11wjhxfrm4',
    apple: 'https://maps.apple.com/?q=The+Mile+barbershop&address=6350+Miles+Ave,+Huntington+Park,+CA+90255&ll=33.9820787,-118.2189514',
    directions: 'https://www.google.com/maps/dir/?api=1&destination=6350+Miles+Ave,+Huntington+Park,+CA+90255&destination_place_id=&travelmode=driving'
  },
  rating: { value: 5.0, count: 19 },
  /* Hours as printed on the shop's business card ("HORARIO"). Google's listing shows Tue 10 AM–8 PM,
     i.e. a 30-minute difference on the opening time — confirm with the owner. 24h clock, minutes. */
  hours: [
    { d: 0, en: 'Sunday',    es: 'Domingo',   open: null,          close: null },
    { d: 1, en: 'Monday',    es: 'Lunes',     open: [9, 30],       close: [20, 0] },
    { d: 2, en: 'Tuesday',   es: 'Martes',    open: [9, 30],       close: [20, 0] },
    { d: 3, en: 'Wednesday', es: 'Miércoles', open: [9, 30],       close: [20, 0] },
    { d: 4, en: 'Thursday',  es: 'Jueves',    open: [9, 30],       close: [20, 0] },
    { d: 5, en: 'Friday',    es: 'Viernes',   open: [9, 30],       close: [20, 0] },
    { d: 6, en: 'Saturday',  es: 'Sábado',    open: [8, 30],       close: [19, 0] }
  ],
  timezone: 'America/Los_Angeles',
  services: [
    { id: 'cut',   en: 'Haircut',         es: 'Corte de cabello',  den: 'Fades, tapers, crops, comb-overs — every style you see in the feed.', des: 'Fades, tapers, crops, peinados hacia atrás — todos los estilos que ves en la galería.' },
    { id: 'fade',  en: 'Fade / taper',    es: 'Fade / taper',      den: 'Skin fades, low & mid tapers, blended to zero.', des: 'Skin fades, tapers bajos y medios, degradados a cero.' },
    { id: 'kids',  en: "Kids' cut",       es: 'Corte para niños',  den: 'Patient with the little ones. First haircuts welcome.', des: 'Pacientes con los pequeños. Primer corte bienvenido.' },
    { id: 'beard', en: 'Beard & line-up', es: 'Barba y línea',     den: 'Sharp edges, shaped beard, clean neck.', des: 'Líneas nítidas, barba perfilada, cuello limpio.' },
    { id: 'nails', en: 'Nails',           es: 'Uñas',              den: 'Manicure, pedicure and acrylic sets in the same shop.', des: 'Manicure, pedicure y acrílicas en el mismo local.' }
  ],
  /* Real Google reviews (5 of 19 captured verbatim). Dates are relative as Google shows them. */
  reviews: [
    { author: 'Al Marley', stars: 5, when: { en: 'a year ago', es: 'hace un año' }, text: '1000% recommend. Been cutting my hair with Dago for over 12 years. Nothing but the best fresh haircut. I bring my son also here.' },
    { author: 'Elfan M.', stars: 5, when: { en: '3 months ago', es: 'hace 3 meses' }, text: 'A young guy gave me a good haircut. The prices are reasonable, and if I’m in that area of LA again, I’ll definitely stop by for another haircut.', meta: 'Local Guide' },
    { author: 'Karen Parrilla', stars: 5, when: { en: 'a year ago', es: 'hace un año' }, text: 'Great service, we have been coming for years. Clean and friendly environment. They also do nails 💅 — don’t hesitate to book, they also do walk-ins.' },
    { author: 'hohner323', stars: 5, when: { en: 'a year ago', es: 'hace un año' }, text: 'Have been coming with these barbers for years. Great cuts at great prices. Highly recommend to give a try if you’re in the area.' },
    { author: 'Santis Hilda', stars: 5, when: { en: 'a year ago', es: 'hace un año' }, text: 'Very nice barber shop! They also do nails. Very clean environment!' }
  ],
  reviewTopics: [ { en: 'nails', es: 'uñas', n: 7 }, { en: 'environment', es: 'ambiente', n: 6 }, { en: 'cleanliness', es: 'limpieza', n: 4 }, { en: 'haircuts', es: 'cortes', n: 4 } ],
  accessibility: { en: 'Wheelchair accessible entrance & parking', es: 'Entrada y estacionamiento accesibles' }
};

/* Photo manifest — order = feed order (first 10 of kind cut/kid make the front feed). ids map to assets/img/{feed,sq}/<id>.webp */
window.MILE.photos = [
  { id: 'p043', kind: 'cut', en: 'Skin fade', es: 'Skin fade' },
  { id: 'p016', kind: 'cut', en: 'Mid fade · slick back · beard', es: 'Mid fade · hacia atrás · barba' },
  { id: 'p029', kind: 'cut', en: 'Low taper · fringe', es: 'Taper bajo · fleco' },
  { id: 'p040', kind: 'cut', en: 'Textured fringe · mid fade', es: 'Fleco texturizado · mid fade' },
  { id: 'p050', kind: 'cut', en: 'Fringe crop · taper', es: 'Fleco corto · taper' },
  { id: 'p028', kind: 'kid', en: 'Kids’ hard part', es: 'Raya marcada · niño' },
  { id: 'p045', kind: 'cut', en: 'Side part · taper', es: 'Raya al lado · taper' },
  { id: 'p032', kind: 'cut', en: 'Skin fade · back', es: 'Skin fade · atrás' },
  { id: 'p017', kind: 'cut', en: 'Textured crop · taper', es: 'Corte texturizado · taper' },
  { id: 'p035', kind: 'cut', en: 'High fade · beard', es: 'High fade · barba' },
  { id: 'p018', kind: 'cut', en: 'Low taper', es: 'Taper bajo' },
  { id: 'p021', kind: 'cut', en: 'Textured top · mid fade', es: 'Arriba texturizado · mid fade' },
  { id: 'p022', kind: 'cut', en: 'Fringe crop', es: 'Fleco corto' },
  { id: 'p026', kind: 'cut', en: 'Neck taper', es: 'Taper de nuca' },
  { id: 'p042', kind: 'cut', en: 'Slick fringe · low taper', es: 'Fleco peinado · taper bajo' },
  { id: 'p044', kind: 'kid', en: 'Kids’ buzz · line-up', es: 'Rapado con línea · niño' },
  { id: 'p046', kind: 'cut', en: 'Mid fade', es: 'Mid fade' },
  { id: 'p047', kind: 'cut', en: 'Curly fringe · taper', es: 'Fleco rizado · taper' },
  { id: 'p052', kind: 'cut', en: 'Curls · line-up', es: 'Rizos · línea' },
  { id: 'p036', kind: 'cut', en: 'Textured crop · back', es: 'Corte texturizado · atrás' },
  { id: 'p037', kind: 'cut', en: 'Fringe · mid fade', es: 'Fleco · mid fade' },
  { id: 'p038', kind: 'cut', en: 'Fringe · taper', es: 'Fleco · taper' },
  { id: 'p013', kind: 'kid', en: 'Kids’ comb-over', es: 'Peinado al lado · niño' },
  { id: 'p019', kind: 'kid', en: 'Kids’ side part · fade', es: 'Raya al lado · niño' },
  { id: 'p015', kind: 'kid', en: 'Kids’ fringe · taper', es: 'Fleco · niño' },
  { id: 'p027', kind: 'kid', en: 'Kids’ fringe · taper', es: 'Fleco · niño' },
  { id: 'p039', kind: 'kid', en: 'Kids’ taper', es: 'Taper · niño' },
  { id: 'p031', kind: 'cut', en: 'Fringe crop', es: 'Fleco corto' },
  { id: 'p033', kind: 'cut', en: 'V-taper · back', es: 'Taper en V · atrás' },
  { id: 'p034', kind: 'cut', en: 'Textured spikes · taper', es: 'Puntas texturizadas · taper' },
  { id: 'p041', kind: 'cut', en: 'Back taper', es: 'Taper · atrás' },
  { id: 'p014', kind: 'cut', en: 'Taper · back', es: 'Taper · atrás' },
  { id: 'p020', kind: 'cut', en: 'Taper · back', es: 'Taper · atrás' },
  { id: 'p025', kind: 'cut', en: 'Textured back · taper', es: 'Atrás texturizado · taper' },
  { id: 'p030', kind: 'cut', en: 'Fringe · taper', es: 'Fleco · taper' },
  { id: 'p049', kind: 'cut', en: 'Back taper', es: 'Taper de nuca' },
  { id: 'p008', kind: 'kid', en: 'First haircut', es: 'Primer corte' },
  { id: 'p012', kind: 'kid', en: 'First haircut', es: 'Primer corte' },
  { id: 'p002', kind: 'nail', en: 'Acrylic set · red art', es: 'Acrílicas · arte rojo' },
  { id: 'p005', kind: 'nail', en: 'Red French tips', es: 'Puntas francesas rojas' },
  { id: 'p006', kind: 'nail', en: 'Pink hearts set', es: 'Corazones rosa' },
  { id: 'p003', kind: 'nail', en: 'Animal print set', es: 'Animal print' },
  { id: 'p024', kind: 'nail', en: 'Ombré set', es: 'Ombré' }
];
