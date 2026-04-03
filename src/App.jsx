import { useState, useEffect, useCallback, useRef } from "react";

const FONT = "'Segoe UI', system-ui, -apple-system, sans-serif";
const C = {
  primary:     "#f8b133",
  primaryDark: "#d4921a",
  primaryLight:"#fff4e0",
  bg:          "#f9fafb",
  surface:     "#ffffff",
  border:      "#e5e7eb",
  text:        "#374151",
  textMuted:   "#6b7280",
  textLight:   "#9ca3af",
  danger:      "#ef4444",
  dangerLight: "#fee2e2",
};

const SAMPLE_CARDS = [
  { german:"Guten Morgen",        spanish:"Buenos días",         pronunciation:"guten morgan",     notes:"Saludo matutino",         category:"Básico" },
  { german:"Guten Tag",           spanish:"Buenas tardes",       pronunciation:"guten tag",        notes:"",                        category:"Básico" },
  { german:"Auf Wiedersehen",     spanish:"Hasta luego",         pronunciation:"auf víderzen",     notes:"Formal",                  category:"Básico" },
  { german:"Tschüss",             spanish:"Chau",                pronunciation:"chus",             notes:"Informal",                category:"Básico" },
  { german:"Bitte",               spanish:"Por favor / De nada", pronunciation:"bite",             notes:"Muy frecuente",           category:"Básico" },
  { german:"Danke schön",         spanish:"Muchas gracias",      pronunciation:"danke shön",       notes:"",                        category:"Básico" },
  { german:"Entschuldigung",      spanish:"Disculpe / Perdón",   pronunciation:"entshuldigung",    notes:"Para llamar la atención", category:"Básico" },
  { german:"Ich verstehe nicht",  spanish:"No entiendo",         pronunciation:"ij ferstee nijt",  notes:"Muy útil",                category:"Básico" },
  { german:"Wo ist das Hotel?",   spanish:"¿Dónde está el hotel?",pronunciation:"vo ist das hotel",notes:"",                       category:"Básico" },
  { german:"Die Rechnung, bitte", spanish:"La cuenta, por favor", pronunciation:"di rejnung bite", notes:"Restaurantes",           category:"Básico" },
  { german:"Wie viel kostet das?",spanish:"¿Cuánto cuesta esto?", pronunciation:"vi fil kóstet das",notes:"",                      category:"Básico" },
  { german:"Ich möchte am... nach England, Frankreich, den Vereinigten Staaten... reisen.", spanish:"Deseo salir para Inglaterra, Francia, los Estados Unidos... el día...", pronunciation:"Ij mejte am... naj éngland, fránkraij, den feráinigten schtaten... raisen.", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Es interessiert mich, zu fliegen.", spanish:"Me interesa ir en avión", pronunciation:"Es interessirt mij, tsu fliguen.", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Ich möchte nächste Woche fahren.", spanish:"Me gustaría salir la semana próxima.", pronunciation:"lj mejte nejste voje faren.", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Könnten Sie mir einen Fahrplan und einen Kostenvoranschlag für diese Reise machen?", spanish:"¿Podría hacerme un itinerario del viaje y presupuesto?", pronunciation:"¿Kenten si mir ainen farplan und ainen kóstenfóranschlag fyr dise raise majen?", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Eine Pauschalreise.", spanish:"Un viaje a «forfait».", pronunciation:"Aine pauschalraise.", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Hin und zurück.", spanish:"De ida y vuelta.", pronunciation:"Jin und tsuryck.", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Nur einfache Fahrt, denn es könnte sein, daß ich mich von dort aus in ein anderes Land begebe.", spanish:"Sólo ida, pues es posible que desde allí me dirija a otro país.", pronunciation:"Nur áinfaje fart, den es kente sain, das ij mij fon dort aus in ain anderes land beguebe.", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Alles inbegriffen und in Hotels zweiter Kategorie.", spanish:"Todo completo y en hoteles de segunda categoría.", pronunciation:"Ales inbegrifen und in jotéls tsváiter kategorí.", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Ich habe... Tage für diese Reise angesetzt.", spanish:"Deseo destinar... días a este viaje.", pronunciation:"lj jabe... tague fyr dise raise anguesetst.", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Was kostet das insgesamt?", spanish:"¿Cuánto cuesta todo?", pronunciation:"¿Vas kóstet das insguesamt?", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Wird die Fahrkarte rückvergütet, falls ich nicht fahren kann?", spanish:"De no poder salir, ¿me devolverán el importe del billete?", pronunciation:"¿Vird die fárkarte rýkfergytet, fals ij nijt faren kan?", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Ich möchte eine Kabine erster Klasse mit zwei Schlafkojen für...", spanish:"Deseo un camarote de primera para... con dos literas.", pronunciation:"lj mejte aine kabine erster klasse mit tsvai schláfkoyen fyr...", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Was kostet das?", spanish:"¿Cuánto vale?", pronunciation:"¿Vas kostet das?", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Ausgezeichnet! Morgen komme ich vorbei, um die Fahrkarte abzuholen.", spanish:"Perfectamente, mañana pasaré a recoger el pasaje.", pronunciation:"¡Áusguetsáijnet! Morguen kome ij forbái, um di fárkarte ábtsujolen.", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Schicken Sie mir bitte die Fahrkarte ins Hotel. Der Portier wird sie bezahlen.", spanish:"Haga el favor de enviarme el pasaje al hotel, allí lo abonará el conserje.", pronunciation:"Schiken si mir bite di fárkarte ins jotel. Der portié vird si betsalen.", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Ich möchte eine Erholungsreise durch... machen.", spanish:"Quisiera hacer un viaje de recreo por...", pronunciation:"lj mejte aine erjólungsraise durj... majen.", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Den Besuch welcher Städte empfehlen Sie mir?", spanish:"¿Qué ciudades me aconseja que visite?", pronunciation:"¿Den besuj véljer schtete empfelen si mir?", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Könnten Sie mir eine Reise nach... zusammenstellen?", spanish:"¿Podría combinarme un viaje para...?", pronunciation:"¿Kenten si mir aine raise naj... tsusámenschtelen?", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Ich möchte im Reisebus, im Pullmannwagen fahren und in nicht zu teuren Hotels übernachten.", spanish:"Desearía hacer el viaje en autocar, en autopullman, y los hospedajes en hoteles de segunda clase.", pronunciation:"lj mejte im ráisebus, im púlmanvaguen faren und in nijt tsu toyren jotéls ybernajten.", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Ich möchte die Gegend von... besuchen.", spanish:"Quisiera visitar la región...", pronunciation:"lj mejte di guéguend fon... besujen.", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Reservieren Sie mir für den... zwei Plätze im Reisebus.", spanish:"Resérveme dos plazas para el autocar del día...", pronunciation:"Reserviren si mir fyr den... tsvai pletse im ráisebus.", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Könnten Sie mir Prospekte besorgen?", spanish:"¿Me podría facilitar folletos turísticos?", pronunciation:"¿Kenten si mir prospekte besorguen?", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Was bin ich ihnen schuldig?", spanish:"¿Cuánto le debo?", pronunciation:"¿Vas bin ij inen schúldij?", notes:"", category:"En la agencia de viajes - Im Reisebüro" },
  { german:"Die Stoßstange.", spanish:"El parachoques.", pronunciation:"Di schtósschtangue.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Kotflügel.", spanish:"El guardabarros.", pronunciation:"Der kótflyguel.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Kühler.", spanish:"El radiador.", pronunciation:"Der kýler.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Das Rad.", spanish:"La rueda.", pronunciation:"Das rad.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Das Reserverad.", spanish:"La rueda de recambio.", pronunciation:"Das resérverad.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der (Auto) reifen.", spanish:"El neumático o la cubierta.", pronunciation:"Der (auto) raifen.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Schlauch.", spanish:"La cámara.", pronunciation:"Der schlauj.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Scheinwerfer.", spanish:"Los faros.", pronunciation:"Di scháinverfer.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Positionslichter.", spanish:"Las luces de posición.", pronunciation:"Di positsiónslijter.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Das Rücklicht.", spanish:"La luz trasera.", pronunciation:"Das rýklijt.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Blinker.", spanish:"El intermitente.", pronunciation:"Der blinker.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Das Nummernschild (das Kennzeichen).", spanish:"La matrícula.", pronunciation:"Das númernschild (das kéntsaijen).", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Das Schloß.", spanish:"La cerradura.", pronunciation:"Das schlos.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Motorhaube (die Kühlerhaube).", spanish:"La cubierta del motor («el capot»).", pronunciation:"Di motorjaube (di kýlerjaube).", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Windschutzscheibe.", spanish:"El parabrisas.", pronunciation:"Di vindschutsschaibe.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Das Verdeck.", spanish:"La capota (cubierta del coche).", pronunciation:"Das ferdek.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die (Wagen) tür.", spanish:"La portezuela.", pronunciation:"Di (váguen)týr.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Gepäckträger.", spanish:"El portaequipajes.", pronunciation:"Der guepéktreguer.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Benzinbehälter (Benzintank).", spanish:"El tanque de gasolina.", pronunciation:"Der bentsinbehelter (bentsintank).", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Das Lenkrad.", spanish:"El volante.", pronunciation:"Das lénkrad.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Hupe.", spanish:"La bocina.", pronunciation:"Di jupe.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Benzinanzeiger.", spanish:"El indicador de gasolina.", pronunciation:"Der bentsínántsaiguer.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Ölstandanzeiger (die Ölkontrollampe).", spanish:"El indicador de aceite.", pronunciation:"Der élschtandántsaiguer (die élkontrol-lampe).", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Temperaturanzeiger.", spanish:"El indicador de temperatura.", pronunciation:"Der temperatúrantsaiguer.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Geschwindigkeitsmesser.", spanish:"El cuenta-velocidades.", pronunciation:"Der gueschvindijkaitsmeser.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Zündschlüssel.", spanish:"El contacto.", pronunciation:"Der tsýndschlyssel.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Abblendschalter.", spanish:"El interruptor de los faros.", pronunciation:"Der ábblendschalter.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Das Handgas.", spanish:"El acelerador de mano.", pronunciation:"Das jándgas.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Luftklappe des Vergasers.", spanish:"El interruptor del aire.", pronunciation:"Di lúftklape des fergásers.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Schalthebel.", spanish:"La palanca del cambio de marchas.", pronunciation:"Der scháltjebel.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Bremshebel.", spanish:"La palanca del freno.", pronunciation:"Der brémsjebel.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Das Gaspedal.", spanish:"El acelerador de pie.", pronunciation:"Das gáspedal.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Kupplung.", spanish:"El embrague.", pronunciation:"Di kúplung.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Ventilator.", spanish:"El ventilador.", pronunciation:"Der ventilátor.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Luftfilter.", spanish:"El filtro de aire.", pronunciation:"Der lúftfilter.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Batterie.", spanish:"La batería o el acumulador.", pronunciation:"Di baterí.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Abblendlichter.", spanish:"El alumbrado de cruce-carretera.", pronunciation:"Di ápblendlijter.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Rückspiegel.", spanish:"El retrovisor.", pronunciation:"Der rýkschpiguel.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Kühlung.", spanish:"La refrigeración.", pronunciation:"Di kýlung.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Schaltkasten.", spanish:"La caja de cambios.", pronunciation:"Der schaltkasten.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Rückwärtsgang.", spanish:"La marcha atrás.", pronunciation:"Der rýkwertsgang.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Federung.", spanish:"La suspensión.", pronunciation:"Di féderung.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Stoßdämpfer.", spanish:"El amortiguador.", pronunciation:"Der schtósdempfer.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Das Differential.", spanish:"El diferencial.", pronunciation:"Das diferentsiál.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Rahmen.", spanish:"El bastidor.", pronunciation:"Der ramen.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Motor.", spanish:"El motor.", pronunciation:"Der mótor.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Zündkontakte.", spanish:"Los platinos.", pronunciation:"Die tsýnkontakte.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Zündkerzen.", spanish:"Las bujías.", pronunciation:"Di tsýndkertsen.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Kondensator.", spanish:"El condensador.", pronunciation:"Der kondensátor.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Ventile.", spanish:"Las válvulas.", pronunciation:"Di ventile.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Vergaser.", spanish:"El carburador.", pronunciation:"Der fergáser.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die (Wellen) lager.", spanish:"Los cojinetes.", pronunciation:"Di (vélen)láguer.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Das Kurbelgehäuse.", spanish:"El cárter.", pronunciation:"Das kúrbelguejoise.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Ölpumpe.", spanish:"La bomba de aceite.", pronunciation:"Di élpumpe.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Pleuelstange.", spanish:"La biela.", pronunciation:"Di plóyelschtangue.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Kolben.", spanish:"El pistón.", pronunciation:"Der kolben.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Lichtmaschine.", spanish:"La dinamo.", pronunciation:"Di líjtmaschine.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Spule.", spanish:"La bobina.", pronunciation:"Di schpule.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Kurbelwelle.", spanish:"El eje de transmisión.", pronunciation:"Di kúrbelvele.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Nockenwelle.", spanish:"El árbol de leva.", pronunciation:"Di nókenvele.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Radscheiben.", spanish:"Los platos de las ruedas.", pronunciation:"Di rádschaiben.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Das Radio, die Antenne.", spanish:"La radio, la antena.", pronunciation:"Das radio, di anténe.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Lastwagen.", spanish:"El camión.", pronunciation:"Der lástvaguen.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Schraube.", spanish:"El tornillo.", pronunciation:"Di schráube.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Der Schraubenzieher.", spanish:"El destornillador.", pronunciation:"Der schraubentsier.", notes:"", category:"El viaje. En automóvil - Die Reise. Im Wagen" },
  { german:"Die Autobahn.", spanish:"Autopista / Autovía.", pronunciation:"Di áutoban.", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Die Landstraße.", spanish:"Carretera general.", pronunciation:"Di landschtrase.", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Die Gemeindestraße.", spanish:"Carretera comarcal.", pronunciation:"Di guemáindeschtrase.", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Autobahngebühr.", spanish:"Peaje.", pronunciation:"Autobanguebyr.", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Kreuzung.", spanish:"Cruce.", pronunciation:"Króitsung.", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Achtung, Bauarbeiten.", spanish:"Precaución, Obras.", pronunciation:"Ajtung, báuarbaiten.", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Parkplatz.", spanish:"Aparcamiento.", pronunciation:"Párkplats.", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Könnten Sie mir, bitte, die Landstraße nach... zeigen?", spanish:"¿Haría el favor de indicarme la carretera general de...?", pronunciation:"¿Kenten si mir, bite, di lándschtrasse naj... tsaiguen?", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Wie viele Kilometer sind es bis...?", spanish:"¿Cuántos kilómetros hay hasta...?", pronunciation:"¿Vi file kilométer sind es bis...?", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Ist die Landstraße gut?", spanish:"¿Es buena la carretera?", pronunciation:"¿lst di lándschtrasse gut?", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Liegt der ...-Paß sehr hoch?", spanish:"¿Está a mucha altura la cima del Puerto...?", pronunciation:"¿Ligt der ...-pas ser joj?", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Gefährlich?", spanish:"¿Peligrosa?", pronunciation:"¿Gueférlij?", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Verschneit?", spanish:"¿Nevada?", pronunciation:"¿Ferschnait?", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Vereist?", spanish:"¿Helada?", pronunciation:"¿Feraist?", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Wie heißt diese Gegend?", spanish:"¿Cómo se llama esta comarca?", pronunciation:"¿Vi jaist dise guéguend?", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Ist sie eben, gebirgig?", spanish:"¿Es llana, montañosa?", pronunciation:"¿lst si eben, guebirguij?", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Wie weit ist das Hotel, das Postamt, das Telefon, der Fluß, die Brücke, die Garage, die Polizeiwache?", spanish:"¿A qué distancia está el hotel, la estafeta de Correos, el teléfono, el río, el puente, el garaje, la Comisaría de Policía?", pronunciation:"¿vait ist das jotel, das póstamt, das telefon, der flus, di bryke, di garage, di politsáivaje?", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Wo kann ich eine Straßenkarte bekommen?", spanish:"¿Dónde puedo comprar un mapa de carreteras?", pronunciation:"¿Vo kan ij aine schtrássenkarte bekomen?", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Vielen Dank für Ihre Auskunft.", spanish:"Muchas gracias por su información.", pronunciation:"Filen dank fyr ire áuskunft.", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Könnten Sie mir sagen, ob sich in der Nähe ein Gasthof befindet?", spanish:"¿Puede decirme si hay un parador cerca?", pronunciation:"¿Kenten si mir saguen, ob sij in der nee ain gástjof befindet?", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Ist hier in der Nähe eine Tankstelle?", spanish:"¿Hay cerca de aquí una gasolinera?", pronunciation:"¿lst jir in der née áine tánkschtele?", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Gibt es in diesem Dorf eine Autoreparaturwerkstätte?", spanish:"¿Hay en este pueblo algún taller de reparación de coches?", pronunciation:"¿Guibt es in disem dorf aine áutoreparatúrverkstéte?", notes:"", category:"En el trayecto - Unterwegs" },
  { german:"Welche ist die direkte Landstraße zur Küste?", spanish:"¿Cuál es la carretera más recta para alcanzar la costa?", pronunciation:"¿Velje ist di direkte landschtrasse tsur kyste?", notes:"", category:"En el trayecto - Unterwegs" },
];

const BATCH_OPTIONS = [
  { n:10,  label:"10 tarjetas" },
  { n:20,  label:"20 tarjetas", note:"recomendado" },
  { n:50,  label:"50 tarjetas" },
  { n:100, label:"100 tarjetas" },
  { n:0,   label:"Todas" },
];

const PAGE_SIZE = 15;

function makeId()  { return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function stamp(arr){ return arr.map(c=>({...c,id:makeId(),createdAt:Date.now(),lastReviewed:null})); }
function todayStr(){ return new Date().toISOString().slice(0,10); }

function fmtDate(ts) {
  if(!ts) return null;
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2,"0");
  const mm = String(d.getMonth()+1).padStart(2,"0");
  return `${dd}/${mm}`;
}

function load() {
  try {
    const r = localStorage.getItem("dc_v7");
    if(!r) return null;
    const p = JSON.parse(r);
    return { cards: p.cards||[] };
  } catch { return null; }
}
function save(cards) {
  try { localStorage.setItem("dc_v7", JSON.stringify({cards})); } catch {}
}

function parseCSV(raw) {
  const text = raw.replace(/^\uFEFF/,"");
  const firstLine = text.split(/\r?\n/)[0];
  const delim = (firstLine.match(/;/g)||[]).length >= (firstLine.match(/,/g)||[]).length ? ";" : ",";
  const lines = text.split(/\r?\n/).filter(l=>l.trim());
  if(lines.length<2) return [];
  function parseLine(line) {
    const cols=[]; let cur="", inQ=false;
    for(const ch of line){
      if(ch==='"'){ inQ=!inQ; }
      else if(ch===delim&&!inQ){ cols.push(cur.trim()); cur=""; }
      else cur+=ch;
    }
    cols.push(cur.trim()); return cols;
  }
  const norm = h => h.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/\s+/g,"")
    .replace("aleman","german").replace("espanol","spanish")
    .replace("pronunciacion","pronunciation")
    .replace("notas","notes").replace("categoria","category");
  const headers = parseLine(lines[0]).map(norm);
  const results=[];
  for(let i=1;i<lines.length;i++){
    const cols=parseLine(lines[i]);
    const obj={};
    headers.forEach((h,idx)=>{ obj[h]=(cols[idx]||"").replace(/^"|"$/g,"").trim(); });
    if(obj.german) results.push(obj);
  }
  return results;
}

