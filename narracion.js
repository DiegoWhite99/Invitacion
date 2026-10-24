// Guion de SMIDY. Lo usan la web (subtítulos y voz) y `python3 invitacion.py voces` (genera los audios).
// "tail" es el cierre por defecto; un invitado puede traer el suyo (campo tail en guests.js).
// Variables: {first} nombre, {saludo} Querido/Querida, {msg} mensaje personal, {where} lugar.
// Si cambias un texto, vuelve a correr `python3 invitacion.py voces`.
window.NARR = {
  "intro": "¡Hola! Soy SMIDY, el agente robot de Diego. Estoy verificando tus credenciales, {first}.",
  "intro_lookup": "¡Hola! Soy SMIDY, el agente robot de Diego. No encuentro tus credenciales. Escribe tu nombre.",
  "granted": "Acceso concedido. {first}, Diego te dejó una carta muy especial.",
  "found": "Te encontré, {first}. Diego te dejó una carta muy especial.",
  "seal": "Toca el sello rojo para abrir tu carta.",
  "opening": "¡Abriendo!",
  "hi": "{saludo} {first}. Diego quiere decirte algo.",
  "msg": "{msg} {tail}",
  "tail": "Te invito a mi cena de grado como Ingeniero de Sistemas. Será un honor compartir este momento contigo.",
  "date": "La cena es el martes veintisiete de octubre, a las siete de la noche. {where} Confirma tu asistencia con el botón de abajo.",
  "yes": "¡Genial, {first}! Asistencia confirmada. Diego te espera el martes. ¡Felicitaciones al nuevo ingeniero!",
  "no": "Entendido, {first}. Diego te manda un abrazo enorme."
};

// Versión en plural para invitaciones a familias (guest.plural). Las claves que no estén aquí usan NARR.
window.NARR_PL = {
  "intro": "¡Hola! Soy SMIDY, el agente robot de Diego. Estoy verificando sus credenciales, {first}.",
  "granted": "Acceso concedido. {first}, Diego les dejó una carta muy especial.",
  "found": "Los encontré, {first}. Diego les dejó una carta muy especial.",
  "seal": "Toquen el sello rojo para abrir su carta.",
  "hi": "{saludo} {first}. Diego quiere decirles algo.",
  "tail": "Los invito a mi cena de grado como Ingeniero de Sistemas. Será un honor compartir este momento con ustedes.",
  "date": "La cena es el martes veintisiete de octubre, a las siete de la noche. {where} Confirmen su asistencia con el botón de abajo.",
  "yes": "¡Genial, {first}! Asistencia confirmada. Diego los espera el martes. ¡Felicitaciones al nuevo ingeniero!",
  "no": "Entendido, {first}. Diego les manda un abrazo enorme."
};