function buildQueue(cards,batchSize,cat,shuffled) {
  let pool = cat==="all" ? [...cards] : cards.filter(c=>c.category===cat);
  const unseen = pool.filter(c=>!c.lastReviewed);
  const seen   = pool.filter(c=> c.lastReviewed).sort((a,b)=>a.lastReviewed-b.lastReviewed);
  let ordered  = [...unseen,...seen];
  if(shuffled) ordered = ordered.sort(()=>Math.random()-0.5);
  return batchSize>0 ? ordered.slice(0,batchSize) : ordered;
}

function seenToday(cards) {
  const t = todayStr();
  return cards.filter(c=>c.lastReviewed && new Date(c.lastReviewed).toISOString().slice(0,10)===t).length;
}

// ── SVG Icons ─────────────────────────────────────────────────
function IconEdit({color=C.primaryDark,size=15}){
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><path d="M11.5 1.5a1.414 1.414 0 0 1 2 2L5 12H3v-2L11.5 1.5z" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/><path d="M2 14h12" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></svg>;
}
function IconTrash({color=C.danger,size=14}){
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><path d="M2 4h12M6 4V2h4v2M5 4l1 9h4l1-9" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function IconSearch({color=C.textLight,size=15}){
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke={color} strokeWidth="1.4"/><path d="M11 11l3 3" stroke={color} strokeWidth="1.4" strokeLinecap="round"/></svg>;
}

// ── UI primitives ─────────────────────────────────────────────
function Btn({children,onClick,variant="primary",disabled,style={}}){
  const base={fontFamily:FONT,borderRadius:8,fontWeight:600,fontSize:15,cursor:disabled?"not-allowed":"pointer",border:"none",minHeight:44,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 18px",opacity:disabled?0.45:1,transition:"opacity 0.15s",lineHeight:1};
  const variants={primary:{background:C.primary,color:"#fff"},outline:{background:C.surface,color:C.text,border:`1.5px solid ${C.border}`},ghost:{background:"transparent",color:C.textMuted,border:`1px solid ${C.border}`}};
  return <button onClick={disabled?undefined:onClick} style={{...base,...variants[variant],...style}}>{children}</button>;
}
function StatCard({value,label,color=C.primary}){
  return <div style={{flex:1,minWidth:80,background:C.surface,borderRadius:8,padding:"12px 8px",border:`1px solid ${C.border}`,textAlign:"center",fontFamily:FONT}}><div style={{fontSize:22,fontWeight:700,color,lineHeight:1}}>{value}</div><div style={{fontSize:11,color:C.textMuted,marginTop:4}}>{label}</div></div>;
}
function Modal({children}){
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.52)",display:"flex",alignItems:"center",justifyContent:"center",padding:16,zIndex:200,fontFamily:FONT}}><div style={{background:C.surface,borderRadius:14,padding:28,width:"100%",maxWidth:380,boxShadow:"0 8px 40px rgba(0,0,0,0.18)"}}>{children}</div></div>;
}

// ── App ───────────────────────────────────────────────────────
export default function App(){
  const [screen,     setScreen]     = useState("deck");
  const [cards,      setCards]      = useState([]);
  const [toast,      setToast]      = useState("");
  const [queue,      setQueue]      = useState([]);
  const [idx,        setIdx]        = useState(0);
  const [flipped,    setFlipped]    = useState(false);
  const [shuffled,   setShuffled]   = useState(false);
  const [filterCat,  setFilterCat]  = useState("all");
  const [editCard,   setEditCard]   = useState(null);
  const [importDate, setImportDate] = useState("");
  const [dragOver,   setDragOver]   = useState(false);
  const [batchSize,  setBatchSize]  = useState(20);
  const [showBatch,  setShowBatch]  = useState(false);
  const [sessionCount,setSessionCount] = useState(0);
  // deck list controls
  const [search,     setSearch]     = useState("");
  const [listPage,   setListPage]   = useState(0);
  const fileRef = useRef();

  useEffect(()=>{
    const saved = load();
    if(saved && saved.cards.length>0){
      const existingKeys = new Set(saved.cards.map(c=>c.german+"||"+c.spanish));
      const newSamples = SAMPLE_CARDS.filter(c=>!existingKeys.has(c.german+"||"+c.spanish));
      setCards([...saved.cards,...stamp(newSamples)]);
    } else {
      setCards(stamp(SAMPLE_CARDS));
    }
  },[]);
  useEffect(()=>{ save(cards); },[cards]);

  const showToast = msg=>{ setToast(msg); setTimeout(()=>setToast(""),3000); };
  const cats = ["all",...[...new Set(cards.map(c=>c.category).filter(Boolean))]];
  const viewedToday  = seenToday(cards);
  const pendingToday = cards.length - viewedToday;

  // Filtered + paginated list for deck view
  const filteredCards = cards.filter(c=>{
    const matchCat = filterCat==="all" || c.category===filterCat;
    const q = search.toLowerCase();
    const matchSearch = !q || c.german.toLowerCase().includes(q) || c.spanish.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });
  const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
  const safePage   = Math.min(listPage, totalPages-1);
  const pageCards  = filteredCards.slice(safePage*PAGE_SIZE, (safePage+1)*PAGE_SIZE);

  // Reset page when filter/search changes
  useEffect(()=>{ setListPage(0); },[filterCat,search]);

  useEffect(()=>{
    if(screen!=="study"||!queue.length) return;
    const c=queue[idx]; if(!c) return;
    setCards(prev=>prev.map(card=>card.id===c.id?{...card,lastReviewed:Date.now()}:card));
  },[screen,idx,queue]);

  const startStudy = useCallback((bs=batchSize,cat=filterCat,sh=shuffled)=>{
    const q=buildQueue(cards,bs,cat,sh);
    if(!q.length){ showToast("No hay tarjetas para esta selección"); return; }
    setSessionCount(q.length); setQueue(q); setIdx(0); setFlipped(false); setScreen("study"); setShowBatch(false);
  },[cards,batchSize,filterCat,shuffled]);

  const handleFile = file=>{
    if(!file) return;
    const reader=new FileReader();
    reader.onload=e=>{
      const parsed=parseCSV(e.target.result);
      if(!parsed.length){ showToast("No se encontraron tarjetas en el CSV"); return; }
      const existing=new Set(cards.map(c=>c.german+"||"+c.spanish));
      const fresh=parsed.filter(c=>!existing.has(c.german+"||"+c.spanish));
      if(!fresh.length){ showToast("Todas las tarjetas ya existen en el deck"); return; }
      const stamped=stamp(fresh);
      setCards(f=>[...f,...stamped]);
      setImportDate(fmtDate(Date.now()));
      showToast(`✓ ${stamped.length} tarjetas importadas · ${parsed.length-fresh.length} omitidas`);
    };
    reader.readAsText(file,"utf-8");
  };

  const addBlank  = ()=>setEditCard({id:makeId(),german:"",spanish:"",pronunciation:"",notes:"",category:"",createdAt:Date.now(),lastReviewed:null});
  const saveEdit  = card=>{
    if(!card.german.trim()){ showToast("El campo Alemán es obligatorio"); return; }
    setCards(f=>{ const ex=f.find(c=>c.id===card.id); return ex?f.map(c=>c.id===card.id?card:c):[...f,card]; });
    setEditCard(null); showToast("Tarjeta guardada");
  };
  const delCard   = id=>setCards(f=>f.filter(c=>c.id!==id));

  const nav = useCallback(dir=>{
    setIdx(i=>{
      const next=i+dir;
      if(next>=queue.length){ setScreen("done"); setFlipped(false); return i; }
      if(next<0) return 0;
      setFlipped(false); return next;
    });
  },[queue.length]);

  useEffect(()=>{
    if(screen!=="study") return;
    const h=e=>{
      if(["ArrowUp","ArrowDown"].includes(e.key)){ e.preventDefault(); setFlipped(f=>!f); }
      if(e.key==="ArrowRight"){ e.preventDefault(); nav(1); }
      if(e.key==="ArrowLeft"){  e.preventDefault(); nav(-1); }
    };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[screen,nav]);

  const toggleShuffle=()=>{
    const ns=!shuffled; setShuffled(ns);
    const q=buildQueue(cards,batchSize,filterCat,ns); setQueue(q); setIdx(0); setFlipped(false);
  };

  const card=queue[idx];
  const isMobile = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

  // ── BATCH MODAL ──
  if(showBatch) return(
    <Modal>
      <p style={{margin:"0 0 4px",fontWeight:700,fontSize:16,color:C.text}}>¿Cuántas tarjetas hoy?</p>
      <p style={{margin:"0 0 20px",fontSize:13,color:C.textMuted}}>
        Sin ver: <b style={{color:C.primaryDark}}>{cards.filter(c=>!c.lastReviewed).length}</b>
        &nbsp;· Vistas hoy: <b style={{color:C.primaryDark}}>{viewedToday}</b>
      </p>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {BATCH_OPTIONS.map(({n,label,note})=>{
          const sel=batchSize===n;
          return(
            <button key={n} onClick={()=>{ setBatchSize(n); startStudy(n,filterCat,shuffled); }}
              style={{fontFamily:FONT,padding:"13px 16px",borderRadius:9,border:`1.5px solid ${sel?C.primary:C.border}`,background:sel?C.primaryLight:C.surface,color:sel?C.primaryDark:C.text,fontWeight:600,fontSize:15,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",transition:"all 0.15s"}}>
              <span>{n===0?`Todas (${cards.length})`:label}</span>
              {note&&<span style={{fontSize:11,color:C.textLight}}>{note}</span>}
            </button>
          );
        })}
      </div>
      <button onClick={()=>setShowBatch(false)} style={{fontFamily:FONT,marginTop:14,width:"100%",padding:"11px 0",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.textMuted,fontSize:14,fontWeight:500,cursor:"pointer"}}>Cancelar</button>
    </Modal>
  );

  // ── EDIT MODAL ──
  if(editCard) return(
    <Modal>
      <p style={{margin:"0 0 18px",fontSize:16,fontWeight:700,color:C.text}}>Editar tarjeta</p>
      {[["german","Alemán *"],["spanish","Español"],["pronunciation","Pronunciación"],["notes","Notas"],["category","Categoría"]].map(([k,label])=>(
        <div key={k} style={{marginBottom:12}}>
          <label style={{fontFamily:FONT,fontSize:12,color:C.textMuted,display:"block",marginBottom:4,fontWeight:600}}>{label}</label>
          <input value={editCard[k]||""} onChange={e=>setEditCard(c=>({...c,[k]:e.target.value}))}
            style={{fontFamily:FONT,width:"100%",padding:"11px 12px",borderRadius:8,border:`1.5px solid ${C.border}`,fontSize:15,boxSizing:"border-box",outline:"none",color:C.text}}
            onFocus={e=>e.target.style.borderColor=C.primary}
            onBlur={e=>e.target.style.borderColor=C.border}/>
        </div>
      ))}
      <div style={{display:"flex",gap:10,marginTop:10}}>
        <Btn variant="outline" onClick={()=>setEditCard(null)} style={{flex:1}}>Cancelar</Btn>
        <Btn onClick={()=>saveEdit(editCard)} style={{flex:1}}>Guardar</Btn>
      </div>
    </Modal>
  );

  // ── DONE SCREEN ──
  if(screen==="done") return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:FONT,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:C.surface,borderRadius:16,padding:32,maxWidth:360,width:"100%",textAlign:"center",border:`1px solid ${C.border}`,boxShadow:"0 2px 16px rgba(0,0,0,0.07)"}}>
        <div style={{fontSize:40,marginBottom:12}}>🎉</div>
        <p style={{margin:"0 0 6px",fontSize:20,fontWeight:700,color:C.text}}>Sesión completada</p>
        <p style={{margin:"0 0 24px",fontSize:14,color:C.textMuted}}>
          Repasaste <b style={{color:C.primaryDark}}>{sessionCount}</b> tarjeta{sessionCount!==1?"s":""} · Vistas hoy: <b style={{color:C.primaryDark}}>{seenToday(cards)}</b>
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Btn onClick={()=>startStudy(batchSize,filterCat,shuffled)} style={{width:"100%"}}>Repetir sesión</Btn>
          <Btn variant="outline" onClick={()=>setShowBatch(true)} style={{width:"100%"}}>Nueva sesión</Btn>
          <Btn variant="ghost" onClick={()=>setScreen("deck")} style={{width:"100%"}}>Volver al deck</Btn>
        </div>
      </div>
    </div>
  );

  // ── MAIN ──
  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:FONT,color:C.text}}>
      {toast&&<div style={{position:"fixed",top:16,left:"50%",transform:"translateX(-50%)",background:"#1f2937",color:"#fff",padding:"10px 20px",borderRadius:30,fontSize:13,zIndex:999,boxShadow:"0 4px 20px rgba(0,0,0,0.2)",whiteSpace:"nowrap",maxWidth:"90vw",fontFamily:FONT}}>{toast}</div>}

      {/* HEADER */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,background:C.primary,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",letterSpacing:"0.5px"}}>DE</div>
          <span style={{fontWeight:700,fontSize:15,color:C.text}}>DeutschCards</span>
          {importDate&&<span style={{fontSize:11,color:C.textLight,marginLeft:2}}>· {importDate}</span>}
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["deck","Deck"],["study","Estudiar"]].map(([s,label])=>(
            <button key={s} onClick={()=>s==="study"?setShowBatch(true):setScreen(s)}
              style={{fontFamily:FONT,padding:"8px 14px",borderRadius:7,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,minHeight:36,background:screen===s?C.primary:"transparent",color:screen===s?"#fff":C.textMuted,transition:"all 0.15s"}}>
              {label}{s==="study"&&cards.length>0?` (${cards.length})`:""}
            </button>
          ))}
        </div>
      </div>

      {/* ── DECK ── */}
      {screen==="deck"&&(
        <div style={{maxWidth:640,margin:"0 auto",padding:"20px 16px"}}>

          {/* Progress banner */}
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"14px 16px",marginBottom:18,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
            <div>
              <p style={{margin:0,fontWeight:700,fontSize:14,color:C.text}}>Progreso de hoy</p>
              <p style={{margin:"2px 0 0",fontSize:12,color:C.textMuted}}>
                {viewedToday>0?`${viewedToday} vistas · ${pendingToday} pendientes`:`${cards.length} tarjetas pendientes`}
              </p>
            </div>
            <div style={{height:8,flex:1,maxWidth:140,background:C.border,borderRadius:4,overflow:"hidden"}}>
              <div style={{height:"100%",background:C.primary,borderRadius:4,width:cards.length?`${(viewedToday/cards.length)*100}%`:"0%",transition:"width 0.4s"}}/>
            </div>
            <span style={{fontSize:13,fontWeight:700,color:C.primaryDark,whiteSpace:"nowrap"}}>
              {cards.length?Math.round((viewedToday/cards.length)*100):0}%
            </span>
          </div>

          {/* Import */}
          <div onClick={()=>fileRef.current.click()}
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
            style={{background:dragOver?C.primaryLight:C.surface,border:`2px dashed ${dragOver?C.primary:C.border}`,borderRadius:10,padding:"16px",textAlign:"center",cursor:"pointer",marginBottom:18,transition:"all 0.2s"}}>
            <p style={{fontWeight:700,color:C.primary,fontSize:14,margin:0}}>Importar CSV</p>
            <p style={{color:C.textMuted,fontSize:12,margin:"4px 0 0"}}>Alemán · Español · Pronunciación · Notas · Categoría</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" style={{display:"none"}} onChange={e=>{handleFile(e.target.files[0]);e.target.value="";}}/>

          {/* Stats */}
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <StatCard value={cards.length}  label="tarjetas"/>
            <StatCard value={viewedToday}   label="vistas hoy"  color={C.primaryDark}/>
            <StatCard value={pendingToday}  label="pendientes"  color={C.textMuted}/>
          </div>

          {/* Actions */}
          <div style={{display:"flex",gap:10,marginBottom:18}}>
            <Btn variant="outline" onClick={addBlank} style={{flex:1}}>+ Manual</Btn>
            <Btn onClick={()=>setShowBatch(true)} disabled={!cards.length} style={{flex:2}}>Estudiar hoy</Btn>
          </div>

          {/* Category tabs */}
          {cats.length>2&&(
            <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14}}>
              {cats.map(cat=>(
                <button key={cat} onClick={()=>setFilterCat(cat)}
                  style={{fontFamily:FONT,padding:"6px 13px",borderRadius:16,minHeight:34,border:`1.5px solid ${filterCat===cat?C.primary:C.border}`,background:filterCat===cat?C.primaryLight:"transparent",color:filterCat===cat?C.primaryDark:C.textMuted,fontSize:13,cursor:"pointer",fontWeight:600,transition:"all 0.15s"}}>
                  {cat==="all"?"Todas":cat}
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div style={{position:"relative",marginBottom:12}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>
              <IconSearch/>
            </span>
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Buscar en alemán o español..."
              style={{fontFamily:FONT,width:"100%",padding:"10px 12px 10px 36px",borderRadius:8,border:`1.5px solid ${search?C.primary:C.border}`,fontSize:14,boxSizing:"border-box",outline:"none",color:C.text,background:C.surface,transition:"border 0.2s"}}
              onFocus={e=>e.target.style.borderColor=C.primary}
              onBlur={e=>e.target.style.borderColor=search?C.primary:C.border}
            />
            {search&&(
              <button onClick={()=>setSearch("")}
                style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.textLight,fontSize:16,lineHeight:1,padding:"2px 4px"}}>
                ✕
              </button>
            )}
          </div>

          {/* Card list — fixed height scroll container */}
          <div style={{border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden",background:C.surface}}>
            {pageCards.length===0?(
              <div style={{padding:"24px",textAlign:"center",color:C.textMuted,fontSize:14}}>
                {search?"No hay resultados para esa búsqueda.":"No hay tarjetas en esta categoría."}
              </div>
            ):(
              pageCards.map(c=>{
                const seenDate = fmtDate(c.lastReviewed);
                const showBadge = filterCat==="all";
                return(
                  <div key={c.id}
                    style={{display:"flex",alignItems:"center",padding:"0 13px",height:46,borderBottom:`1px solid ${C.border}`,gap:8,boxSizing:"border-box"}}>
                    {/* German — fixed width, 1 line, ellipsis */}
                    <span style={{fontWeight:600,fontSize:13,color:C.text,flex:"0 0 38%",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                      {c.german}
                    </span>
                    {/* Category badge — only when showing all */}
                    {showBadge&&c.category?(
                      <span style={{flex:"0 0 auto",fontSize:10,background:C.primaryLight,color:C.primaryDark,borderRadius:4,padding:"1px 6px",fontWeight:600,whiteSpace:"nowrap",maxWidth:120,overflow:"hidden",textOverflow:"ellipsis"}}>
                        {c.category}
                      </span>
                    ):<span style={{flex:"0 0 auto",width:0}}/>}
                    {/* Spanish — fills remaining space */}
                    <span style={{color:C.textMuted,fontSize:12,flex:1,overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis"}}>
                      {c.spanish}
                    </span>
                    {/* Date + actions */}
                    <div style={{display:"flex",gap:4,flexShrink:0,alignItems:"center"}}>
                      {seenDate&&<span style={{fontSize:10,color:C.textLight,whiteSpace:"nowrap"}}>{seenDate}</span>}
                      <button onClick={()=>setEditCard({...c})} style={{background:"none",border:"none",cursor:"pointer",padding:"4px 5px",minHeight:36,display:"flex",alignItems:"center"}}><IconEdit/></button>
                      <button onClick={()=>delCard(c.id)} style={{background:"none",border:"none",cursor:"pointer",padding:"4px 5px",minHeight:36,display:"flex",alignItems:"center"}}><IconTrash/></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages>1&&(
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10,gap:8}}>
              <button onClick={()=>setListPage(p=>Math.max(0,p-1))} disabled={safePage===0}
                style={{fontFamily:FONT,padding:"7px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:C.surface,color:safePage===0?C.textLight:C.text,cursor:safePage===0?"not-allowed":"pointer",fontSize:13,fontWeight:600}}>
                ← Ant.
              </button>
              <span style={{fontSize:12,color:C.textMuted}}>
                {safePage+1} / {totalPages} · {filteredCards.length} tarjetas
              </span>
              <button onClick={()=>setListPage(p=>Math.min(totalPages-1,p+1))} disabled={safePage>=totalPages-1}
                style={{fontFamily:FONT,padding:"7px 14px",borderRadius:7,border:`1px solid ${C.border}`,background:C.surface,color:safePage>=totalPages-1?C.textLight:C.text,cursor:safePage>=totalPages-1?"not-allowed":"pointer",fontSize:13,fontWeight:600}}>
                Sig. →
              </button>
            </div>
          )}

          {cards.length>0&&(
            <button onClick={()=>setCards([])} style={{fontFamily:FONT,marginTop:14,fontSize:12,color:C.danger,background:"none",border:"none",cursor:"pointer",display:"block"}}>
              Vaciar deck
            </button>
          )}
        </div>
      )}

      {/* ── STUDY ── */}
      {screen==="study"&&(
        <div style={{maxWidth:500,margin:"0 auto",padding:"20px 16px"}}>

          {cats.length>2&&(
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
              {cats.map(cat=>(
                <button key={cat}
                  onClick={()=>{ setFilterCat(cat); const q=buildQueue(cards,batchSize,cat,shuffled); setQueue(q); setIdx(0); setFlipped(false); }}
                  style={{fontFamily:FONT,padding:"6px 12px",borderRadius:14,minHeight:34,border:`1.5px solid ${filterCat===cat?C.primary:C.border}`,background:filterCat===cat?C.primaryLight:"transparent",color:filterCat===cat?C.primaryDark:C.textMuted,fontSize:12,cursor:"pointer",fontWeight:600}}>
                  {cat==="all"?"Todas":cat}
                </button>
              ))}
            </div>
          )}

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontWeight:700,color:C.primary,fontSize:15}}>{idx+1} / {queue.length}</span>
            {/* Shuffle toggle — texto puro, sin ícono */}
            <button onClick={toggleShuffle}
              style={{fontFamily:FONT,padding:"6px 14px",borderRadius:20,minHeight:34,border:`1.5px solid ${shuffled?C.primary:C.border}`,background:shuffled?C.primaryLight:"transparent",color:shuffled?C.primaryDark:C.textMuted,fontSize:13,cursor:"pointer",fontWeight:600,transition:"all 0.15s"}}>
              {shuffled?"Aleatorio":"En orden"}
            </button>
          </div>

          <div style={{height:4,background:C.border,borderRadius:4,marginBottom:20}}>
            <div style={{height:"100%",background:C.primary,borderRadius:4,width:`${((idx+1)/queue.length)*100}%`,transition:"width 0.3s"}}/>
          </div>

          {/* Card */}
          <div onClick={()=>setFlipped(f=>!f)} style={{cursor:"pointer",perspective:1000,height:"min(280px,52vw)",minHeight:200}}>
            <div style={{position:"relative",width:"100%",height:"100%",transformStyle:"preserve-3d",transform:flipped?"rotateY(180deg)":"rotateY(0deg)",transition:"transform 0.4s cubic-bezier(0.4,0,0.2,1)"}}>
              <div style={{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",background:C.surface,borderRadius:14,boxShadow:"0 2px 10px rgba(0,0,0,0.07)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,boxSizing:"border-box",border:`1.5px solid ${C.border}`}}>
                {card?.category&&<span style={{position:"absolute",top:12,left:14,fontSize:11,background:C.primaryLight,color:C.primaryDark,borderRadius:4,padding:"2px 8px",fontWeight:600,fontFamily:FONT}}>{card.category}</span>}
                <p style={{fontFamily:FONT,fontSize:"clamp(20px,5vw,28px)",fontWeight:700,textAlign:"center",color:C.text,lineHeight:1.3,margin:0}}>{card?.german}</p>
                <p style={{fontFamily:FONT,fontSize:12,color:C.textLight,marginTop:14,marginBottom:0}}>Tocá para ver la respuesta</p>
              </div>
              <div style={{position:"absolute",width:"100%",height:"100%",backfaceVisibility:"hidden",background:C.primaryLight,borderRadius:14,boxShadow:"0 2px 10px rgba(0,0,0,0.07)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,boxSizing:"border-box",transform:"rotateY(180deg)",border:`1.5px solid ${C.primary}`,gap:8}}>
                <p style={{fontFamily:FONT,fontSize:"clamp(18px,4.5vw,22px)",fontWeight:700,color:C.primaryDark,textAlign:"center",margin:0}}>
                  {card?.spanish||<span style={{color:C.textLight,fontStyle:"italic"}}>sin traducción</span>}
                </p>
                {card?.pronunciation&&<p style={{fontFamily:FONT,fontSize:14,color:C.textMuted,fontStyle:"italic",margin:0}}>/{card.pronunciation}/</p>}
                {card?.notes&&<p style={{fontFamily:FONT,fontSize:12,color:C.textMuted,textAlign:"center",margin:0}}>{card.notes}</p>}
              </div>
            </div>
          </div>

          <p style={{fontFamily:FONT,textAlign:"center",color:C.textLight,fontSize:11,margin:"8px 0 0"}}>
            {isMobile
              ? "Tocá la tarjeta para girar · botones para navegar"
              : "↑↓ girar · ← → navegar · click para girar"}
          </p>

          <div style={{display:"flex",gap:10,marginTop:16}}>
            <Btn variant="outline" onClick={()=>nav(-1)} style={{flex:1,minHeight:50}}>← Ant.</Btn>
            <Btn onClick={()=>nav(1)} style={{flex:2,minHeight:50}}>{idx+1>=queue.length?"Finalizar":"Siguiente →"}</Btn>
          </div>
        </div>
      )}
      <div style={{height:32}}/>
    </div>
  );
}
